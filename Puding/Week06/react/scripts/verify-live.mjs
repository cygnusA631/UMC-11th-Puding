import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

// Read-only live TMDB smoke check. The dev server loads the token; this script
// never reads, prints or saves request Authorization headers.
const base = process.env.APP_BASE_URL || "http://127.0.0.1:5178";
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const checks = [], responses = [], errors = [];
let failure;
page.on("pageerror", error => errors.push(error.message));
page.on("response", response => {
  const url = new URL(response.url());
  if (url.hostname !== "api.themoviedb.org") return;
  responses.push({ pathname: url.pathname, query: Object.fromEntries(url.searchParams), status: response.status() });
});
const check = async (name, execute) => {
  const evidence = await execute();
  checks.push({ name, passed: true, evidence });
  console.log(`PASS ${name}`);
};
try {
  let firstTitle;
  await check("Live popular pages render and fresh page-one cache avoids a new API response", async () => {
    await page.goto(base);
    const cards = page.locator("main a[aria-label$=' 상세 보기']");
    await expect(cards).toHaveCount(20, { timeout: 30000 });
    firstTitle = await cards.first().getAttribute("aria-label");
    const before = responses.filter(r => r.pathname === "/3/movie/popular" && r.query.page === "1").length;
    assert.ok(before >= 1);
    await page.getByRole("button", { name: "2페이지", exact: true }).click();
    await expect(cards).toHaveCount(20, { timeout: 30000 });
    await expect(cards.first()).not.toHaveAttribute("aria-label", firstTitle);
    await page.getByRole("button", { name: "1페이지", exact: true }).click();
    await expect(cards.first()).toHaveAttribute("aria-label", firstTitle);
    await page.waitForTimeout(500);
    const after = responses.filter(r => r.pathname === "/3/movie/popular" && r.query.page === "1").length;
    assert.equal(after, before);
    return { page1Cards: 20, page2Cards: 20, page1ResponsesBeforeReturn: before, page1ResponsesAfterReturn: after };
  });
  let selectedTitle;
  await check("Live Korean search renders actual results", async () => {
    await page.getByRole("link", { name: "검색", exact: true }).click();
    await page.getByRole("searchbox", { name: "검색어" }).fill("인셉션");
    await page.getByRole("button", { name: "검색", exact: true }).click();
    const cards = page.locator("main a[aria-label$=' 상세 보기']");
    await expect(cards.first()).toBeVisible({ timeout: 30000 });
    selectedTitle = (await cards.first().getAttribute("aria-label")).replace(/ 상세 보기$/, "");
    return { query: "인셉션", displayedCards: await cards.count(), selectedTitle };
  });
  await check("Live movie detail matches the selected result", async () => {
    await page.locator("main a[aria-label$=' 상세 보기']").first().click();
    await expect(page).toHaveURL(/\/movies\/\d+$/);
    await expect(page.getByRole("heading", { name: selectedTitle, exact: true, level: 1 })).toBeVisible({ timeout: 30000 });
    await expect.poll(() => responses.some(r => /^\/3\/movie\/\d+$/.test(r.pathname) && r.status === 200)).toBe(true);
    return { title: selectedTitle, detailUrl: new URL(page.url()).pathname };
  });
  await check("Live Devtools exposes list, search and detail cache entries", async () => {
    await page.getByRole("button", { name: /Open.*query devtools/i }).click();
    await expect(page.getByText('["movies","list",{"page":1}]', { exact: true })).toBeVisible();
    await expect(page.getByText('["movies","search",{"page":1,"query":"인셉션"}]', { exact: true })).toBeVisible();
    const keys = await page.evaluate(async () => {
      const { queryClient } = await import("/src/config/query-client.ts");
      return queryClient.getQueryCache().getAll().map(query => query.queryKey);
    });
    assert.ok(keys.some(key => key[1] === "detail"));
    assert.deepEqual(errors, []);
    return { queryKeys: keys, uncaughtRuntimeErrors: 0 };
  });
} catch (error) {
  failure = error;
  process.exitCode = 1;
  console.error(`FAIL ${error.message}`);
} finally {
  await browser.close();
  await writeFile(new URL("../../results/live-query-browser-verification.json", import.meta.url), JSON.stringify({
    verifiedAt: new Date().toISOString(), timezone: "Asia/Seoul", dataSource: "Live TMDB API, read-only browser smoke check",
    success: !failure, checks, responses, errors,
    ...(failure ? { failure: failure.message } : {}),
    note: "No screenshots or token values were captured. This is a point-in-time live check, not a guarantee of future TMDB availability.",
  }, null, 2) + "\n");
}
