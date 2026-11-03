// Synthetic TMDB-shaped fixtures for local Week06 verification; no live data.
// Run directly with node, or as a member of the local Postman simulation.
const http = require("node:http");
const requests = [];
const settings = new Map();
const movie = (id, title = `검증 영화 ${id}`) => ({
  id, title, original_title: `Fixture ${id}`,
  overview: "TanStack Query 검증용 합성 데이터입니다.",
  poster_path: null, backdrop_path: null, release_date: "2026-01-01",
  vote_average: 7.8, vote_count: 100, genre_ids: [28],
});

http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const send = (status, body) => {
    if (res.destroyed) return;
    res.writeHead(status);
    res.end(JSON.stringify(body));
  };
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  if (url.pathname === "/__health") { send(200, {fixture: true}); return; }
  if (url.pathname === "/__requests") { send(200, {requests}); return; }
  if (url.pathname === "/__control") {
    if (url.searchParams.has("reset")) { requests.length = 0; settings.clear(); }
    const pathname = url.searchParams.get("path");
    if (pathname) settings.set(pathname, {
      status: Number(url.searchParams.get("status") || 200),
      remaining: Number(url.searchParams.get("remaining") || -1),
      delay: Number(url.searchParams.get("delay") || 0),
    });
    send(200, {ok: true}); return;
  }
  const entry = {
    method: req.method, pathname: url.pathname,
    query: Object.fromEntries(url.searchParams),
    hasBearer: req.headers.authorization?.startsWith("Bearer ") || false,
    status: null, aborted: false,
  };
  requests.push(entry);
  res.on("close", () => { if (!res.writableEnded) entry.aborted = true; });
  const reply = (status, body) => { entry.status = status; send(status, body); };
  try {
    if (req.method !== "GET") { reply(501, {status_message: "Not modelled"}); return; }
    if (req.headers.authorization !== "Bearer mock-test-token") {
      reply(401, {status_code: 7, status_message: "Invalid fixture token"}); return;
    }
    const setting = settings.get(url.pathname);
    const delay = setting?.delay || (url.searchParams.get("query") === "slow" ? 1200 : 0);
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    if (setting && setting.status >= 400 && setting.remaining !== 0) {
      if (setting.remaining > 0) setting.remaining--;
      reply(setting.status, {status_code: 11, status_message: "Injected fixture failure"}); return;
    }
    if (url.pathname === "/3/movie/popular" || url.pathname === "/3/search/movie") {
      const page = Number(url.searchParams.get("page") || 1);
      if (!Number.isInteger(page) || page < 1 || page > 500) {
        reply(400, {status_message: "Invalid page"}); return;
      }
      const query = url.searchParams.get("query") || "";
      const title = id => query ? `${query} 검색 영화 ${id}` : `검증 영화 ${id}`;
      const results = query === "__empty__" ? [] : page === 2
        ? [movie(680, title(680))]
        : [movie(550, title(550)), movie(155, title(155))];
      reply(200, {page, results, total_pages: results.length ? 2 : 0, total_results: results.length ? 3 : 0}); return;
    }
    const detail = url.pathname.match(/^\/3\/movie\/(\d+)$/);
    if (detail) {
      const id = Number(detail[1]);
      if (![550, 155, 680].includes(id)) {
        reply(404, {status_code: 34, status_message: "Resource not found"}); return;
      }
      reply(200, {...movie(id), genres: [{id: 28, name: "액션"}], runtime: id === 155 ? null : 125, tagline: "검증용 상세 정보"}); return;
    }
    reply(501, {status_message: "Endpoint not modelled"});
  } catch (error) {
    reply(500, {status_message: String(error)});
  }
}).listen(Number(process.env.PORT || 18086), "127.0.0.1");
