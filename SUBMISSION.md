# Pactora - Kane CLI Hackathon Submission

**Repo:** https://github.com/mrnetwork0001/Pactora
**Agent used:** Claude Code
**Runnable in under 30s:** `npm install && npm run dev` → http://localhost:3000

## Submission paragraph

Pactora is an autonomous multi-role escrow & SLA marketplace, built entirely with Claude Code
and verified by Kane CLI. Most agent demos verify a single-user dashboard; Pactora verifies
something a single-component test structurally cannot see - a financial invariant that only
exists *between two parties*: `buyer + escrow + seller === $2,000`, asserted live in the UI
across simultaneous Buyer and Seller portals. Our watcher, `kane-guard`, closes the loop: it
injects a one-constant state-mutation regression that makes a $500 deposit debit the buyer
$1,000 - code that compiles, builds, and passes a unit test of the reducer in isolation. Kane
CLI then drives a real Chrome browser from three plain-English objectives, sees the ledger
banner flip to "Ledger Mismatch", and writes an NDJSON trace. `kane-guard` reads that trace,
hands the browser-observed failure verbatim to Claude Code (`claude -p`), the agent patches
`app/app/page.tsx` on its own, and Kane re-runs to a 100% GREEN pass - with no human opening
a browser at any point. Kane isn't bolted on at the end here; it is the only thing in the
stack that can see this class of bug.

## The three bars

- **Ships:** Next.js 14 app. Landing page at `/`, live Buyer + Seller escrow portals at `/app`.
  Full flow: deposit → deliver → release, plus a dispute/refund path and an audit trail.
- **Verified:** 3 plain-English Kane objectives drive a real browser across both portals.
  Every run persists an NDJSON trace to `kane-traces/`.
- **Closed loop:** Kane failure → NDJSON → `claude -p` → source patch → Kane re-run → GREEN.
  `node kane_guard.js --watch` fires Kane on every save to `app/`.

## Judge reproduction

```bash
npm install
npm run kane:login
npm run dev                    # terminal 1

node kane_guard.js --inject    # break it   (DEBIT_MULTIPLIER 1 → 2)
node kane_test.js              # Kane catches it in the browser → NDJSON
node kane_guard.js --heal      # Claude Code reads trace, patches, Kane re-runs GREEN
```

`--heal` calls the agent for real. Add `--deterministic` to force the scripted fallback.
