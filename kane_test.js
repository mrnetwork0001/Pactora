#!/usr/bin/env node
/**
 * Pactora — Kane CLI Verification Runner
 * ---------------------------------------------------------------------------
 * Dispatches plain-English browser objectives to Kane CLI and captures the
 * NDJSON trace that powers the closed-loop self-healing feedback moat.
 *
 *   node kane_test.js              # run the full multi-role suite
 *   node kane_test.js --headless   # run Chrome headless
 *
 * Kane's `--agent` flag emits one JSON object per line (NDJSON). We persist
 * every line to kane-traces/ so a failing run leaves machine-readable evidence
 * for Claude Code to patch against.
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const APP_URL_OVERRIDE = process.env.PACTORA_URL || null;
const TRACE_DIR = path.join(__dirname, "kane-traces");
const KANE_BIN = path.join(__dirname, "node_modules", ".bin", "kane-cli");
const HEADLESS = process.argv.includes("--headless");

// --only <id> restricts the run to one objective. Each inline `kane-cli run`
// re-authors the objective and costs credits, so narrowing the suite is the
// main lever for conserving a limited balance.
const ONLY = (() => {
  const i = process.argv.indexOf("--only");
  return i !== -1 ? process.argv[i + 1] : null;
})();

/**
 * The multi-role verification suite. Each objective is plain English — Kane
 * drives a real Chrome browser and asserts against the live DOM.
 */
const SUITE = [
  {
    id: "escrow-lock",
    title: "Buyer deposit locks escrow",
    objective:
      'Click the "Deposit $500" button. Verify the Buyer Portal available balance now reads $1,500, ' +
      'verify the Seller Portal escrow status reads "Escrow Locked", and verify the held in escrow amount reads $500.',
  },
  {
    id: "ledger-invariant",
    title: "Cross-party ledger invariant holds",
    objective:
      'Click the "Deposit $500" button. Verify the page shows the text "Ledger Balanced" and ' +
      'verify the ledger total reads $2,000.',
  },
  {
    id: "release-flow",
    title: "Seller delivery releases funds",
    objective:
      'Click "Deposit $500", then click "Mark Delivered", then click "Release Funds". ' +
      'Verify the Seller Portal paid out amount reads $500 and the escrow status reads "Funds Released".',
  },
];

/**
 * Locate the running Pactora server.
 *
 * `next dev` silently increments the port when 3000 is busy, and a developer
 * machine very often has an unrelated app already on 3000 — pointing Kane at
 * the wrong application is a silent, demo-killing failure. So instead of
 * trusting a hardcoded port we probe the range and positively identify Pactora
 * by the `data-app="pactora"` marker its layout renders.
 */
