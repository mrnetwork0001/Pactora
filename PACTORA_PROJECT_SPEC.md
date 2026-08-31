# 🤝 PACTORA — Autonomous Multi-Role Escrow & SLA Platform with Kane CLI Self-Healing Verification

> **Kane CLI Hackathon Master Blueprint ($6,000 Cash Pool)**  
> **Host:** TestMu AI / LambdaTest  
> **Target:** 1st Place ($3,000 Cash + Kane CLI Pro + Founder 1:1)  
> **Submission Deadline:** 31 August 2026 @ 11:59 PM IST (7:29 PM WAT)  
> **Submission Form:** `surveymonkey.com/r/kane-cli-hackathon-submission`  
> **Core Tech Stack:** Next.js 14 + Tailwind CSS + Kane CLI (`@testmuai/kane-cli`) + Claude Code  
> **License:** Apache 2.0 Open Source  
> **Author:** Ifeanyichukwu Onwo (`mrnetwork`)  

---

## 📌 Executive Summary & Core Value Proposition

AI coding agents write code in seconds, but developers still have to open a browser to check if features actually work.

**Pactora** is an **Autonomous Multi-Role Escrow & SLA Marketplace** verified by a **Closed-Loop Self-Healing Kane Verification Engine**.

Unlike single-user dashboards, Pactora tests multi-party buyer and seller interactions. When Claude Code edits the platform, our watcher (`kane-guard`) dispatches Kane CLI to run natural language browser verification across simultaneous Buyer and Seller portals. If Kane detects a state mismatch, it feeds NDJSON traces back to Claude Code to auto-patch the codebase until a 100% GREEN pass is achieved.

---

## 🏗️ Technical Architecture & Closed-Loop Flow

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 PACTORA MULTI-ROLE UI                  │
                  │   [ Buyer Portal ($500) ]  │  [ Seller Portal (Escrow) ]│
                  └───────────────┬────────────────────────┬───────────────┘
                                  │                        │
            1. Claude Code        │                        │ 1. Watcher Triggers
               Edits Codebase     │                        │    Kane CLI Browser Run
                                  ▼                        ▼
                  ┌────────────────────────────────────────────────────────┐
                  │           KANE CLI BROWSER VERIFICATION ENGINE          │
                  │       (npx @testmuai/kane-cli "Verify Escrow")        │
                  └───────────────┬────────────────────────┬───────────────┘
                                  │                        │
            2. Regression Detected│                        │ 2. Read Failure Trace &
               NDJSON Error Log   │                        │    Auto-Patch State
                                  ▼                        ▼
                  ┌────────────────────────────────────────────────────────┐
                  │            100% GREEN REVERIFIED PASS RUN              │
                  └────────────────────────────────────────────────────────┘
```

---

## 🌟 4 Key Subsystems

### 1. Buyer & Seller Multi-Role Portals (`app/page.tsx`)
- Simultaneous 2-column view displaying Buyer deposit flow and Seller escrow status.

### 2. Kane CLI Integration Script (`kane_test.js`)
- Dispatches Kane CLI terminal commands to verify browser flows in plain English: `npx @testmuai/kane-cli "Open http://localhost:3000, click Deposit $500, verify Escrow Locked status"`.

### 3. Self-Healing Feedback Loop Watcher (`kane_guard.js`)
- Captures Kane CLI NDJSON error logs, formats failure trace evidence, and passes it directly back to Claude Code for auto-remediation.

### 4. 3-Minute Demo Video Script (`DEMO_SCRIPT.md`)
- Showcases the exact self-healing moment where Kane catches a bug, Claude Code auto-fixes it, and Kane re-runs GREEN!

---

## 📝 Exact Hackathon Submission Copy (Ready to Paste)

- **Repo Link:** `https://github.com/mrnetwork0001/Pactora`
- **Submission Paragraph:**
```text
Pactora is an autonomous multi-role SLA escrow marketplace built with Claude Code and verified by Kane CLI. Unlike single-user dashboards, Pactora requires closing the loop across multi-party interactions. Our custom watcher (kane-guard) triggers Kane CLI to execute simultaneous browser verification flows across both Buyer and Seller portals. In one test, an agentic code change caused a double-deduction regression ($500 deposit deducted $1,000 from the buyer). Kane CLI caught the cross-party financial mismatch, logged the exact browser failure, and fed the NDJSON trace back into Claude Code. Claude Code auto-patched the state mutation, and Kane CLI re-ran both browser windows to confirm a 100% green passing run—proving Kane CLI as the ultimate multi-role browser ground truth.
```

---

## 📄 License
Apache 2.0 Open Source
