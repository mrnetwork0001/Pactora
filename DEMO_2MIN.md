# Pactora - 2 Minute Demo Script

## ⚠️ Read this first: real runtime vs video length

Kane drives a **real browser**. Actual wall-clock timings:

| Step | Real time |
| --- | --- |
| `node kane_test.js --only escrow-lock` (failing run) | ~60s |
| `node kane_guard.js --heal` (agent + full 3-objective re-verify) | ~3-4 min |

**You cannot do this in 2 minutes in real time. Record raw, then edit:**
- Keep at full speed: the clicks, the red LEDGER MISMATCH, Kane's verdict text, the final green
- Speed up 4-8x (or hard cut): the waiting while Kane clicks through the browser
- Total raw recording will be ~7 min -> cut to 2:00

## Pre-flight

```bash
# terminal 1 - leave running, already up
npm run dev

# confirm clean state
grep DEBIT_MULTIPLIER app/app/page.tsx     # must be = 1
npm run kane:balance
```
Two windows on screen: browser left, terminal right.

**Beat map**

| Time | Beat | Where |
| --- | --- | --- |
| 0:00-0:20 | Landing page - headline, invariant, the loop, the verdict | Vercel `/` |
| 0:20-0:35 | Launch App -> deposit, deliver, release | Vercel `/app` |
| 0:35-0:50 | Inject the regression | localhost |
| 0:50-1:20 | Kane catches it in a real browser | localhost |
| 1:20-1:50 | Agent reads the verdict, patches, 3/3 green | localhost |
| 1:50-2:00 | Close | - |

---

## 0:00-0:20 | Landing page - the thesis

Open **https://pactora-app-olive.vercel.app** (the landing page, not /app).

**Hero.** Let the headline sit on screen for a beat:
*"The bug that compiles clean and still loses your money."*

> "AI agents write code in seconds. But someone still has to open a browser to
> check it actually works. That's the gap. Pactora is a multi-role escrow
> marketplace built to live inside that gap."

**Scroll to the invariant block** - `buyer + escrow + seller === $2,000`:

> "Everything here hangs on one rule. Buyer, plus escrow, plus seller, always
> equals two thousand dollars. Notice where that rule lives: not in any single
> component - in the relationship between two parties. That's the whole point.
> No single-component test can defend it."

**Scroll through the three loop cards** - Break / Catch / Heal:

> "Break it, catch it in a real browser, heal it - without a human opening a
> browser once."

**Scroll to the objectives panel** (pause on the verdict box):

> "The tests are plain English. No selectors, no page objects. And that's the
> verdict Kane returns: a confirmed product bug, severity major, ninety-five
> percent confidence."

## 0:20-0:35 | Launch the app - it ships

Click **Launch App**.

> "No wallet, no login, no backend. Simulated ledger, deliberately - so the flow
> is deterministic for Kane. Buyer left, seller right."

Click **Deposit $500** -> buyer $1,500, escrow $500, **Escrow Locked**
Click **Mark Delivered** -> **Work Delivered**
Click **Release Funds** -> seller paid $500, **Funds Released**

> "Deposit, deliver, release. The ledger balances at every step."

## 0:35-0:50 | Break it (switch to localhost)

```bash
node kane_guard.js --inject
```

> "Now the kind of bug an agent ships on a bad day. One constant."

Show the diff: `DEBIT_MULTIPLIER = 1` -> `2`

> "A five hundred dollar deposit now debits the buyer a thousand. TypeScript
> compiles. The build passes. A unit test of the reducer still goes green.
> Nothing static catches this - the bug only exists between the two portals."

## 0:50-1:20 | Kane catches it

```bash
node kane_test.js --only escrow-lock
```

*(speed up the browser-driving portion in the edit)*

Cut to the browser: buyer at **$1,000**, banner red - **LEDGER MISMATCH**.
Then the terminal verdict:

```
reason_code : assertion_error.confirmed_product_bug
bug_title   : Buyer balance drops to $1,000 after $500 deposit
root_cause  : The deposit update is using the wrong balance math
severity    : major     confidence: 0.95
signal      : error_ui_text          | LEDGER MISMATCH
signal      : objective_contradiction| $1,000 + $500 + $0 = $1,500
```

> "Kane opened a real browser, clicked the button, looked at both portals at
> once, and returned a confirmed product bug - with root cause and the exact
> contradiction. Not a screenshot. Machine-readable NDJSON."

## 1:20-1:50 | The agent closes the loop

```bash
node kane_guard.js --heal
```

> "kane-guard reads that verdict and hands it straight to Claude Code."

Show the prompt scrolling, then the agent's own diagnosis:

> "The agent never saw our source. It got only what Kane observed in the
> browser - and found the mutation itself."

*(speed up the re-verify)* Land on:

```
RESULT: 3/3 passed
✅ CLOSED LOOP COMPLETE - Kane CLI re-ran 100% GREEN (PASS).
```

Browser: banner back to green **Ledger Balanced**.

## 1:50-2:00 | Close

> "Bug injected, caught in a real browser across two roles, patched by the agent
> from Kane's trace, re-verified green. No human opened a browser once."

Optional last frame:

```bash
PACTORA_URL=https://pactora-app-olive.vercel.app node kane_test.js
# RESULT: 3/3 passed
```

> "And it passes against production too."

---

## Reset between takes

```bash
node kane_guard.js --heal --deterministic   # instant, no agent, no credits
```