async function discoverAppUrl() {
  if (APP_URL_OVERRIDE) return APP_URL_OVERRIDE;

  for (let port = 3000; port <= 3010; port++) {
    const url = `http://localhost:${port}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
      const html = await res.text();
      if (html.includes('data-app="pactora"')) return url;
    } catch {
      /* port closed or not serving HTTP — keep probing */
    }
  }
  return null;
}

const line = (c = "=") => console.log(c.repeat(78));

function ensureTraceDir() {
  fs.mkdirSync(TRACE_DIR, { recursive: true });
}

function preflight() {
  if (!fs.existsSync(KANE_BIN)) {
    console.error("❌ Kane CLI not found. Run `npm install` first.");
    process.exit(1);
  }
}

/**
 * Run a single objective through Kane CLI, streaming and persisting NDJSON.
 * Resolves with { ok, status, events, traceFile }.
 */
function runObjective(test, appUrl) {
  return new Promise((resolve) => {
    const traceFile = path.join(TRACE_DIR, `${test.id}.ndjson`);
    const args = [
      "run",
      test.objective,
      "--url",
      `${appUrl}/app`, // the escrow portals live at /app; / is the landing page
      "--agent", // NDJSON output — the machine-readable failure trace
      "--final-validation",
      "on",
      "--timeout",
      "180",
    ];
    if (HEADLESS) args.push("--headless");

    console.log(`\n▶  ${test.title}`);
    console.log(`   kane-cli run "${test.objective.slice(0, 60)}…"`);

    const child = spawn(KANE_BIN, args, { cwd: __dirname });
    const out = fs.createWriteStream(traceFile);
    const events = [];
    let raw = "";
    let buffer = "";

    const consume = (chunk) => {
      out.write(chunk);
      raw += chunk.toString();
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const raw of lines) {
        if (!raw.trim()) continue;
        try {
          const evt = JSON.parse(raw);
          events.push(evt);
          // Surface step-level progress as Kane drives the browser.
          if (evt.type === "step" || evt.type === "checkpoint") {
            const label = evt.description || evt.name || evt.message || "";
            console.log(`   · ${evt.status || evt.type}: ${label}`);
          }
        } catch {
          /* non-JSON banner lines are kept in the trace file only */
        }
      }
    };

    child.stdout.on("data", consume);
    child.stderr.on("data", consume);

    child.on("error", (err) => {
      out.end();
      resolve({ ok: false, status: "spawn-error", error: err.message, events, traceFile });
    });

    child.on("close", (code) => {
      out.end();
      // An unauthenticated CLI is an environment problem, not a product
      // regression — never let it masquerade as a failing escrow assertion.
      if (/Not authenticated/i.test(raw)) {
        resolve({ ok: false, status: "unauthenticated", code, events, traceFile });
        return;
      }
      const terminal = events.find((e) => e.status === "passed" || e.status === "failed");
      const status = terminal?.status || (code === 0 ? "passed" : "failed");
      resolve({ ok: code === 0 && status === "passed", status, code, events, traceFile });
    });
  });
}

/** Pull the human-readable failure reason out of an NDJSON event stream. */
function extractFailure(events) {
  const failed = events.filter(
    (e) => e.status === "failed" || e.level === "error" || e.type === "error"
  );
  if (!failed.length) return null;
  return failed
    .map((e) => e.message || e.error || e.description || JSON.stringify(e))
    .join("\n   ");
}

async function main() {
  preflight();
  ensureTraceDir();

  const appUrl = await discoverAppUrl();
  if (!appUrl) {
    console.error("\n❌ No Pactora server found on ports 3000-3010.");
    console.error("   Start it first:  npm run dev");
    console.error("   Or point the runner at it:  PACTORA_URL=http://localhost:PORT node kane_test.js");
    process.exit(1);
  }

  const plan = ONLY ? SUITE.filter((t) => t.id === ONLY) : SUITE;
  if (ONLY && !plan.length) {
    console.error(`❌ No objective with id "${ONLY}". Known: ${SUITE.map((t) => t.id).join(", ")}`);
    process.exit(1);
  }

  line();
  console.log(" 🤝 PACTORA — Closed-Loop Kane CLI Verification Runner");
  console.log(` Target: ${appUrl}/app${HEADLESS ? " (headless)" : ""}`);
  console.log(` Suite:  ${plan.length} of ${SUITE.length} multi-role browser objectives`);
  line();

  const results = [];
  for (const test of plan) {
    const result = await runObjective(test, appUrl);

    if (result.status === "unauthenticated") {
      line();
      console.error("\n 🔐 Kane CLI is not authenticated — no tests were run.\n");
      console.error("   Authenticate with your TestMu AI account, then re-run:");
      console.error("     npx kane-cli login --oauth");
      console.error("     node kane_test.js\n");
      process.exit(2);
    }

    results.push({ ...test, ...result });
    console.log(
      result.ok
        ? `   ✅ PASS — trace: kane-traces/${test.id}.ndjson`
        : `   ❌ FAIL (${result.status}) — trace: kane-traces/${test.id}.ndjson`
    );
  }

  line();
  const passed = results.filter((r) => r.ok).length;
  console.log(` RESULT: ${passed}/${results.length} passed`);
  line();

  const failures = results.filter((r) => !r.ok);
  if (!failures.length) {
    console.log(" ✅ 100% GREEN — multi-role escrow verified end-to-end by Kane CLI.");
    process.exit(0);
  }

  // Closed-loop handoff: print the NDJSON evidence Claude Code patches against.
  console.log("\n 🔁 SELF-HEALING HANDOFF — feeding NDJSON failure trace to Claude Code:\n");
  for (const f of failures) {
    console.log(` ✗ ${f.title} [${f.id}]`);
    console.log(`   objective: ${f.objective}`);
    const reason = extractFailure(f.events);
    if (reason) console.log(`   ${reason}`);
    console.log(`   trace: kane-traces/${f.id}.ndjson\n`);
  }
  console.log(" Next: `node kane_guard.js --heal` to auto-patch app/app/page.tsx and re-verify.");
  process.exit(1);
}

main().catch((err) => {
  console.error("❌ Runner crashed:", err);
  process.exit(1);
});
