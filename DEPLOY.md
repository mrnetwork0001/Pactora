# Deploying Pactora

## What actually needs hosting

Pactora is a **fully static Next.js app**. Both routes prerender to static content:

```
Route (app)                    Size     First Load JS
┌ ○ /                          173 B          94 kB
├ ○ /app                       2.85 kB      96.7 kB
└ ○ /icon.svg                  0 B             0 B
○  (Static)  prerendered as static content
```

- No API routes, no server actions, no database
- No environment variables
- Runtime dependencies: `next`, `react`, `react-dom` - nothing else
- All escrow state is in-memory React state

**No VPS is required.** Vercel's free tier is more than sufficient.

## Where Kane CLI runs

This is the part worth being clear about: **Kane CLI is not part of the deployed app.**

`@testmuai/kane-cli` is a **devDependency**. It is never bundled, never shipped, and never
runs on Vercel. It is a local developer tool that launches a real Chrome browser on a
machine and drives it. It takes a `--url` and points that browser wherever you say.

```
   Vercel                          Your machine (or any machine)
   ┌──────────────────┐            ┌──────────────────────────────┐
   │ Pactora          │  <-------  │ kane-cli run "..."           │
   │ static Next.js   │   drives   │   --url https://<app>/app    │
   │ no Kane here     │  a real    │ real Chrome + NDJSON traces  │
   └──────────────────┘  browser   └──────────────────────────────┘
```

So the deployed URL is simply a **target**. Kane runs from a terminal, locally.

### Verifying the deployed app

```bash
PACTORA_URL=https://<your-app>.vercel.app node kane_test.js
```

The runner skips port discovery when `PACTORA_URL` is set and targets `<url>/app`.

### Why the self-healing loop stays local

`kane_guard.js --inject` and `--heal` **edit source files** (`app/app/page.tsx`). Against a
deployed build that would require a rebuild and redeploy per iteration, adding minutes of
latency to every cycle.

The closed loop is therefore demonstrated locally, where `next dev` hot-reloads the patch in
milliseconds and Kane re-runs immediately. Deploy for reach; verify the loop locally.

## This deployment

Live: **https://pactora-app-olive.vercel.app**

Verified in production with Kane CLI:

```bash
PACTORA_URL=https://pactora-app-olive.vercel.app node kane_test.js
# 3/3 passed - Kane drove a real browser against the deployed app
```

## Deploy steps

### Option A - Vercel dashboard (recommended, no CLI)

1. Go to <https://vercel.com/new>
2. **Import Git Repository** -> select `mrnetwork0001/Pactora`
   (the repo must be public, or grant Vercel access to the private repo)
3. Vercel auto-detects Next.js. **Change nothing**:
   - Framework Preset: `Next.js`
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Environment Variables: **none**
4. Click **Deploy**. First build takes ~60-90s.
5. You get `https://<project>.vercel.app`. The app is at `/`, the portals at `/app`.

### Option B - Vercel CLI

```bash
cd /Users/mrnetwork/Pactora
vercel login
vercel --prod
```

Accept the defaults; Vercel detects Next.js automatically.

### After deploying

```bash
# confirm both routes serve
curl -sI https://<your-app>.vercel.app/     | head -1
curl -sI https://<your-app>.vercel.app/app  | head -1

# verify the live deployment with Kane
PACTORA_URL=https://<your-app>.vercel.app node kane_test.js
```

## What judges do

The submission form asks for a **live URL or a runnable command**, and judges should see the
app working in under 30 seconds. Both are satisfied:

| Judge wants | How |
| --- | --- |
| See the app work | Open the Vercel URL, click `Deposit $500`. No login, no wallet, no setup. |
| See Kane verify it | Watch the 3-minute demo video - Kane catches the bug and the agent heals it. |
| Run it themselves | `git clone && npm install && npm run dev`, then `node kane_test.js` with their own TestMu account. |

Judges do **not** need Kane credentials to evaluate the app itself - only to re-run the
verification, which the video already evidences. Nothing in the app is gated behind a login,
a paid service, or a third party, so there is no fallback to arrange.
