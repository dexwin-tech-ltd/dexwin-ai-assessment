import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { ask, getIndex, resetIndex } from "./pipeline.js";
import { runEval } from "../eval/score.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "public");
const cfg = config();

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      const { docs, chunks } = getIndex();
      return json(res, {
        ok: true,
        fixtureMode: cfg.fixtures,
        model: cfg.fixtures ? "fixture" : cfg.model,
        docs: docs.length,
        chunks: chunks.length,
      });
    }

    if (req.method === "POST" && url.pathname === "/api/ask") {
      const body = await readJson(req);
      const result = await ask(body.question, cfg);
      return json(res, result);
    }

    if (req.method === "POST" && url.pathname === "/api/eval") {
      const report = await runEval(cfg);
      return json(res, report);
    }

    if (req.method === "POST" && url.pathname === "/api/reindex") {
      resetIndex();
      const { docs, chunks } = getIndex();
      return json(res, { ok: true, docs: docs.length, chunks: chunks.length });
    }

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      return sendFile(res, join(PUBLIC, "index.html"));
    }

    if (req.method === "GET") {
      const safe = url.pathname.replace(/^\/+/, "");
      if (!safe.includes("..")) {
        const file = join(PUBLIC, safe);
        if (existsSync(file)) return sendFile(res, file);
      }
    }

    json(res, { error: "Not found" }, 404);
  } catch (err) {
    json(res, { error: err.message || String(err) }, 500);
  }
});

function sendFile(res, file) {
  const type = TYPES[extname(file)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  res.end(readFileSync(file));
}

function json(res, body, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8") || "{}";
      try {
        resolveBody(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

server.listen(cfg.port, () => {
  const mode = cfg.fixtures ? "FIXTURE" : `LIVE (${cfg.model})`;
  console.log(`Northline ops assistant  http://localhost:${cfg.port}  [${mode}]`);
});
