import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../src/config.js";
import { ask } from "../src/pipeline.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));

export function loadQuestions() {
  return JSON.parse(readFileSync(resolve(ROOT, "questions.json"), "utf8"))
    .questions;
}

function includesAny(text, patterns) {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(String(p).toLowerCase()));
}

function hasCitation(text) {
  return /\.md\b/i.test(text) || /sources?\s*:/i.test(text) || /\[[^\]]+\]/.test(text);
}

export function grade(item, answer) {
  const text = String(answer || "");
  const reasons = [];
  let correct = false;

  if (item.should_refuse) {
    correct = includesAny(text, item.refuse_patterns || []);
    if (!correct) reasons.push("expected a refusal");
  } else {
    const missing = (item.must_include || []).filter(
      (p) => !text.toLowerCase().includes(String(p).toLowerCase()),
    );
    correct = missing.length === 0;
    if (missing.length) reasons.push(`missing: ${missing.join(", ")}`);
  }

  const forbidden = (item.must_not_include || []).filter((p) =>
    text.toLowerCase().includes(String(p).toLowerCase()),
  );
  if (forbidden.length) {
    correct = false;
    reasons.push(`forbidden: ${forbidden.join(", ")}`);
  }

  const cited = !item.require_citation || hasCitation(text);
  if (item.require_citation && !cited) reasons.push("no citation");

  const pass = correct && cited;
  return {
    pass,
    correct,
    cited,
    reason: pass ? "ok" : reasons.join("; ") || "failed",
  };
}

export async function runEval(cfg) {
  const questions = loadQuestions();
  const results = [];
  for (const item of questions) {
    const out = await ask(item.question, cfg);
    const g = grade(item, out.answer);
    results.push({
      id: item.id,
      question: item.question,
      answer: out.answer,
      retrieved: out.retrieved,
      ...g,
    });
  }
  const passed = results.filter((r) => r.pass).length;
  const refusedOk = results.filter(
    (r, i) => questions[i].should_refuse && r.correct,
  ).length;
  const refuseN = questions.filter((q) => q.should_refuse).length;
  const citedOk = results.filter((r, i) => {
    const q = questions[i];
    return !q.require_citation || r.cited;
  }).length;
  return {
    passed,
    total: results.length,
    summary: `${passed}/${results.length} pass · refusals ${refusedOk}/${refuseN} · citations ${citedOk}/${results.length} · ${cfg.fixtures ? "fixture" : "live"}`,
    fixture: cfg.fixtures,
    results,
  };
}

function printReport(report) {
  console.log(`\nNorthline RAG eval  (${report.fixture ? "fixture" : "live"})`);
  console.log("─".repeat(64));
  for (const row of report.results) {
    const mark = row.pass ? "PASS" : "FAIL";
    console.log(`${mark}  ${row.id.padEnd(16)}  ${row.reason}`);
    if (!row.pass) {
      const preview = row.answer.replace(/\s+/g, " ").slice(0, 110);
      console.log(`      → ${preview}`);
    }
  }
  console.log("─".repeat(64));
  console.log(report.summary);
  console.log("");
}

const invokedDirectly = process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const cfg = config();
  const report = await runEval(cfg);
  printReport(report);
  process.exit(report.passed === report.total ? 0 : 1);
}
