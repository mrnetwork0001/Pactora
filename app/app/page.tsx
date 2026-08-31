"use client";

import Link from "next/link";

import { PactoraMark } from "../mark";
import { useMemo, useState } from "react";

/* ────────────────────────────────────────────────────────────────────────────
 * PACTORA - Autonomous Multi-Role Escrow & SLA Marketplace
 * Verified by the Closed-Loop Self-Healing Kane CLI Verification Engine.
 *
 * KANE INJECTION POINT
 * `node kane_guard.js --inject` flips DEBIT_MULTIPLIER from 1 to 2, producing
 * the double-deduction regression ($500 deposit debits $1,000 from the Buyer).
 * Kane CLI catches the cross-party financial mismatch in the browser, writes an
 * NDJSON failure trace, and Claude Code patches this constant back to 1.
 * ──────────────────────────────────────────────────────────────────────────── */
const DEBIT_MULTIPLIER = 1; // KANE-INJECT:DEBIT_MULTIPLIER

const OPENING_BALANCE = 2000;
const CONTRACT_VALUE = 500;
const SLA_WINDOW_HOURS = 72;
const DELIVERED_AT_HOURS = 41;

type Status =
  | "AWAITING_DEPOSIT"
  | "ESCROW_LOCKED"
  | "WORK_DELIVERED"
  | "FUNDS_RELEASED"
  | "REFUNDED";

type LedgerEntry = {
  id: number;
  actor: "BUYER" | "SELLER" | "SYSTEM";
  event: string;
  delta: string;
};

const STATUS_LABEL: Record<Status, string> = {
  AWAITING_DEPOSIT: "Awaiting Deposit",
  ESCROW_LOCKED: "Escrow Locked",
  WORK_DELIVERED: "Work Delivered",
  FUNDS_RELEASED: "Funds Released",
  REFUNDED: "Refunded",
};

const STATUS_TONE: Record<Status, string> = {
  AWAITING_DEPOSIT: "border-void-500 text-white/50",
  ESCROW_LOCKED: "border-locked/50 text-locked",
  WORK_DELIVERED: "border-buyer/50 text-buyer",
  FUNDS_RELEASED: "border-acid/50 text-acid",
  REFUNDED: "border-rose-500/50 text-rose-400",
};

const usd = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US")}`;

