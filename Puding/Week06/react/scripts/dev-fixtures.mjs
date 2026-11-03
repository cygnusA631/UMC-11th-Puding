import { spawn } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const repo = path.resolve(root, "../../..");
const children = [];
let stopping = false;
const stop = code => {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGINT");
  process.exitCode = code;
};
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
const start = (command, args, options) => {
  const child = spawn(command, args, { stdio: "inherit", ...options });
  children.push(child);
  child.on("error", error => { console.error(error.message); stop(1); });
  child.on("exit", code => { if (!stopping) stop(code ?? 1); });
};
start("postman", ["simulation", "run", "postman/simulations/week06-tmdb/week06-tmdb.sim.yaml", "--port", "18086", "--no-history"], { cwd: repo });
start(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5176"], {
  cwd: root,
  env: { ...process.env, VITE_TMDB_API_BASE_URL: "http://127.0.0.1:18086/tmdb/3", VITE_TMDB_ACCESS_TOKEN: "mock-test-token" },
});
console.log("Week06 fixtures: http://127.0.0.1:5176 (synthetic data; no live TMDB token required)");
