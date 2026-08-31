#!/usr/bin/env node
/**
 * Pactora - kane-guard : the Closed-Loop Self-Healing Watcher
 * ---------------------------------------------------------------------------
 * This is the moat. It closes the loop between a code regression and a
 * verified green browser run:
 *
 *   node kane_guard.js --inject   # 1. inject the double-deduction regression
 *   node kane_guard.js            # 2. run Kane CLI, capture NDJSON failure
 *   node kane_guard.js --heal     # 3. read the trace, auto-patch, re-verify
 *   node kane_guard.js --watch    # continuous: re-verify on every file save
 *
 * The regression is a single-constant state-mutation bug in app/app/page.tsx
 * (DEBIT_MULTIPLIER), chosen because it is invisible to a type checker and to
 * a unit test of the reducer in isolation - it only manifests as a
 * cross-party financial mismatch in a live browser, which is exactly the class
 * of bug Kane CLI exists to catch.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PAGE = path.join(__dirname, "app", "app", "page.tsx");
const TRACE_DIR = path.join(__dirname, "kane-traces");
const MARKER = "KANE-INJECT:DEBIT_MULTIPLIER";
const HEALTHY = 1;
const REGRESSED = 2;

const line = (c = "=") => console.log(c.repeat(78));

/* ── Source surgery on the single injection point ─────────────────────────── */

function readPage() {
  if (!fs.existsSync(PAGE)) {
    console.error("❌ app/app/page.tsx not found.");
    process.exit(1);
  }
  return fs.readFileSync(PAGE, "utf8");
}

function currentMultiplier() {
  const m = readPage().match(
    new RegExp(`const DEBIT_MULTIPLIER = (\\d+); // ${MARKER}`)
  );
  if (!m) {
    console.error(`❌ Injection point "${MARKER}" not found in app/app/page.tsx.`);
    process.exit(1);
  }
  return Number(m[1]);
}

function setMultiplier(value) {
  const src = readPage();
  const next = src.replace(
    new RegExp(`const DEBIT_MULTIPLIER = \\d+; // ${MARKER}`),
    `const DEBIT_MULTIPLIER = ${value}; // ${MARKER}`
  );
  fs.writeFileSync(PAGE, next);
}

/* ── Kane CLI dispatch ────────────────────────────────────────────────────── */

function runKane() {
  const args = ["kane_test.js", ...process.argv.slice(2).filter((a) => a === "--headless")];
  const res = spawnSync(process.execPath, args, {
    cwd: __dirname,
    stdio: "inherit",
  });
  return res.status === 0;
}

/* ── NDJSON trace forensics ───────────────────────────────────────────────── */

/** Read every persisted NDJSON trace and pull out the failure evidence. */
function readFailureTraces() {
  if (!fs.existsSync(TRACE_DIR)) return [];
  const findings = [];
  for (const file of fs.readdirSync(TRACE_DIR)) {
    if (!file.endsWith(".ndjson")) continue;
    for (const l of fs.readFileSync(path.join(TRACE_DIR, file), "utf8").split("\n")) {
      if (!l.trim()) continue;
      let evt;
      try {
        evt = JSON.parse(l);
      } catch {
        continue;
      }
      if (evt.status !== "failed" && evt.level !== "error" && evt.type !== "error") continue;

      // Kane's run_end verdict is the richest evidence available: a confirmed
      // product-bug classification with root cause, UI signals and a fix
      // suggestion. Prefer it over a raw JSON dump so the agent gets signal.
      const v = evt.verdict || {};
      const parts = [];
      if (evt.one_liner) parts.push(evt.one_liner);
      if (v.bug_title) parts.push(`bug: ${v.bug_title}`);
      if (v.root_cause) parts.push(`root cause: ${v.root_cause}`);
      if (v.severity) parts.push(`severity: ${v.severity} (confidence ${v.confidence})`);
      for (const sig of v.signals || []) parts.push(`signal[${sig.kind}]: ${sig.excerpt}`);
      if (v.suggestion) parts.push(`suggestion: ${v.suggestion}`);
      if (evt.reason_code) parts.push(`reason_code: ${evt.reason_code}`);

      findings.push({
        trace: file,
        message: parts.length
          ? parts.join("\n     ")
          : evt.message || evt.error || evt.description || "unspecified failure",
      });
    }
  }
  return findings;
}

/* ── Commands ─────────────────────────────────────────────────────────────── */

function cmdInject() {
  line();
  console.log(" 💉 KANE-GUARD - INJECTING REGRESSION");
  line();
  if (currentMultiplier() === REGRESSED) {
    console.log(" ⚠ Regression already present (DEBIT_MULTIPLIER = 2).");
    return;
  }
  setMultiplier(REGRESSED);
  console.log(" Patched app/app/page.tsx: DEBIT_MULTIPLIER 1 → 2");
  console.log(" Effect: a $500 deposit now debits the Buyer $1,000.");
  console.log(" The type checker is happy. The ledger invariant is not.");
  console.log("\n Next: `node kane_test.js` - Kane CLI will catch it in the browser.");
}

/**
 * Build the remediation prompt handed to the coding agent. This is the actual
 * payload of the closed loop: Kane's browser-observed failure, verbatim.
 */
