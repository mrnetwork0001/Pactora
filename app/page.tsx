import Link from "next/link";

const LOOP_STEPS = [
  {
    n: "01",
    label: "Break",
    title: "A regression lands.",
    body: "An agentic edit makes a $500 deposit debit the buyer $1,000. TypeScript compiles. The production build passes. A unit test of the reducer in isolation still goes green.",
    cmd: "node kane_guard.js --inject",
  },
  {
    n: "02",
    label: "Catch",
    title: "Kane opens a real browser.",
    body: "Three plain-English objectives drive Chrome across both portals. Kane sees the ledger banner flip, and returns a confirmed product-bug verdict with root cause and UI evidence.",
    cmd: "node kane_test.js",
  },
  {
    n: "03",
    label: "Heal",
    title: "The agent reads the verdict.",
    body: "kane-guard hands Kane's NDJSON verdict to Claude Code. The agent patches the source itself, and Kane re-runs every objective to a 100% green pass.",
    cmd: "node kane_guard.js --heal",
  },
];

const OBJECTIVES = [
  {
    id: "escrow-lock",
    title: "Buyer deposit locks escrow",
    text: 'Click the "Deposit $500" button. Verify the Buyer Portal available balance now reads $1,500, verify the Seller Portal escrow status reads "Escrow Locked", and verify the held in escrow amount reads $500.',
  },
  {
    id: "ledger-invariant",
    title: "Cross-party ledger invariant holds",
    text: 'Click the "Deposit $500" button. Verify the page shows the text "Ledger Balanced" and verify the ledger total reads $2,000.',
  },
  {
    id: "release-flow",
    title: "Seller delivery releases funds",
    text: 'Click "Deposit $500", then click "Mark Delivered", then click "Release Funds". Verify the Seller Portal paid out amount reads $500 and the escrow status reads "Funds Released".',
  },
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-label text-white/35">
      {children}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void-950">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-void-700 bg-void-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-mono text-xs uppercase tracking-label text-white">
            Pactora
          </span>
          <div className="flex items-center gap-5">
            <span className="hidden font-mono text-[10px] uppercase tracking-label text-white/30 sm:inline">
              Kane CLI Hackathon
            </span>
            <Link
              href="/app"
              className="rounded-full bg-acid px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-label text-void-950 transition hover:brightness-95"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-void-700">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-acid" />
            <Label>Closed-loop verification</Label>
          </div>

          <h1 className="mt-8 max-w-4xl font-display text-5xl font-bold leading-[0.95] tracking-tighter text-white sm:text-7xl">
            The bug that compiles
            <br />
            clean and still loses
            <br />
            <span className="text-acid">your money.</span>
          </h1>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-label text-white/25">
            Simulated ledger · no wallet, no login, no backend
          </p>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/45">
            Pactora is a multi-role escrow marketplace. Its correctness
            doesn&apos;t live in any single component - it lives between two
            parties. That&apos;s a bug class types and unit tests cannot see.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="rounded-full bg-acid px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-label text-void-950 transition hover:brightness-95"
            >
              Launch App
            </Link>
            <a
              href="#loop"
              className="rounded-full border border-void-500 px-7 py-3.5 font-mono text-xs uppercase tracking-label text-white/60 transition hover:border-white/40 hover:text-white"
            >
              See the loop
            </a>
          </div>
        </div>
      </section>

      {/* ── The invariant ────────────────────────────────────────────────── */}
      <section className="border-b border-void-700 bg-void-900/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Label>The invariant Kane verifies</Label>
          <p className="mt-8 font-mono text-2xl leading-snug text-white sm:text-4xl">
            <span className="text-buyer">buyer</span>{" "}
            <span className="text-white/25">+</span>{" "}
            <span className="text-locked">escrow</span>{" "}
            <span className="text-white/25">+</span>{" "}
            <span className="text-seller">seller</span>{" "}
            <span className="text-white/25">===</span>{" "}
            <span className="text-acid">$2,000</span>
          </p>
          <p className="mt-8 max-w-2xl leading-relaxed text-white/40">
            Always. Across every deposit, delivery, release and dispute. No
            single component owns this rule - which is why no single-component
            test can defend it.
          </p>
        </div>
      </section>

      {/* ── The loop ─────────────────────────────────────────────────────── */}
      <section id="loop" className="scroll-mt-16 border-b border-void-700">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-2xl font-display text-4xl font-bold leading-[1.0] tracking-tighter text-white sm:text-5xl">
            Break it, catch it,
            <br />
            heal it. No human
            <br />
            opens a browser.
          </h2>

          <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-void-600 bg-void-600 md:grid-cols-3">
            {LOOP_STEPS.map((step) => (
              <div key={step.n} className="flex flex-col bg-void-950 p-7">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs font-bold text-acid">
                    {step.n}
                  </span>
                  <Label>{step.label}</Label>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold leading-tight tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/40">
                  {step.body}
                </p>
                <code className="mt-6 block overflow-x-auto border-t border-void-700 pt-4 font-mono text-[11px] text-acid">
                  {step.cmd}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Objectives ───────────────────────────────────────────────────── */}
      <section className="border-b border-void-700 bg-void-900/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="font-display text-4xl font-bold leading-[1.0] tracking-tighter text-white sm:text-5xl">
                Tests written
                <br />
                in English.
              </h2>
              <p className="mt-6 leading-relaxed text-white/40">
                No selectors. No page objects. Kane takes an objective in plain
                language and drives a real browser across both portals at once.
                Every run persists an NDJSON trace to{" "}
                <span className="font-mono text-xs text-white/70">
                  kane-traces/
                </span>{" "}
                - the evidence the agent patches against.
              </p>
              <div className="mt-8 border-l-2 border-acid pl-5">
                <Label>Verdict returned</Label>
                <p className="mt-3 font-mono text-xs leading-relaxed text-white/70">
                  assertion_error.
                  <wbr />
                  confirmed_product_bug
                </p>
                <p className="mt-1 font-mono text-[11px] text-white/35">
                  severity major · confidence 0.95
                </p>
              </div>
            </div>

            <div className="grid gap-px overflow-hidden rounded-lg border border-void-600 bg-void-600">
              {OBJECTIVES.map((o, i) => (
                <div key={o.id} className="bg-void-950 p-6">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/25">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-sm font-semibold text-white">
                      {o.title}
                    </h3>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-label text-acid">
                      Pass
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-[11px] leading-relaxed text-white/35">
                    {o.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Reproduce ────────────────────────────────────────────────────── */}
      <section className="border-b border-void-700">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <Label>Reproduce it</Label>
          <h2 className="mt-6 font-display text-4xl font-bold leading-none tracking-tighter text-white">
            Four commands.
          </h2>
          <pre className="mt-10 overflow-x-auto rounded-lg border border-void-600 bg-void-850 p-6 font-mono text-xs leading-loose text-white/70">
            <code>
              <span className="text-white/25"># terminal 1</span>
              {"\n"}
              <span className="text-acid">›</span> npm run dev
              {"\n\n"}
              <span className="text-white/25"># terminal 2</span>
              {"\n"}
              <span className="text-acid">›</span> node kane_guard.js --inject
              {"   "}
              <span className="text-white/25">break it</span>
              {"\n"}
              <span className="text-acid">›</span> node kane_test.js
              {"             "}
              <span className="text-white/25">Kane catches it</span>
              {"\n"}
              <span className="text-acid">›</span> node kane_guard.js --heal
              {"     "}
              <span className="text-white/25">agent patches → green</span>
            </code>
          </pre>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-void-700">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="font-display text-5xl font-bold leading-none tracking-tighter text-white sm:text-6xl">
            See both portals.
          </h2>
          <p className="mx-auto mt-6 max-w-lg leading-relaxed text-white/40">
            Deposit, deliver, release, dispute - and watch the ledger invariant
            hold across every transition.
          </p>
          <Link
            href="/app"
            className="mt-10 inline-block rounded-full bg-acid px-9 py-4 font-mono text-xs font-bold uppercase tracking-label text-void-950 transition hover:brightness-95"
          >
            Launch App
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10">
        <p className="font-mono text-[10px] uppercase tracking-label text-white/25">
          Pactora · Kane CLI Hackathon · TestMu AI · Apache 2.0
        </p>
      </footer>
    </div>
  );
}