export default function PactoraPage() {
  const [status, setStatus] = useState<Status>("AWAITING_DEPOSIT");
  const [buyerBalance, setBuyerBalance] = useState(OPENING_BALANCE);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [sellerBalance, setSellerBalance] = useState(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([
    {
      id: 0,
      actor: "SYSTEM",
      event: "Contract PAC-4417 opened · SLA 72h",
      delta: "-",
    },
  ]);

  const log = (actor: LedgerEntry["actor"], event: string, delta: string) =>
    setLedger((prev) => [
      ...prev,
      { id: prev.length, actor, event, delta },
    ]);

  /* ── Buyer action: deposit the contract value into escrow ───────────────── */
  const handleDeposit = () => {
    if (status !== "AWAITING_DEPOSIT") return;
    setBuyerBalance((b) => b - CONTRACT_VALUE * DEBIT_MULTIPLIER);
    setEscrowBalance(CONTRACT_VALUE);
    setStatus("ESCROW_LOCKED");
    log("BUYER", `Deposited ${usd(CONTRACT_VALUE)} into escrow`, `-${usd(CONTRACT_VALUE * DEBIT_MULTIPLIER)}`);
  };

  /* ── Seller action: mark the milestone delivered ────────────────────────── */
  const handleDeliver = () => {
    if (status !== "ESCROW_LOCKED") return;
    setStatus("WORK_DELIVERED");
    log("SELLER", `Milestone delivered in ${DELIVERED_AT_HOURS}h · SLA met`, "-");
  };

  /* ── Buyer action: approve and release escrow to the seller ─────────────── */
  const handleRelease = () => {
    if (status !== "WORK_DELIVERED") return;
    setEscrowBalance(0);
    setSellerBalance(CONTRACT_VALUE);
    setStatus("FUNDS_RELEASED");
    log("BUYER", `Released ${usd(CONTRACT_VALUE)} to seller`, `+${usd(CONTRACT_VALUE)}`);
  };

  /* ── Buyer action: dispute and refund from escrow ───────────────────────── */
  const handleRefund = () => {
    if (status !== "ESCROW_LOCKED") return;
    setEscrowBalance(0);
    setBuyerBalance((b) => b + CONTRACT_VALUE);
    setStatus("REFUNDED");
    log("BUYER", `Dispute upheld · ${usd(CONTRACT_VALUE)} refunded`, `+${usd(CONTRACT_VALUE)}`);
  };

  const handleReset = () => {
    setStatus("AWAITING_DEPOSIT");
    setBuyerBalance(OPENING_BALANCE);
    setEscrowBalance(0);
    setSellerBalance(0);
    setLedger([
      {
        id: 0,
        actor: "SYSTEM",
        event: "Contract PAC-4417 opened · SLA 72h",
        delta: "-",
      },
    ]);
  };

  /* ── Ledger invariant: the cross-party ground truth Kane CLI verifies ───── */
  const totalOnPlatform = buyerBalance + escrowBalance + sellerBalance;
  const isBalanced = totalOnPlatform === OPENING_BALANCE;

  const slaText = useMemo(() => {
    if (status === "AWAITING_DEPOSIT") return `SLA window ${SLA_WINDOW_HOURS}h · not started`;
    if (status === "ESCROW_LOCKED") return `${SLA_WINDOW_HOURS}h remaining · clock running`;
    if (status === "REFUNDED") return "SLA breached · escrow returned";
    return `Delivered in ${DELIVERED_AT_HOURS}h · SLA met`;
  }, [status]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 font-display">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mb-3 inline-block font-mono text-[10px] uppercase tracking-label text-white/30 transition hover:text-acid"
          >
            ← Back to overview
          </Link>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tighter text-white">
            <PactoraMark size={28} className="text-white/70" />
            Pactora
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Autonomous multi-role escrow &amp; SLA marketplace - verified by a
            closed-loop self-healing Kane CLI engine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-void-600 px-4 py-1.5 font-mono text-[10px] uppercase tracking-label text-white/35">
            Demo · simulated ledger
          </span>
          <span
            data-testid="contract-id"
            className="rounded-full border border-void-600 px-4 py-1.5 font-mono text-[10px] uppercase tracking-label text-white/35"
          >
            CONTRACT PAC-4417
          </span>
          <span
            data-testid="escrow-status"
            className={`rounded-full border px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-label ${STATUS_TONE[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
      </header>

      <p className="mb-6 font-mono text-[10px] leading-relaxed text-white/25">
        No wallet, no login, no backend - all state is in-memory React state, so the
        flow is fully deterministic for Kane CLI. Refresh to reset.
      </p>

      {/* ── Ledger invariant banner - Kane's cross-party ground truth ───────── */}
      <section
        data-testid="ledger-invariant"
        className={`mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4 ${
          isBalanced
            ? "border-acid/30 bg-acid/[0.04]"
            : "border-rose-500/50 bg-rose-500/[0.06]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 shrink-0 ${isBalanced ? "bg-acid" : "bg-rose-500"}`}
          />
          <div>
            <p
              data-testid="ledger-invariant-status"
              className={`font-mono text-xs font-bold uppercase tracking-label ${
                isBalanced ? "text-acid" : "text-rose-400"
              }`}
            >
              {isBalanced ? "Ledger Balanced" : "Ledger Mismatch"}
            </p>
            <p className="mt-1 font-mono text-[10px] text-white/30">
              Buyer + Escrow + Seller must always equal {usd(OPENING_BALANCE)}
            </p>
          </div>
        </div>
        <p className="font-mono text-sm text-white/60">
          {usd(buyerBalance)} + {usd(escrowBalance)} + {usd(sellerBalance)} ={" "}
          <span
            data-testid="ledger-total"
            className={isBalanced ? "text-acid" : "font-bold text-rose-400"}
          >
            {usd(totalOnPlatform)}
          </span>
        </p>
      </section>

      {/* ── Two-column multi-role portals ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── LEFT: Buyer Portal ───────────────────────────────────────────── */}
        <section
          data-testid="buyer-portal"
          className="rounded-lg border border-void-600 bg-void-900/40 p-7"
        >
          <div className="mb-6 flex items-center justify-between border-b border-void-700 pb-5">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-white">Buyer Portal</h2>
              <p className="mt-1 font-mono text-[10px] text-white/25">
                Acme Corp · simulated party
              </p>
            </div>
            <span className="rounded-full border border-buyer/40 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-label text-buyer">
              Role: Buyer
            </span>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-label text-white/35">
            Available Balance
          </p>
          <p
            data-testid="buyer-balance"
            className="mt-2 font-mono text-5xl font-bold tracking-tighter text-white"
          >
            {usd(buyerBalance)}
          </p>
          <p className="mt-3 font-mono text-[10px] text-white/25">
            Opening balance {usd(OPENING_BALANCE)} · contract value{" "}
            {usd(CONTRACT_VALUE)}
          </p>

          <div className="mt-6 space-y-3">
            <button
              data-testid="deposit-button"
              onClick={handleDeposit}
              disabled={status !== "AWAITING_DEPOSIT"}
              className="w-full rounded-full bg-acid px-4 py-3.5 font-mono text-xs font-bold uppercase tracking-label text-void-950 transition hover:brightness-95 disabled:bg-void-700 disabled:text-white/25"
            >
              Deposit $500
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                data-testid="release-button"
                onClick={handleRelease}
                disabled={status !== "WORK_DELIVERED"}
                className="rounded-full border border-acid/40 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-label text-acid transition hover:bg-acid/10 disabled:border-void-700 disabled:text-white/20"
              >
                Release Funds
              </button>
              <button
                data-testid="dispute-button"
                onClick={handleRefund}
                disabled={status !== "ESCROW_LOCKED"}
                className="rounded-full border border-rose-500/40 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-label text-rose-400 transition hover:bg-rose-500/10 disabled:border-void-700 disabled:text-white/20"
              >
                Raise Dispute
              </button>
            </div>
          </div>
        </section>

        {/* ── RIGHT: Seller Portal ─────────────────────────────────────────── */}
        <section
          data-testid="seller-portal"
          className="rounded-lg border border-void-600 bg-void-900/40 p-7"
        >
          <div className="mb-6 flex items-center justify-between border-b border-void-700 pb-5">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-white">Seller Portal</h2>
              <p className="mt-1 font-mono text-[10px] text-white/25">
                Nimbus Studio · simulated party
              </p>
            </div>
            <span className="rounded-full border border-seller/40 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-label text-seller">
              Role: Seller
            </span>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-label text-white/35">
            Escrow Status
          </p>
          <p
            data-testid="seller-escrow-status"
            className="mt-2 font-mono text-3xl font-bold tracking-tighter text-white"
          >
            {STATUS_LABEL[status]}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-void-700 p-4">
              <p className="font-mono text-[10px] uppercase tracking-label text-white/35">
                Held in Escrow
              </p>
              <p
                data-testid="escrow-balance"
                className="mt-1 font-mono text-2xl font-bold tracking-tighter text-locked"
              >
                {usd(escrowBalance)}
              </p>
            </div>
            <div className="rounded-lg border border-void-700 p-4">
              <p className="font-mono text-[10px] uppercase tracking-label text-white/35">
                Paid Out
              </p>
              <p
                data-testid="seller-balance"
                className="mt-1 font-mono text-2xl font-bold tracking-tighter text-acid"
              >
                {usd(sellerBalance)}
              </p>
            </div>
          </div>

          <p
            data-testid="sla-status"
            className="mt-5 rounded-lg border border-void-700 px-4 py-3 font-mono text-[11px] text-white/45"
          >
            <span className="text-white/25">SLA</span> {slaText}
          </p>

          <div className="mt-6 space-y-3">
            <button
              data-testid="deliver-button"
              onClick={handleDeliver}
              disabled={status !== "ESCROW_LOCKED"}
              className="w-full rounded-full bg-acid px-4 py-3.5 font-mono text-xs font-bold uppercase tracking-label text-void-950 transition hover:brightness-95 disabled:bg-void-700 disabled:text-white/25"
            >
              Mark Delivered
            </button>
            <button
              data-testid="reset-button"
              onClick={handleReset}
              className="w-full rounded-full border border-void-600 px-4 py-2.5 font-mono text-[11px] uppercase tracking-label text-white/40 transition hover:border-white/30 hover:text-white"
            >
              Reset Contract
            </button>
          </div>
        </section>
      </div>

      {/* ── Audit trail ────────────────────────────────────────────────────── */}
      <section
        data-testid="audit-trail"
        className="mt-6 rounded-lg border border-void-600 bg-void-900/40 p-7"
      >
        <h2 className="mb-5 font-mono text-[10px] uppercase tracking-label text-white/35">
          Escrow Audit Trail
        </h2>
        <ol className="space-y-2">
          {ledger.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-void-700 px-4 py-3 font-mono text-[11px]"
            >
              <span className="flex items-center gap-3">
                <span
                  className={
                    entry.actor === "BUYER"
                      ? "w-16 shrink-0 font-bold text-buyer"
                      : entry.actor === "SELLER"
                        ? "w-16 shrink-0 font-bold text-seller"
                        : "w-16 shrink-0 font-bold text-white/30"
                  }
                >
                  {entry.actor}
                </span>
                <span className="text-white/60">{entry.event}</span>
              </span>
              <span className="shrink-0 text-white/30">{entry.delta}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-10 text-center font-mono text-[10px] uppercase tracking-label text-white/20">
        Pactora · Kane CLI Online Hackathon · Apache 2.0
      </footer>
    </main>
  );
}
