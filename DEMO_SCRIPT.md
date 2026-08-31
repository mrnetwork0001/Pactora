# 🎬 Pactora - 3-Minute Demo Video Script

> **Goal:** show Kane CLI catching a cross-party financial bug that types and unit
> tests cannot see, then show Claude Code closing the loop to a 100% GREEN run.

**Setup before recording**
```bash
npm install
npm run kane:login     # TestMu AI account (10,000 Kane credits)
npm run dev                    # leave running in terminal 1
```
Have two panes visible: browser (Pactora) on the left, terminal on the right.

---

## [0:00–0:25] The Problem

> "AI agents write code in seconds. But someone still has to open a browser and
> check whether the feature actually *works*. That gap is where regressions
> live - and it gets worse when a bug only appears **between two users**."

Show Pactora: Buyer Portal ($2,000) on the left, Seller Portal on the right,
and the green **Ledger Balanced** banner across the top.

> "Pactora is a multi-role escrow marketplace. The invariant that matters isn't
> in any one component - it's across both parties: buyer + escrow + seller must
> always equal $2,000."

## [0:25–0:55] The Happy Path

Click **Deposit $500** → Buyer drops to $1,500, escrow holds $500, status flips
to **Escrow Locked**, banner stays green.
Click **Mark Delivered** → **Work Delivered**, SLA reads "Delivered in 41h · SLA met".
Click **Release Funds** → Seller paid out $500, status **Funds Released**.

> "Three roles, one contract, and a ledger that always balances."

## [0:55–1:20] Inject the Regression

```bash
node kane_guard.js --inject
```

> "Now let's do what an AI agent does on a bad day - a one-character state
> mutation bug."

Show the diff: `DEBIT_MULTIPLIER = 1` → `2`.

> "A $500 deposit now debits the buyer $1,000. TypeScript compiles. The build
> passes. A unit test of the reducer in isolation still passes. Nothing catches
> this - because the bug only exists in the *relationship* between two portals."

## [1:20–2:05] Kane CLI Catches It

```bash
node kane_test.js
```

> "Kane CLI takes plain English and drives a real browser."

Let the objectives scroll:
`Click the "Deposit $500" button. Verify the Buyer Portal available balance now reads $1,500…`

Kane fails. Show the browser: Buyer at **$1,000**, banner flipped red to
**Ledger Mismatch - $1,500**.

> "Kane caught the cross-party financial mismatch in the live DOM, and wrote an
> NDJSON trace - machine-readable evidence, not a screenshot."

Show `kane-traces/escrow-lock.ndjson`.

## [2:05–2:45] Claude Code Closes the Loop

```bash
node kane_guard.js --heal
```

> "kane-guard reads the NDJSON failure trace, identifies the root cause, patches
> `app/app/page.tsx`, and re-dispatches Kane automatically."

Show: trace evidence → root cause → `DEBIT_MULTIPLIER 2 → 1` → Kane re-runs.

Land on:
```
✅ CLOSED LOOP COMPLETE - Kane CLI re-ran 100% GREEN (PASS).
```
Browser: banner back to green **Ledger Balanced**.

## [2:45–3:00] The Close

> "Bug injected, caught in a real browser across two roles, auto-patched from the
> trace, and re-verified green - no human opened a browser once. That's Kane CLI
> as multi-role browser ground truth for AI coding agents."

---

## One-Command Reproduction

```bash
npm run dev                    # terminal 1
node kane_guard.js --inject    # terminal 2 - break it
node kane_test.js              # watch Kane catch it
node kane_guard.js --heal      # watch the loop close GREEN
```
