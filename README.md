<div align="center">

# Pactora

**A multi-role escrow marketplace that catches the bug your type checker can't see.**

Built with Claude Code · Verified by [Kane CLI](https://www.testmuai.com/kane-cli/) · Apache 2.0

**[▶ Live app](https://pactora-app-olive.vercel.app/app)** · **[Landing](https://pactora-app-olive.vercel.app)**

*Kane CLI verifies this deployment: 3/3 objectives green in production.*

`Ships` · `Verified` · `Closed loop` · `Craft`

</div>

---

## The 60-second version

Pactora is an autonomous multi-role escrow & SLA marketplace. A Buyer deposits into escrow,
a Seller delivers, funds release - or a dispute refunds. Standard stuff.

The interesting part is what makes it **correct**. Pactora enforces one invariant:

```
buyer balance + escrow balance + seller balance === $2,000     // always
```

That rule doesn't live in any single component. It lives in the *relationship between two
parties*. So we broke it on purpose:

```js
const DEBIT_MULTIPLIER = 2;   // a $500 deposit now debits the buyer $1,000
```

This regression **compiles**. It **builds**. A unit test of the reducer in isolation still
passes. Every static tool in the stack says the code is fine.

Kane CLI opened a real browser, clicked the button, looked at both portals at once, and
returned this:

```json
{
  "reason_code": "assertion_error.confirmed_product_bug",
  "bug_title":   "Buyer balance drops to $1,000 after $500 deposit",
  "root_cause":  "The deposit update is using the wrong balance math",
  "severity":    "major",
  "confidence":  0.95,
  "signals": [
    { "kind": "error_ui_text",           "excerpt": "LEDGER MISMATCH" },
    { "kind": "objective_contradiction", "excerpt": "$1,000 + $500 + $0 = $1,500" }
  ]
}
```

`kane-guard` then handed that verdict to Claude Code, which patched the source itself, and
Kane re-ran every objective to a **100% green pass**. No human opened a browser at any point.

---

## Quickstart

**Fastest path (no install):** open **[https://pactora-app-olive.vercel.app/app](https://pactora-app-olive.vercel.app/app)** and click `Deposit $500`.
No wallet, no login, no setup.

```bash
git clone https://github.com/mrnetwork0001/Pactora.git
cd Pactora
npm install
npm run dev
```

Open **http://localhost:3000** - landing page. **/app** - the live Buyer + Seller portals.

No wallet. No login. No backend. Click `Deposit $500` and watch both portals move.

> **Port note:** `next dev` silently increments the port when 3000 is busy. The Kane runner
> probes 3000-3010 and identifies Pactora by the `data-app="pactora"` marker its layout
> renders, so it can never verify the wrong application. Override with
> `PACTORA_URL=http://localhost:3005 node kane_test.js`.

### Run the verification

```bash
npm run kane:login        # TestMu AI account (OAuth)
npm run kane:balance      # check credits
node kane_test.js         # 3 plain-English browser objectives (local)
```

Kane can drive the **live deployment** just as easily - this is the exact URL judges open:

```bash
PACTORA_URL=https://pactora-app-olive.vercel.app node kane_test.js
# RESULT: 3/3 passed
```

### Reproduce the closed loop

```bash
node kane_guard.js --inject    # break it   (DEBIT_MULTIPLIER 1 -> 2)
node kane_test.js              # Kane catches it in a real browser -> NDJSON verdict
node kane_guard.js --heal      # Claude Code reads the verdict, patches, Kane re-runs GREEN
```

---

## Why this bug class matters

Most agent demos verify a single-user dashboard: click a button, assert one number. That is a
bug class unit tests already cover.

Pactora deliberately picks a bug that **only a browser can see**:

| Layer | Sees the bug? | Why not |
| --- | --- | --- |
| TypeScript | ❌ | `500 * 2` is a perfectly valid number |
| `next build` | ❌ | compiles and prerenders without warning |
| Unit test of the reducer | ❌ | the reducer is internally consistent |
| Component test of the Buyer portal | ❌ | the Buyer panel renders exactly what it was given |
| **Kane CLI in a real browser** | ✅ | it reads *both portals at once* and sees the ledger break |

The invariant spans two components rendered from one shared state. You have to look at the
whole page, as a user, to know it's wrong. That is precisely the gap Kane exists to close.

---

## The closed loop

```
   ┌──────────────────────────────────────────────────────────────────────┐
   │ 1. BREAK      node kane_guard.js --inject                            │
   │               DEBIT_MULTIPLIER 1 -> 2 in app/app/page.tsx            │
   │               compiles clean, builds clean, unit-testable clean      │
   └───────────────────────────────┬──────────────────────────────────────┘
                                   v
   ┌──────────────────────────────────────────────────────────────────────┐
   │ 2. CATCH      node kane_test.js                                      │
   │               kane-cli run "Click Deposit $500, verify ..." --agent   │
   │               real Chrome, both portals, plain English               │
   │               -> NDJSON verdict persisted to kane-traces/            │
   └───────────────────────────────┬──────────────────────────────────────┘
                                   v
   ┌──────────────────────────────────────────────────────────────────────┐
   │ 3. HEAL       node kane_guard.js --heal                              │
   │               parses the run_end verdict: root cause + UI signals    │
   │               + suggestion, then spawns:                             │
   │                                                                      │
   │                 claude -p "<Kane's verdict verbatim>"                │
   │                                                                      │
   │               the agent edits app/app/page.tsx itself                │
   └───────────────────────────────┬──────────────────────────────────────┘
                                   v
   ┌──────────────────────────────────────────────────────────────────────┐
   │ 4. RE-VERIFY  Kane re-runs all three objectives -> 3/3 GREEN         │
   └──────────────────────────────────────────────────────────────────────┘
```

The agent never sees the source of the bug from us. It receives only what **Kane observed in
the browser** - and diagnoses the rest:

> *"`handleDeposit` debits the buyer `CONTRACT_VALUE * DEBIT_MULTIPLIER` while crediting
> escrow only `CONTRACT_VALUE`. With the multiplier at 2, $2000 - $1000 = $1000 buyer,
> $500 escrow, $0 seller -> $1500 total, so the invariant assertion fires LEDGER MISMATCH."*
> - Claude Code, reading Kane's NDJSON

---

## The verification suite

Three plain-English objectives. No selectors, no page objects, no framework.

| # | Objective | Asserts |
| --- | --- | --- |
| 1 | **Buyer deposit locks escrow** | buyer $1,500 · escrow $500 · status `Escrow Locked` |
| 2 | **Cross-party ledger invariant holds** | page shows `Ledger Balanced` · total `$2,000` |
| 3 | **Seller delivery releases funds** | deposit -> deliver -> release · seller paid out $500 |

```bash
node kane_test.js                          # all three
node kane_test.js --only ledger-invariant  # one (credit-efficient)
node kane_test.js --headless               # no visible browser
```

Every run persists a full NDJSON trace to `kane-traces/<id>.ndjson`, and Kane returns a
shareable run dashboard URL on LambdaTest Test Manager.

---

## kane-guard

The watcher that closes the loop.

| Command | Behaviour |
| --- | --- |
| `node kane_guard.js` | Verify; report regressions |
| `node kane_guard.js --inject` | Inject the double-deduction regression |
| `node kane_guard.js --heal` | Parse NDJSON verdict -> `claude -p` -> patch -> re-verify |
| `node kane_guard.js --heal --deterministic` | Scripted fallback patch (demo safety net) |
| `node kane_guard.js --watch` | Re-verify on every save to `app/` |

**Design notes**

- **The injection point is one constant.** `DEBIT_MULTIPLIER`, marked with a
  `KANE-INJECT:` comment. Chosen because it is invisible to every static check yet
  catastrophic in the browser.
- **Auth failures are never reported as regressions.** An unauthenticated CLI exits with a
  distinct code and a clear message, so an environment problem can't masquerade as a caught
  product bug.
- **Watch mode is credit-guarded.** It runs one objective per save, not three, and refuses to
  stack concurrent paid runs. `--full` opts back in.

---

## Credits

Authoring a run consumes credits; cached replays do not. Every inline `kane-cli run`
re-authors, so the suite costs credits each time it executes.

Measured on this project:

| Run | Cost |
| --- | --- |
| One passing objective | ~8-14 credits |
| Full 3-objective suite | ~31 credits |
| A failing run (Kane probes harder before confirming a bug) | ~17 credits |
| Complete inject -> catch -> heal -> re-verify cycle | ~90 credits |

```bash
npm run kane:balance
```

---

## Repository layout

```
app/
  page.tsx           landing page
  app/page.tsx       Buyer + Seller portals, escrow state machine, ledger invariant
  layout.tsx         fonts, theme, data-app="pactora" discovery marker
  mark.tsx           Pactora logo mark
  icon.svg           favicon
kane_test.js         Kane runner: port discovery, NDJSON capture, failure handoff
kane_guard.js        closed-loop watcher: inject / heal / watch
kane-traces/         persisted NDJSON evidence from every run
DEPLOY.md            deployment guide and where Kane CLI actually runs
SUBMISSION.md        hackathon submission copy
```

---

## Stack

| | |
| --- | --- |
| **Agent** | Claude Code |
| **Verification** | Kane CLI (`@testmuai/kane-cli`) |
| **Framework** | Next.js 14 (App Router) · React 18 · TypeScript |
| **Styling** | Tailwind CSS · Archivo + JetBrains Mono |
| **Palette** | acid `#cdff00` on void `#050505` |

---

## What is simulated

Stated plainly, because judges should not have to guess:

**Pactora has no wallet, no login, no backend and no blockchain.** All escrow state is
in-memory React state in a single component; refreshing the page resets it to $2,000. The
party names and contract ID are fixtures.

That is deliberate. The subject of this project is the **verification loop**, not the
payment rail. An auth wall or a wallet connect would add friction for judges, introduce a
failure mode unrelated to the thesis, and make the target nondeterministic for Kane. The
escrow is the fixture; Kane is the product. The UI labels itself as a simulation throughout.

---

## Roadmap

- Migrate the suite to authored `_test.md` files (`kane-cli design` -> `kane-cli testmd run`)
  so runs replay from cache at zero credit cost, with an evidence pack measuring coverage
  against acceptance criteria rather than test counts.
- Install Kane's native Claude Code skill (`kane-cli install skill`) so the agent can call
  Kane directly as a tool rather than through our runner.
- Persist escrow state so multi-session and multi-browser flows can be verified concurrently.

---

## License

Apache 2.0 - see [LICENSE](LICENSE).
