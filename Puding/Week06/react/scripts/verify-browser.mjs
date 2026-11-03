import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const base = process.env.APP_BASE_URL || "http://127.0.0.1:5176";
const mock = process.env.MOCK_BASE_URL || "http://127.0.0.1:18086/tmdb";
const checks = [];
const errors = [];
const requests = [];
let failure;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
const control = async (params = {}) => {
  const response = await fetch(`${mock}/__control?${new URLSearchParams(params)}`);
  assert.equal(response.status, 200);
};
const check = async (name, run) => {
  const evidence = await run();
  checks.push({ name, passed: true, ...(evidence ? { evidence } : {}) });
  console.log(`PASS ${name}`);
};
const setup = async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => {
    if (!request.url().startsWith(`${mock}/3/`)) return;
    const url = new URL(request.url());
    const entry = { pathname: url.pathname, query: Object.fromEntries(url.searchParams), status: null, failure: null };
    requests.push(entry);
    request._week06Entry = entry;
  });
  page.on("response", response => { if (response.request()._week06Entry) response.request()._week06Entry.status = response.status(); });
  page.on("requestfailed", request => { if (request._week06Entry) request._week06Entry.failure = request.failure()?.errorText; });
  return { context, page };
};
const count = (path, query) => requests.filter(r => r.pathname.endsWith(path) && (!query || Object.entries(query).every(([k, v]) => r.query[k] === String(v)))).length;
const submit = async (page, query) => {
  await page.getByRole("searchbox", { name: "검색어" }).fill(query);
  await page.getByRole("button", { name: "검색", exact: true }).click();
};
const state = (page, key) => page.evaluate(async key => {
  const { queryClient } = await import("/src/config/query-client.ts");
  const query = queryClient.getQueryCache().find({ queryKey: key, exact: true });
  return query ? {
    status: query.state.status, fetchStatus: query.state.fetchStatus,
    isStale: query.isStale(), observers: query.getObserversCount(),
    gcTime: query.gcTime, hasData: query.state.data !== undefined,
  } : null;
}, key);

