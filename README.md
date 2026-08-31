# 🤝 Pactora - Closed-Loop Self-Healing Escrow Platform verified by Kane CLI

> Built for the **Kane CLI Online Hackathon** by **TestMu AI / LambdaTest**
> **License:** Apache 2.0 · **Author:** Ifeanyichukwu Onwo (`mrnetwork`)

**Pactora** is an autonomous **multi-role** SLA escrow marketplace built with Claude Code
and verified by **Kane CLI**.

Most AI-agent demos verify a single-user dashboard. Pactora verifies something a
single-user test *cannot* see: a financial invariant that only exists **between two
parties**.

---

## 🎯 The Core Idea - a bug types can't catch

Pactora enforces one cross-party invariant:

```
buyer balance + escrow balance + seller balance === $2,000   // always
```

The demo regression (`DEBIT_MULTIPLIER = 2` in `app/app/page.tsx`) makes a $500 deposit debit the buyer
$1,000. It **compiles**, it **builds**, and a unit test of the reducer in isolation
still passes - because the bug lives in the *relationship* between the Buyer and
Seller portals. Only a real browser looking at both portals at once catches it.

That is exactly what Kane CLI does.

---

## 🔁 The Closed Loop

```
  ┌──────────────────────────────────────────────────────────────┐
  │  1. Regression enters app/app/page.tsx                       │
  │     node kane_guard.js --inject                              │
  └───────────────────────────┬──────────────────────────────────┘
                              ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  2. Kane CLI drives a real browser in plain English          │
  │     kane-cli run "Click Deposit $500, verify …" --agent      │
  │     → NDJSON trace persisted to kane-traces/                 │
  └───────────────────────────┬──────────────────────────────────┘
                              ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  3. kane-guard reads the NDJSON, finds root cause,           │
  │     auto-patches app/app/page.tsx, re-dispatches Kane         │
  └───────────────────────────┬──────────────────────────────────┘
                              ▼
              ✅ 100% GREEN - re-verified in the browser
```

---

## 🚀 Quickstart

### 1. Install
```bash
npm install
```

### 2. Authenticate Kane CLI (TestMu AI account - 10,000 credits)
```bash
npm run kane:login          # → @testmuai/kane-cli login --oauth
npm run kane:balance        # check remaining credits
```

> ⚠️ **Run this from the project directory, not `~`.** `npx kane-cli` resolves to an
> unrelated package on npm - the real CLI is scoped: `@testmuai/kane-cli`. The npm
> scripts above use the local `node_modules/.bin/kane-cli`, so they always hit the
> right binary.

### 💳 Credits

Authoring a run costs credits; cached replays are free. Every inline
`kane-cli run "<objective>"` re-authors, so the suite costs credits each time it runs.

| Command | Objectives per invocation |
| --- | --- |
| `node kane_test.js` | 3 |
| `node kane_test.js --only ledger-invariant` | 1 |
| `node kane_guard.js --watch` | 1 per save (guarded) |
| `node kane_guard.js --watch --full` | 3 per save ⚠️ |

### 3. Run the app
```bash
npm run dev
```
- `/` - landing page
- `/app` - the live Buyer + Seller escrow portals (what Kane drives)

### 4. Verify with Kane CLI
```bash
node kane_test.js            # or: node kane_test.js --headless
```

> **Port note:** `next dev` silently increments the port when 3000 is taken. The
> runner probes ports 3000–3010 and positively identifies Pactora by the
> `data-app="pactora"` marker, so it never tests the wrong app. Override with
> `PACTORA_URL=http://localhost:3005 node kane_test.js`.

---

## 🧪 Reproduce the Self-Healing Demo

```bash
npm run dev                    # terminal 1

node kane_guard.js --inject    # break it  (DEBIT_MULTIPLIER 1 → 2)
node kane_test.js              # Kane catches it in the browser → NDJSON trace
node kane_guard.js --heal      # read trace → auto-patch → re-verify GREEN
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Pactora app |
| `node kane_test.js` | Run the 3-objective multi-role Kane CLI suite |
| `node kane_guard.js` | Verify; report regressions |
| `node kane_guard.js --inject` | Inject the double-deduction regression |
| `node kane_guard.js --heal` | Read NDJSON trace, auto-patch, re-verify |
| `node kane_guard.js --watch` | Re-verify on every save to `app/` |

---

## 🧾 The Verification Suite

`kane_test.js` dispatches three plain-English objectives - no selectors, no scripts:

1. **Buyer deposit locks escrow** - deposit $500 → buyer $1,500, escrow $500, status `Escrow Locked`.
2. **Cross-party ledger invariant holds** - page shows `Ledger Balanced`, total `$2,000`.
3. **Seller delivery releases funds** - deposit → deliver → release → seller paid out $500.

Every run persists an NDJSON trace to `kane-traces/<id>.ndjson`.

---

## 🗂 Repository Layout

| Path | Role |
| --- | --- |
| `app/page.tsx` | Landing page - the pitch, the loop, the Launch App CTA |
| `app/app/page.tsx` | The `/app` route: 2-column Buyer/Seller portals, escrow state machine, ledger invariant |
| `app/layout.tsx` | Root layout + `data-app="pactora"` discovery marker |
| `kane_test.js` | Kane CLI runner - port discovery, NDJSON capture, failure handoff |
| `kane_guard.js` | Self-healing watcher - inject / heal / watch |
| `kane-traces/` | Persisted NDJSON evidence from each run |
| `DEMO_SCRIPT.md` | 3-minute demo video script |
| `PACTORA_PROJECT_SPEC.md` | Master blueprint |

---

## 📄 License
Apache 2.0
