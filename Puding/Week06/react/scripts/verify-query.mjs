import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { mock } from "node:test";
import { createServer } from "vite";
import { QueryObserver, isCancelledError } from "@tanstack/react-query";

// Exercises the application's actual TS query options and shared QueryClient.
// Start the local Postman simulation first; never run concurrently with another
// verifier that changes this fixture's controls or request log.
const root = path.resolve(import.meta.dirname, "..");
const mockBase = (process.env.MOCK_BASE_URL || "http://127.0.0.1:18086/tmdb").replace(/\/+$/, "");
const resultPath = path.resolve(root, "../results/query-verification.json");
const checks = [];
let vite;
let queryClient;
let fakeTimersEnabled = false;
let failure;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function control(values = {}) {
  const url = new URL(`${mockBase}/__control`);
  for (const [key, value] of Object.entries(values)) url.searchParams.set(key, String(value));
  const response = await fetch(url);
  assert.equal(response.status, 200, "Fixture control must be available");
}
async function requests() {
  const response = await fetch(`${mockBase}/__requests`);
  assert.equal(response.status, 200, "Fixture request log must be available");
  return (await response.json()).requests;
}
async function reset() {
  queryClient.clear();
  await control({ reset: 1 });
}
async function check(name, execute) {
  const started = performance.now();
  try {
    const evidence = await execute();
    checks.push({ name, passed: true, evidence, elapsedMs: Math.round(performance.now() - started) });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, passed: false, error: error.message });
    throw error;
  }
}