function buildHealPrompt(findings) {
  const evidence = findings.length
    ? findings.map((f) => `- [${f.trace}] ${f.message}`).join("\n")
    : "- (no NDJSON error events captured; audit the deposit handler directly)";

  return [
    "Kane CLI drove a real browser against the Pactora escrow app and the run FAILED.",
    "",
    "NDJSON failure evidence from kane-traces/:",
    evidence,
    "",
    "The app enforces one cross-party invariant, asserted in the UI:",
    "  buyer balance + escrow balance + seller balance === $2000",
    "",
    "A $500 deposit must debit the buyer exactly $500.",
    "Read app/app/page.tsx, find the state mutation that breaks this invariant,",
    "and fix it. Change as little as possible. Do not edit tests or the runner.",
  ].join("\n");
}

/** Hand the failure trace to Claude Code and let it patch the source. */
function healWithAgent(findings) {
  const prompt = buildHealPrompt(findings);
  console.log("\n \u{1F916} Dispatching failure trace to Claude Code...\n");
  console.log(prompt.split("\n").map((l) => `   \u2502 ${l}`).join("\n"));
  console.log("");

  const res = spawnSync(
    "claude",
    ["-p", prompt, "--allowedTools", "Read", "Edit", "--permission-mode", "acceptEdits"],
    { cwd: __dirname, stdio: "inherit" }
  );

  if (res.error || res.status !== 0) {
    console.log("\n \u26A0 Agent heal unavailable - falling back to deterministic patch.");
    return false;
  }
  return true;
}

function cmdHeal() {
  const deterministic = process.argv.includes("--deterministic");

  line();
  console.log(" \u{1F501} KANE-GUARD - CLOSED-LOOP SELF-HEAL");
  line();

  const findings = readFailureTraces();
  if (findings.length) {
    console.log("\n \u{1F4C4} NDJSON failure evidence read from kane-traces/:");
    for (const f of findings.slice(0, 8)) {
      console.log(`   [${f.trace}] ${f.message}`);
    }
  } else {
    console.log("\n \u{1F4C4} No NDJSON failure events on disk - falling back to source audit.");
  }

  if (currentMultiplier() === HEALTHY) {
    console.log("\n \u2705 app/app/page.tsx already healthy. Nothing to patch.");
  } else if (deterministic || !healWithAgent(findings)) {
    // Deterministic fallback - keeps the live demo safe if the agent is offline.
    const m = currentMultiplier();
    console.log(`\n \u{1F6E0}  Root cause: DEBIT_MULTIPLIER = ${m} in app/app/page.tsx`);
    setMultiplier(HEALTHY);
    console.log(`    Patched: DEBIT_MULTIPLIER ${m} \u2192 ${HEALTHY}`);
  } else if (currentMultiplier() !== HEALTHY) {
    console.log("\n \u26A0 Agent ran but the invariant is still broken - applying fallback patch.");
    setMultiplier(HEALTHY);
  } else {
    console.log("\n \u2705 Claude Code patched the source from Kane's trace.");
  }

  console.log("\n \u{1F52C} Re-verifying with Kane CLI...\n");
  const green = runKane();
  line();
  console.log(
    green
      ? " \u2705 CLOSED LOOP COMPLETE - Kane CLI re-ran 100% GREEN (PASS)."
      : " \u274C Still failing - inspect kane-traces/ for the remaining trace."
  );
  line();
  process.exit(green ? 0 : 1);
}

function cmdWatch() {
  // CREDIT GUARD: every inline `kane-cli run` re-authors the objective, and
  // authoring is what consumes credits. Firing the full 3-objective suite on
  // every keystroke-save is the fastest way to burn a 10,000-credit balance,
  // so watch mode runs ONE objective unless --full is passed explicitly.
  const full = process.argv.includes("--full");

  line();
  console.log(" \u{1F441}  KANE-GUARD - WATCHING app/ FOR CHANGES");
  console.log(
    full
      ? " Mode: FULL suite on every save  \u26A0 credit-hungry"
      : " Mode: single smoke objective per save (use --full for all 3)"
  );
  console.log(" Credits are spent authoring runs - check `npm run kane:balance` often.");
  line();

  let timer = null;
  let running = false;

  fs.watch(path.join(__dirname, "app"), { recursive: true }, (_e, file) => {
    if (!file || !/\.(tsx?|css)$/.test(file)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (running) return; // never stack concurrent paid runs
      running = true;
      console.log(`\n\u{1F4DD} Change detected: app/${file} - re-verifying...\n`);
      const args = ["kane_test.js"];
      if (!full) args.push("--only", "ledger-invariant");
      spawnSync(process.execPath, args, { cwd: __dirname, stdio: "inherit" });
      running = false;
    }, 1500);
  });
}

function cmdVerify() {
  line();
  console.log(" 🔬 KANE-GUARD - VERIFY");
  line();
  const green = runKane();
  if (!green) {
    console.log("\n 🔁 Regression detected. Run `node kane_guard.js --heal` to close the loop.");
  }
  process.exit(green ? 0 : 1);
}

const arg = process.argv[2];
if (arg === "--inject") cmdInject();
else if (arg === "--heal") cmdHeal();
else if (arg === "--watch") cmdWatch();
else cmdVerify();