try {
  await control({ reset: "1" });
  let { context, page } = await setup();
  await check("Initial loading, list pagination and fresh cache reuse", async () => {
    await control({ path: "/3/movie/popular", delay: "600" });
    await page.goto(base);
    await expect(page.getByRole("status").filter({ hasText: "영화 목록을 불러오는 중" })).toBeVisible();
    await expect(page.getByRole("link", { name: "검증 영화 550 상세 보기", exact: true })).toBeVisible();
    await control({ path: "/3/movie/popular", delay: "0" });
    const before = count("/3/movie/popular", { page: 1 });
    await page.getByRole("button", { name: "2페이지", exact: true }).click();
    await expect(page.getByRole("link", { name: "검증 영화 680 상세 보기", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "1페이지", exact: true }).click();
    await expect(page.getByRole("link", { name: "검증 영화 550 상세 보기", exact: true })).toBeVisible();
    await page.waitForTimeout(150);
    assert.equal(count("/3/movie/popular", { page: 1 }), before);
    return { page1RequestsBeforeReturn: before, page1RequestsAfterReturn: before };
  });
  await check("Empty and whitespace searches are disabled with an input prompt", async () => {
    await page.getByRole("link", { name: "검색", exact: true }).click();
    const before = count("/3/search/movie");
    await expect(page.getByRole("status")).toHaveText("검색어를 입력해 주세요.");
    await submit(page, "   ");
    await page.waitForTimeout(150);
    assert.equal(count("/3/search/movie"), before);
    const query = await state(page, ["movies", "search", { query: "", page: 1 }]);
    assert.equal(query.status, "pending");
    assert.equal(query.fetchStatus, "idle");
    return { requestsAdded: 0, status: query.status, fetchStatus: query.fetchStatus };
  });
  await check("Search keys isolate normalized text and page and reuse matching cache", async () => {
    await submit(page, "  alpha  ");
    await expect(page.getByRole("link", { name: "alpha 검색 영화 550 상세 보기", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "2페이지", exact: true }).click();
    await expect(page.getByRole("link", { name: "alpha 검색 영화 680 상세 보기", exact: true })).toBeVisible();
    const before = count("/3/search/movie", { query: "alpha", page: 1 });
    await page.getByRole("button", { name: "1페이지", exact: true }).click();
    await expect(page.getByRole("link", { name: "alpha 검색 영화 550 상세 보기", exact: true })).toBeVisible();
    await submit(page, "beta");
    await expect(page.getByRole("link", { name: "beta 검색 영화 550 상세 보기", exact: true })).toBeVisible();
    await submit(page, "alpha");
    await expect(page.getByRole("link", { name: "alpha 검색 영화 550 상세 보기", exact: true })).toBeVisible();
    assert.equal(count("/3/search/movie", { query: "alpha", page: 1 }), before);
    return { alphaPage1RequestsBeforeReturn: before, alphaPage1RequestsAfterReturn: before };
  });
  await check("A successful empty response renders the empty-result UI", async () => {
    await submit(page, "__empty__");
    await expect(page.getByRole("status")).toHaveText("검색 결과가 없어요.");
  });
  await check("A canceled slow search cannot overwrite the next search", async () => {
    const requested = page.waitForRequest(request => request.url().includes("query=slow"));
    await submit(page, "slow");
    await requested;
    const canceled = page.waitForEvent("requestfailed", request => request.url().includes("query=slow"));
    await submit(page, "newer");
    await canceled;
    await expect(page.getByRole("link", { name: "newer 검색 영화 550 상세 보기", exact: true })).toBeVisible();
    await page.waitForTimeout(1400);
    await expect(page.getByRole("link", { name: "newer 검색 영화 550 상세 보기", exact: true })).toBeVisible();
    assert.equal((await state(page, ["movies", "search", { query: "slow", page: 1 }])).fetchStatus, "idle");
  });
  await check("A 500 response is retried once, then manual retry recovers", async () => {
    await control({ path: "/3/search/movie", status: "500", remaining: "-1" });
    const before = count("/3/search/movie", { query: "failure" });
    await submit(page, "failure");
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
    assert.equal(count("/3/search/movie", { query: "failure" }) - before, 2);
    await control({ path: "/3/search/movie", status: "200" });
    await page.getByRole("button", { name: "다시 시도", exact: true }).click();
    await expect(page.getByRole("link", { name: "failure 검색 영화 550 상세 보기", exact: true })).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    return { failedAttemptsIncludingAutomaticRetry: 2, manualRetryRecovered: true };
  });
  await check("Detail keys isolate movie IDs and Devtools shows real cached queries", async () => {
    await page.getByRole("link", { name: "failure 검색 영화 550 상세 보기", exact: true }).click();
    await expect(page.getByRole("heading", { name: "검증 영화 550", exact: true })).toBeVisible();
    const before = count("/3/movie/550");
    await page.getByRole("link", { name: "영화", exact: true }).click();
    await page.getByRole("link", { name: "검증 영화 155 상세 보기", exact: true }).click();
    await expect(page.getByRole("heading", { name: "검증 영화 155", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "영화", exact: true }).click();
    await page.getByRole("link", { name: "검증 영화 550 상세 보기", exact: true }).click();
    await expect(page.getByRole("heading", { name: "검증 영화 550", exact: true })).toBeVisible();
    assert.equal(count("/3/movie/550"), before);
    await page.getByRole("button", { name: /Open.*query devtools/i }).click();
    await expect(page.getByText('["movies","detail",550]', { exact: true })).toBeVisible();
    await expect(page.getByText('["movies","list",{"page":1}]', { exact: true })).toBeVisible();
    // Devtools displays the canonical query hash with sorted object keys.
    await expect(page.getByText('["movies","search",{"page":2,"query":"alpha"}]', { exact: true })).toBeVisible();
    return { detail550RequestsBeforeReturn: before, detail550RequestsAfterReturn: before };
  });
  await context.close();

  ({ context, page } = await setup());
  await check("Invalid IDs do not fetch, and a missing movie renders a 404 message", async () => {
    const before = requests.length;
    await page.goto(`${base}/movies/0`);
    await expect(page.getByRole("alert")).toContainText("올바르지 않은 영화 번호예요.");
    assert.equal(requests.length, before);
    await page.goto(`${base}/movies/999`);
    await expect(page.getByRole("alert")).toContainText("영화를 찾을 수 없어요.");
    assert.equal(count("/3/movie/999"), 1);
  });
  await context.close();

  ({ context, page } = await setup());
  await page.clock.install();
  await check("Actual 30s detail staleTime expires without polling and refetches on remount", async () => {
    await page.goto(`${base}/movies/550`);
    await expect(page.getByRole("heading", { name: "검증 영화 550", exact: true })).toBeVisible();
    const key = ["movies", "detail", 550];
    assert.equal((await state(page, key)).isStale, false);
    const before = count("/3/movie/550");
    await page.clock.fastForward(31_000);
    assert.equal((await state(page, key)).isStale, true);
    assert.equal(count("/3/movie/550"), before);
    await page.getByRole("link", { name: "영화", exact: true }).click();
    await page.getByRole("link", { name: "검증 영화 550 상세 보기", exact: true }).click();
    await expect.poll(() => count("/3/movie/550")).toBe(before + 1);
    await expect.poll(async () => (await state(page, key)).fetchStatus).toBe("idle");
    return { clock: "Playwright browser virtual clock; production 30000ms option unchanged", requestAddedAtStaleTransition: 0, requestAddedOnRemount: 1 };
  });
  await context.close();

  ({ context, page } = await setup());
  await page.clock.install();
  await check("Stale background errors keep cached movies visible and retry recovers", async () => {
    await page.goto(base);
    const card = page.getByRole("link", { name: "검증 영화 550 상세 보기", exact: true });
    await expect(card).toBeVisible();
    await page.getByRole("link", { name: "검색", exact: true }).click();
    await page.clock.fastForward(61_000);
    await control({ path: "/3/movie/popular", status: "500", remaining: "-1", delay: "500" });
    await page.getByRole("link", { name: "영화", exact: true }).click();
    await expect(card).toBeVisible();
    await expect(page.getByRole("status")).toContainText("최신 영화 목록을 확인");
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
    await expect(card).toBeVisible();
    await control({ path: "/3/movie/popular", status: "200", delay: "0" });
    await page.getByRole("button", { name: "다시 시도", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(card).toBeVisible();
  });
  await context.close();

  ({ context, page } = await setup());
  await page.clock.install();
  await check("Actual 5m gcTime preserves active cache and removes inactive cache", async () => {
    await page.goto(base);
    await expect(page.getByRole("link", { name: "검증 영화 550 상세 보기", exact: true })).toBeVisible();
    const key = ["movies", "list", { page: 1 }];
    assert.equal((await state(page, key)).gcTime, 300_000);
    await page.clock.fastForward(300_100);
    assert.equal((await state(page, key)).hasData, true);
    await page.getByRole("link", { name: "검색", exact: true }).click();
    await expect.poll(async () => (await state(page, key)).observers).toBe(0);
    await page.clock.fastForward(299_000);
    assert.equal((await state(page, key)).hasData, true);
    await page.clock.fastForward(1_100);
    assert.equal(await state(page, key), null);
    return { clock: "Playwright browser virtual clock; production 300000ms option unchanged", activeCacheAfter300100ms: "present", inactiveCacheAfter299000ms: "present", inactiveCacheAfter300100ms: "removed" };
  });
  await context.close();
  assert.deepEqual(errors, []);
  checks.push({ name: "No uncaught browser runtime errors", passed: true });
} catch (error) {
  failure = error;
  throw error;
} finally {
  await browser.close();
  await mkdir(new URL("../../results/", import.meta.url), { recursive: true });
  await writeFile(new URL("../../results/query-browser-verification.json", import.meta.url), JSON.stringify({
    verifiedAt: new Date().toISOString(), timezone: "Asia/Seoul", dataSource: "local Postman simulation; synthetic TMDB-shaped fixtures, NOT live TMDB",
    success: !failure, checks, errors, requests,
    ...(failure ? { failure: failure.message } : {}),
    note: "No screenshots were captured. Time-based checks use the browser virtual clock with production option values unchanged.",
  }, null, 2) + "\n");
}