try {
  vite = await createServer({
    root,
    configFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true },
    define: {
      "import.meta.env.VITE_TMDB_API_BASE_URL": JSON.stringify(`${mockBase}/3`),
      "import.meta.env.VITE_TMDB_ACCESS_TOKEN": JSON.stringify("mock-test-token"),
    },
  });
  ({ queryClient } = await vite.ssrLoadModule("/src/config/query-client.ts"));
  const { movieQueries } = await vite.ssrLoadModule("/src/api/movies/movie-query-options.ts");

  await check("List pages retain distinct data and reuse fresh page-one cache", async () => {
    await reset();
    const pageOne = await queryClient.fetchQuery(movieQueries.list(1));
    const pageTwo = await queryClient.fetchQuery(movieQueries.list(2));
    const pageOneAgain = await queryClient.fetchQuery(movieQueries.list(1));
    assert.deepEqual(pageOne.results.map((movie) => movie.id), [550, 155]);
    assert.deepEqual(pageTwo.results.map((movie) => movie.id), [680]);
    assert.deepEqual(pageOneAgain, pageOne);
    const log = await requests();
    assert.equal(log.length, 2);
    assert.equal(log.filter((request) => request.query.page === "1").length, 1);
    assert.ok(log.every((request) => request.hasBearer && request.status === 200));
    return { pageOneIds: [550, 155], pageTwoIds: [680], httpRequests: log.length, pageOneHttpRequests: 1 };
  });

  await check("Search cache separates keywords/pages and normalizes surrounding whitespace", async () => {
    await reset();
    const alpha = await queryClient.fetchQuery(movieQueries.search("  alpha  ", 1));
    const alphaAgain = await queryClient.fetchQuery(movieQueries.search("alpha", 1));
    const beta = await queryClient.fetchQuery(movieQueries.search("beta", 1));
    const alphaPageTwo = await queryClient.fetchQuery(movieQueries.search("alpha", 2));
    assert.deepEqual(alphaAgain, alpha);
    assert.notEqual(alpha.results[0].title, beta.results[0].title);
    assert.deepEqual(alphaPageTwo.results.map((movie) => movie.id), [680]);
    const log = await requests();
    assert.equal(log.length, 3);
    assert.deepEqual(log.map((request) => [request.query.query, request.query.page]), [["alpha", "1"], ["beta", "1"], ["alpha", "2"]]);
    return { httpRequests: 3, keywordAndPagePairs: log.map((request) => [request.query.query, request.query.page]) };
  });

  await check("Movie detail IDs retain separate cache entries", async () => {
    await reset();
    const first = await queryClient.fetchQuery(movieQueries.detail(550));
    const second = await queryClient.fetchQuery(movieQueries.detail(155));
    const firstAgain = await queryClient.fetchQuery(movieQueries.detail(550));
    assert.equal(first.id, 550);
    assert.equal(second.id, 155);
    assert.equal(second.runtime, null);
    assert.deepEqual(firstAgain, first);
    const log = await requests();
    assert.equal(log.length, 2);
    return { detailIds: [first.id, second.id], httpRequests: 2, cachedRepeatId: firstAgain.id };
  });

  await check("Disabled empty search and invalid IDs do not start HTTP requests", async () => {
    await reset();
    const observers = [
      new QueryObserver(queryClient, movieQueries.search("   ")),
      new QueryObserver(queryClient, movieQueries.detail(0)),
      new QueryObserver(queryClient, movieQueries.detail(Number.NaN)),
    ];
    const unsubscribe = observers.map((observer) => observer.subscribe(() => {}));
    try {
      await wait(30);
      const state = observers[0].getCurrentResult();
      assert.equal(state.status, "pending");
      assert.equal(state.fetchStatus, "idle");
      assert.equal(state.isPending, true);
      assert.equal(state.isLoading, false);
      assert.equal((await requests()).length, 0);
      return { httpRequests: 0, emptySearch: { status: state.status, fetchStatus: state.fetchStatus, isPending: state.isPending, isLoading: state.isLoading } };
    } finally {
      unsubscribe.forEach((stop) => stop());
    }
  });

  await check("Empty results are a successful response rather than a query error", async () => {
    await reset();
    const options = movieQueries.search("__empty__");
    const data = await queryClient.fetchQuery(options);
    const state = queryClient.getQueryState(options.queryKey);
    assert.deepEqual(data.results, []);
    assert.equal(state.status, "success");
    assert.equal(state.error, null);
    return { resultCount: 0, queryStatus: state.status, httpRequests: (await requests()).length };
  });

  await check("HTTP 401 is not automatically retried", async () => {
    await reset();
    await control({ path: "/3/search/movie", status: 401, remaining: 99 });
    await assert.rejects(queryClient.fetchQuery(movieQueries.search("unauthorized")), (error) => error.response?.status === 401);
    const log = await requests();
    assert.equal(log.length, 1);
    assert.equal(log[0].status, 401);
    return { statuses: log.map((request) => request.status), totalAttempts: 1 };
  });

  await check("A transient HTTP 500 retries once and recovers", async () => {
    await reset();
    await control({ path: "/3/search/movie", status: 500, remaining: 1 });
    const data = await queryClient.fetchQuery(movieQueries.search("recover"));
    assert.equal(data.results.length, 2);
    const log = await requests();
    assert.deepEqual(log.map((request) => request.status), [500, 200]);
    return { statuses: [500, 200], totalAttempts: 2, recovered: true };
  });

  await check("Persistent HTTP 500 stops after two total attempts", async () => {
    await reset();
    await control({ path: "/3/search/movie", status: 500, remaining: 99 });
    await assert.rejects(queryClient.fetchQuery(movieQueries.search("persistent-error")), (error) => error.response?.status === 500);
    const log = await requests();
    assert.deepEqual(log.map((request) => request.status), [500, 500]);
    return { statuses: [500, 500], totalAttempts: 2, kyRetries: 0 };
  });

  await check("Client cancellation settles the query and ignores delayed upstream completion", async () => {
    await reset();
    await control({ path: "/3/search/movie", status: 200, delay: 1200 });
    const options = movieQueries.search("cancel-me");
    const outcome = queryClient.fetchQuery(options).then(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    const deadline = Date.now() + 3000;
    while ((await requests()).length === 0 && Date.now() < deadline) await wait(15);
    assert.equal((await requests()).length, 1, "Delayed request must start before cancellation");
    await queryClient.cancelQueries({ queryKey: options.queryKey, exact: true });
    const result = await outcome;
    assert.ok(isCancelledError(result.error));
    const state = queryClient.getQueryState(options.queryKey);
    assert.equal(state.fetchStatus, "idle");
    assert.equal(state.data, undefined);
    // The Postman reverse proxy may finish its upstream request after the
    // consumer disconnects. Assert client/cache behavior after that completion
    // rather than requiring the proxy to forward the disconnect upstream.
    await wait(1300);
    const log = await requests();
    assert.equal(log.length, 1);
    const settled = queryClient.getQueryState(options.queryKey);
    assert.equal(settled.fetchStatus, "idle");
    assert.equal(settled.data, undefined, "A late upstream response must not populate a cancelled query");

    // Independently call the actual queryFn to prove its provided AbortSignal
    // reaches the HTTP client, without relying on proxy-side close events.
    const controller = new AbortController();
    const directOptions = movieQueries.search("cancel-direct-api");
    const directOutcome = directOptions.queryFn({
      signal: controller.signal,
      queryKey: directOptions.queryKey,
      client: queryClient,
      meta: undefined,
    }).then((value) => ({ value }), (error) => ({ error }));
    const directDeadline = Date.now() + 3000;
    while ((await requests()).length < 2 && Date.now() < directDeadline) await wait(15);
    assert.equal((await requests()).length, 2, "Direct API request must start before aborting");
    controller.abort();
    const directResult = await directOutcome;
    assert.equal(directResult.error?.name, "AbortError");
    return {
      cancellationError: result.error.constructor.name,
      fetchStatus: settled.fetchStatus,
      noCachedDataAfterDelayedCompletion: true,
      directApiAbortError: directResult.error.name,
      httpRequests: 2,
      upstreamAbortObserved: Boolean(log[0].aborted),
      upstreamStatusAfterDelay: log[0].status,
      proxyNote: "Upstream disconnect propagation is not assumed; the local reverse proxy can finish upstream work after client cancellation.",
    };
  });

  // Close Vite before changing timers so its watcher/HMR timers are unaffected.
  await reset();
  const listOptions = movieQueries.list(1);
  const detailOptions = movieQueries.detail(550);
  const listData = await queryClient.fetchQuery(listOptions);
  await queryClient.fetchQuery(detailOptions);
  const listQuery = queryClient.getQueryCache().find({ queryKey: listOptions.queryKey, exact: true });
  const detailQuery = queryClient.getQueryCache().find({ queryKey: detailOptions.queryKey, exact: true });
  const listUpdatedAt = listQuery.state.dataUpdatedAt;
  const detailUpdatedAt = detailQuery.state.dataUpdatedAt;
  await vite.close();
  vite = undefined;
  mock.timers.enable({ apis: ["Date"], now: Date.now() });
  fakeTimersEnabled = true;

  await check("Actual 60-second list and 30-second detail stale boundaries (virtual Date)", async () => {
    assert.equal(listQuery.options.staleTime, 60_000);
    assert.equal(detailQuery.options.staleTime, 30_000);
    mock.timers.setTime(detailUpdatedAt + 29_999);
    assert.equal(detailQuery.isStaleByTime(detailQuery.options.staleTime), false);
    mock.timers.setTime(detailUpdatedAt + 30_000);
    assert.equal(detailQuery.isStaleByTime(detailQuery.options.staleTime), true);
    mock.timers.setTime(listUpdatedAt + 59_999);
    assert.equal(listQuery.isStaleByTime(listQuery.options.staleTime), false);
    mock.timers.setTime(listUpdatedAt + 60_000);
    assert.equal(listQuery.isStaleByTime(listQuery.options.staleTime), true);
    assert.ok(queryClient.getQueryData(listOptions.queryKey), "Becoming stale must not delete cached data");
    return { clock: "Node MockTimers Date; not elapsed wall-clock time", listFreshAtMs: 59_999, listStaleAtMs: 60_000, detailFreshAtMs: 29_999, detailStaleAtMs: 30_000, staleDataRetained: true };
  });

  // Clear timers created by real setTimeout before installing virtual timers.
  queryClient.clear();
  mock.timers.reset();
  fakeTimersEnabled = false;
  mock.timers.enable({ apis: ["Date", "setTimeout"], now: Date.now() });
  fakeTimersEnabled = true;

  await check("Actual five-minute GC starts after last observer leaves (virtual timers)", async () => {
    queryClient.setQueryData(listOptions.queryKey, listData);
    const observer = new QueryObserver(queryClient, listOptions);
    const unsubscribe = observer.subscribe(() => {});
    const cached = () => queryClient.getQueryCache().find({ queryKey: listOptions.queryKey, exact: true });
    assert.equal(cached().options.gcTime, 300_000);
    mock.timers.tick(300_001);
    assert.ok(cached(), "A query with an observer must remain in cache");
    unsubscribe();
    mock.timers.tick(299_999);
    assert.ok(cached(), "Inactive cache must survive until the configured deadline");
    mock.timers.tick(1);
    assert.equal(cached(), undefined, "Inactive cache must be removed at five minutes");
    return { clock: "Node MockTimers Date+setTimeout; not elapsed wall-clock time", retainedWhileObservedMs: 300_001, inactiveRetainedAtMs: 299_999, inactiveRemovedAtMs: 300_000 };
  });
} catch (error) {
  failure = error;
  process.exitCode = 1;
  console.error(`FAIL ${error.message}`);
} finally {
  queryClient?.clear();
  if (fakeTimersEnabled) mock.timers.reset();
  if (vite) await vite.close();
  // Leave the shared fixture ready for the separately coordinated browser run.
  try { await control({ reset: 1 }); } catch { /* Preserve the primary failure. */ }
  await mkdir(path.dirname(resultPath), { recursive: true });
  await writeFile(resultPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    dataSource: "Local Postman simulation with synthetic TMDB-shaped fixtures; NOT live TMDB",
    importedSource: ["src/config/query-client.ts", "src/api/movies/movie-query-options.ts"],
    success: !failure,
    passed: checks.filter((item) => item.passed).length,
    total: checks.length,
    checks,
    ...(failure ? { failure: failure.message } : {}),
  }, null, 2) + "\n");
}
