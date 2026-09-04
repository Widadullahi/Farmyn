# FarmLink x BMONI — Hackathon Guide (Read Me First)

Exhibition: Friday 4th September 2026, 12:00 PM, Pier Place, Yaba Lagos.
Prizes: 1st 500k, 2nd 200k, 3rd 100k, 4th 50k, 5th 50k.

This file contains EVERYTHING from our chat, in order. Open it in VS Code and read top to bottom.

---

## 1. What am I using BMONI for?

Hackathon rule: you must use BMONI APIs/SDKs to move real money.
FarmLink needs exactly that for escrow.

3 jobs BMONI does for you:

1. **Wallet** — Every user gets a CNGN smart wallet. That is their FarmLink balance.
   Call: `owner-proof-challenges` -> `create-managed` with `currency: CNGN`.

2. **Collect payment safely (hold the money)** — Buyer does a bank transfer to an NGN
   virtual account BMONI gives you. It is credited as CNGN and locked as a
   TRANSFER proposal. Status: IN ESCROW. Farmer cannot touch it yet.

3. **Pay farmer after delivery (release the money)** — Buyer clicks Confirm Delivery,
   you sign the proposal to COMPLETED, then call `offramp/nigeria` to send NGN to the
   farmer's real bank (verify -> register -> offramp).

Bonus: BMONI handles BVN/KYC via `start-nigeria`. That is your "verified sellers".

Without BMONI your escrow is fake text. With BMONI it is real money movement.
That is what wins.

---

## 2. Your project right now

- `apps/backend/index.js` (188 lines) = your backend. It forwards to BMONI.
  Routes:
  - POST /api/bmoni/users (create user)
  - POST /api/bmoni/wallet (create CNGN wallet)
  - POST /api/bmoni/onboard-ngn (start Nigeria rail)
  - GET /api/bmoni/status/:userId, /balances/:userId, /deposit-account/:userId
  - POST /api/bmoni/escrow/lock (lock funds)
  - POST /api/bmoni/escrow/release (release on delivery)
  - POST /api/bmoni/offramp (pay farmer bank)
  - GET /api/bmoni/purses/:userId + POST split/move/create (Farm Purses)

- `apps/web/app/checkout-bmoni/page.tsx` = Secure Checkout demo page.
- `apps/web/app/purses/page.tsx` = Farm Purses page (divide money by use).
- `apps/web/lib/bmoni.ts` = frontend client talking to backend.
- `apps/backend/.env` = holds BMONI_API_KEY (empty = demo-mock mode).
- `apps/web/.env.local` = holds NEXT_PUBLIC_BMONI_BACKEND_URL=http://localhost:3001

Two servers:
- Backend on http://localhost:3001 (only / and /api/bmoni/...)
- Frontend on http://localhost:3000 (pages: /, /checkout-bmoni, /purses, /marketplace...)

If you open http://localhost:3001/purses you WILL get "Cannot GET /purses".
That is expected. Frontend pages are on :3000, not :3001.

---

## 3. Step by step — first run (no key needed)

You need 2 PowerShell terminals, both in C:\Users\DELL\Music\Farm-Link.

Terminal 1 — backend:
```
cd C:\Users\DELL\Music\Farm-Link
npm install --prefix apps/backend
node apps/backend/index.js
```
Expected: `Farmyn Backend listening on 3001 [DEMO-MOCK ...]`
Leave it running. Test: open http://localhost:3001/ -> you see {"name":"Farmyn Backend API"...}
If port in use: `taskkill /F /IM node.exe` then retry.

Terminal 2 — frontend:
```
cd C:\Users\DELL\Music\Farm-Link\apps\web
npm install
npm run dev
```
Expected: `Ready on http://localhost:3000`
Leave it running.

Open in browser:
- http://localhost:3000/checkout-bmoni
- http://localhost:3000/purses

On checkout page:
1. Leave amount 28000.00
2. Click "Run 1-click escrow demo" -> watch black log: user -> wallet -> NGN rail -> IN ESCROW
3. Click "Confirm delivery -> release & pay farmer"

This works in DEMO-MOCK. Use it at exhibition even if internet fails.

---

## 4. Going live on BMONI sandbox (tonight if possible)

1. Ask your Coding Mentor for sandbox x-api-key, or check BMONI Embedded Docs portal.
2. Open apps/backend/.env, fill:
   BMONI_API_KEY=pk_paste_your_key_here
3. Restart Terminal 1: Ctrl+C, then `node apps/backend/index.js`
   Now it says [LIVE-SANDBOX].
4. Re-run checkout page. Real BMONI calls happen.

Must-use sandbox persona (any other name FAILS by design):
- firstName: Bunch, lastName: Dillon
- email: bunch.dillon@example.com
- phoneNumber: +2348000000000
- BVN: 95888168924

Request test tokens — WHY + HOW (read this before tomorrow):

WHY: sandbox wallets start at 0. Lock escrow / transfer / offramp all need a
funded CNGN balance, otherwise you get "insufficient funds" on stage 6.
Request = NGN 1,000 + USD 10, sandbox-only, no value, wiped on sandbox reset.
You need it for the LIVE judge demo. DEMO-MOCK does not need it.

HOW (5 steps):
1. Backend must say [LIVE-SANDBOX]: apps/backend/.env has BMONI_API_KEY set,
   restart with `node apps/backend/index.js`.
2. Create the sandbox BMONI user FIRST (wallet must exist before they can credit it):
   open http://localhost:3000/checkout-bmoni -> click "Run 1-click escrow demo".
   This creates Bunch Dillon / +2348000000000 / BVN 95888168924 and runs
   start-nigeria so the CNGN wallet exists. Copy the bmoniUserId from the log.
3. Request: open https://bkey.mintlify.app/request-test-tokens, submit phone
   +2348000000000 (the number the account was created with). If the form fails,
   email support@bkey.me with the same phone number.
4. Wait: usually within 1 business day by email. Request TONIGHT — tomorrow may
   be too late, so keep DEMO-MOCK as backup (empty key = mock, never fails).
5. Verify it landed: on checkout page the balances call, or
   GET http://localhost:3001/api/bmoni/balances/<bmoniUserId>
   Expect CNGN ~1000. If still 0, tokens have not arrived yet — demo in mock.

TOMORROW — two lanes (important):
- Lane A (crowd): anyone can create a FarmLink account at /register (name/email/
  password, stored locally). No BVN needed. Let visitors do this freely.
- Lane B (judges): live BMONI escrow uses ONLY Bunch Dillon (+2348000000000,
  BVN 95888168924). Real names/BVNs FAIL in sandbox by design — no other number
  resolves. Do NOT let judges type random BVNs in live mode; show the Bunch
  Dillon run, then invite them to try Lane A + /purses budgeting.

Demo-mock vs live:
- No key = demo-mock, fake data, never fails. Good backup.
- With key = live-sandbox, real API. Better for judges if network works.

---

## 5. Farm Purses — divide money by use

Like the BMONI app: one CNGN wallet split into purses.
Default: Seeds & Restock, Family, Savings. Farmer can add more (School fees etc).

How it works: ledger on top of single CNGN wallet. Real money moves via BMONI
TRANSFER/offramp, purses track allocation. Roadmap for judges: "Phase 2: 1 smart-wallet per purse".

Try:
1. Restart backend if you edited it.
2. Open http://localhost:3000/purses
3. Click Load, enter payout e.g. 25000, click Split 60/25/15.
4. Add new purse.

Judge line: "After escrow releases, Mama Ngozi budgets inside FarmLink, powered by BMONI rails."

Show /checkout-bmoni first (escrow), then /purses (budgeting). 2-page story.

---

## 6. Exhibition script (3 minutes)

1. Problem (30s): "Farmers lose 40% to middlemen. Buyers fear fraud."
2. Checkout demo (60s): Run demo. Point to NGN virtual account number -> credited as CNGN. Point to IN ESCROW (farmer cannot withdraw).
3. Release (45s): Click Release. "Delivery confirmed, farmer paid to GT Bank via offramp with name verification."
4. Purses (30s): Open /purses. "She splits 25k into Seeds/Family/Savings."
5. Close (15s): "Powered by BMONI Embedded: users, CNGN wallets, Nigeria rail, proposals. NGN now, USD export accounts next via kyc/activate."

Bring a screen recording as backup. Venue WiFi fails often.

---

## 7. Troubleshooting

- Cannot GET /purses or /checkout-bmoni -> you are on :3001. Use :3000.
- fetch failed -> backend not running. Restart Terminal 1.
- bmoniUserId required -> re-click Run demo from start.
- 409 user exists -> normal. Change email to bunch2.dillon@example.com and retry.
- Frontend blank -> check Terminal 2 errors, open http://localhost:3000 first.
- Port in use -> taskkill /F /IM node.exe, restart.
- Pre-existing error AppContext.tsx:92 on tsc -> ignore, not your files. Your bmoni/checkout/purses files have zero type errors.

---

## 8. What to tell me next

Copy-paste exact error text + which step (1-7) you are on. Example:
"Step 3, opened :3000/checkout-bmoni, clicked Run, log says ERROR: fetch failed"

Good luck — you can win this.

---

## 9. Sandbox key added — test tokens + tomorrow plan (appended 2026-09-04)

You added the sandbox API key. Backend must say [LIVE-SANDBOX] on start.
If it still says [DEMO-MOCK], the key is not loaded: check apps/backend/.env has
BMONI_API_KEY=pk_... on one line with no spaces, then Ctrl+C and restart
`node apps/backend/index.js`.

WHY test tokens: sandbox wallets start at 0. Escrow lock / release / offramp need
a funded CNGN balance or they fail with insufficient funds. Allocation is
NGN 1,000 + USD 10, sandbox-only, no value, wiped on sandbox reset.
DEMO-MOCK does not need tokens. LIVE judge demo does.

STEP BY STEP:
1. Confirm [LIVE-SANDBOX] in Terminal 1.
2. Create the wallet FIRST so BMONI has somewhere to credit:
   http://localhost:3000/checkout-bmoni -> "Run 1-click escrow demo".
   Creates Bunch Dillon / +2348000000000 / BVN 95888168924, runs start-nigeria.
   Copy bmoniUserId from the black log.
3. Request: https://bkey.mintlify.app/request-test-tokens -> submit
   +2348000000000 (the number the account was created with). Form fail?
   Email support@bkey.me with the same number.
4. Wait for email reply, usually within 1 business day. Request tonight.
5. Verify: GET http://localhost:3001/api/bmoni/balances/<bmoniUserId>
   Expect CNGN ~1000. Still 0 = not arrived yet -> present in DEMO-MOCK.

TOMORROW two lanes:
- Lane A (crowd): /register works for anyone, local account, no BVN. Free signup.
- Lane B (judges): live BMONI = Bunch Dillon ONLY. Real names/BVNs fail in
  sandbox by design. Never let judges type random BVNs in live mode.
  Show Bunch Dillon escrow, then hand them Lane A + /purses.

---

## 10. Fix for 409 "User already exists" (appended)

409 means your key works and the FIRST create already succeeded. BMONI blocks the
duplicate and does not return the id. Do NOT keep clicking Run — reuse the user.

Fastest unblocks (in order):
1. The page now auto-saves ids in the browser. Reload /checkout-bmoni: if it says
   "Found saved bmoniUserId", paste it into "Existing bmoniUserId" and click
   "Continue with existing user". It skips create and resumes at wallet step.
2. Same phone, server restarted? Backend now caches phone/email -> bmoniUserId in
   apps/backend/.bmoni-users.json and reuses it automatically on 409.
   Fresh 409 with no cache = that user was created before this cache existed.
3. Nuclear option: switch persona dropdown to "Samson Jabo (+2348000000001,
   BVN 22222222222)" and click Run. Brand-new sandbox user, no collision.
   Bunch Dillon BVN 95888168924, Samson Jabo BVN 22222222222 — never mix a BVN
   with the other persona's name/phone or verification fails.

After fixing: restart backend (Ctrl+C, node apps/backend/index.js), hard-refresh
the page (Ctrl+Shift+R), then Run again.

WHERE IS THE bmoniUserId? (3 places, newest first)
- Frontend black log: "User OK: <id>" right after step 1/5. Copy it before refresh.
- Browser localStorage key farmlink-bmoni-ids (auto-saved since this fix).
- Backend: Terminal 1 prints "[BMONI] user created: <id> (...)" and file
  apps/backend/.bmoni-users.json maps phone/email -> id.
- If your user was created BEFORE this fix, none of the above has it (that is
  your current Bunch situation). BMONI returns 409 without the id and has no
  documented lookup-by-phone endpoint, so the id is unrecoverable — switch to
  Samson Jabo persona instead of hunting for it.
- "Continue with existing user" expects a bmoniUserId (long id with dashes),
  NOT a name. Typing "Samson Jabo" there gives "User not found". To create
  Samson fresh: select Samson in the dropdown, click RUN (not Continue).

---

## 11. Both personas 409 + key health (appended)

Both Bunch (+2348000000000) and Samson (+2348000000001) returning 409 means both
already exist under your partner key — someone (you on an earlier run, or a
teammate sharing the key) created them, and the ids were never saved. The cache
file apps/backend/.bmoni-users.json only helps for users created AFTER the fix.

Recover the ids (try in order):
1. Teammate: if anyone else used this key, ask for their "User OK: ..." log lines.
2. Email support@bkey.me with both phone numbers — they can map phones to users.
3. Fallback for the show: empty BMONI_API_KEY and present in DEMO-MOCK (never fails).

KEY HEALTH — I probed your .env key and sandbox answered 401 "Invalid partner
API key", yet your runs got 409s (which need a VALID key). So the backend that
produced those 409s is running with a different key than what is in .env NOW
(shell env var overrides .env, or .env was edited after startup without restart).
Check: restart backend, read the startup line ([LIVE-SANDBOX] vs [DEMO-MOCK]),
open http://localhost:3001/api/bmoni/health — keyValid:true means good.
keyValid:false + 401 means: fix .env to one clean line BMONI_API_KEY=pk_...
(no quotes, no spaces, dev key for dev URL), then Ctrl+C + restart. dotenv loads
only once at startup — every .env edit needs a restart.

---

## 12. Recovering lost user ids via GET /v1/users (appended)

The BMONI OpenAPI spec (https://embedded-dev.bmoni.com/docs/openapi.json) confirms
GET /v1/users is a paginated list (page/limit, up to 100). There is no search
filter, so the backend lists and matches phone/email client-side.

New backend route: GET /api/bmoni/users/recover?phone=...&email=...
New frontend button on /checkout-bmoni: "Recover my user id from BMONI (for 409s)".
It recovers the id for the SELECTED persona, fills the box, and continues the run.

SAFE RESTART ORDER (your running backend holds a valid key in memory — don't lose it):
1. Open apps/backend/.env. Make the key line exactly BMONI_API_KEY=pk_...
   (no quotes, no spaces after =, dev key). If you edited .env AFTER the backend
   started, the running process still uses the OLD key — the file may now be broken.
2. Only then: Ctrl+C + `node apps/backend/index.js`, hard-refresh the page.
3. Open http://localhost:3001/api/bmoni/health — need keyValid:true.
4. Click "Recover my user id", then the run continues (wallet → rail → escrow).
5. If health says 401: the .env key is bad — get a fresh dev key from your mentor,
   update .env, restart again. Worst case, empty the key and present DEMO-MOCK.

---

## 13. Full restart — delete both sandbox users and start over (appended)

New red "Danger zone" box on /checkout-bmoni: "Reset sandbox accounts".
One click recovers both ids via GET /v1/users, DELETEs Bunch + Samson on BMONI,
clears apps/backend/.bmoni-users.json + browser ids. Then Run creates brand new.

Rules: deletion needs EMPTY wallets (fresh users qualify; if test tokens were
credited, offramp them first or delete fails). Deleted accounts sit in 90-day
recovery — if a fresh create 409s right after delete, use Reactivate
(POST /api/bmoni/users/:id/reactivate with the id from the reset log).

Order: restart backend (new routes) → hard-refresh page → health check →
click Reset → confirm → Run as Bunch.

---

## 14. Recover matched nothing — format-proof matching + debug (appended)

Symptom: create 409s but recover said "no live user matches (checked first 100)".
Cause: the list stores phones in another format (080... vs +234...) or nests
fields differently — exact string match missed it.

Fix: backend now matches on last-10-digits and scans nested objects for
phone/email-ish values (helpers digits/last10/collectStrings/matchUser), and a
failed recover returns debug: {checked, sampleKeys, contacts}. The page prints
up to 400 chars of it. Paste that RECOVER FAILED line here and it tells us the
real shape (count, field names, stored formats) so we can finish recovery.
Same matcher now powers POST /reset.

---

## 15. WHAT TO DO NOW (checklist in order)

1. Restart backend: Terminal 1 Ctrl+C, `node apps/backend/index.js`. Must say
   [LIVE-SANDBOX]. (Loads the format-proof matcher + recover/reset/health routes.)
2. Hard-refresh the page: Ctrl+Shift+R on /checkout-bmoni.
3. Open http://localhost:3001/api/bmoni/health → need keyValid:true.
   If 401: fix .env key line (no quotes/spaces, dev key), restart again.
   If key dead: empty the key → DEMO-MOCK carries the show, email support@bkey.me.
4. Click "Recover my user id from BMONI (for 409s)" with Bunch selected.
   Works → run auto-continues (wallet → rail → escrow). Then request test tokens.
   Fails → paste the FULL "RECOVER FAILED: ... Debug: ..." line here.
5. Tonight regardless: request test tokens for +2348000000000 AND +2348000000001
   at https://bkey.mintlify.app/request-test-tokens (needs phones only, no ids).
6. Rehearse once end-to-end, then record a backup video of the full flow.

---

## 17. Production build GREEN + site polish (appended)

`npm run build --workspace=web` now passes: 14/14 pages static, zero type errors.
Fixed along the way: react-router-dom → next/link (5 files), missing "use client"
(Footer/ProductCard/CategoryCard), AppContext ternary + readonly categories,
useSearchParams Suspense (chat/marketplace), QueryClient out of layout → Providers.

REAL INTEGRATION = one-line switch (no code changes needed):
- Sandbox: BMONI_BASE_URL=https://embedded-dev.bmoni.com + sandbox key.
- Production: BMONI_BASE_URL=https://embedded.bmoni.com + PROD key from
  developers@bkey.me (sandbox keys 401 on prod). See apps/backend/.env.example.
- Prod rules: real BVN/bank, real irreversible money, team-owned demo account
  only. Server-side signing in index.js is a hackathon shortcut — real prod must
  sign on-device via bmoni_embedded_sdk.

UI polish shipped: Secure Escrow + Purses in Navbar/Footer, BmoniModeBadge
(Live/Demo/Offline from /health) on checkout + purses, rewritten Secure Checkout
(order summary, stepper, payment card, trust points, activity log, collapsible
test controls), polished Purses (goals, split, add), homepage BMONI escrow strip,
full metadata/OG/icons in layout, env examples for both apps.

---

## 18. Proper app structure — dashboards own Purses (appended)

Public landing nav is back to Home / Marketplace / Bulk / About (+ Chat when
logged in, + My Dashboard for buyers, + Dashboard for sellers). No more app
screens advertised to strangers.

Where things live now:
- /dashboard (new, login required): buyer sees escrow stats + latest orders +
  purses + "Pay with escrow" CTA; seller sees sales snapshot + link to full
  seller dashboard + purses. Scoped per account (farmlink-{userId}).
- /seller/dashboard → new "Purses" tab (PursesWidget, same per-account scope).
- /cart → "Pay now with BMONI escrow" button carries ?amount= into checkout.
- /checkout-bmoni?amount= pre-fills from cart + "Back to cart & orders" link.
- /purses stays as the full budgeting view, linked FROM dashboards (widget has
  "Open full view"), not from landing nav.
- Shared components/PursesWidget.tsx powers all three spots; backend purses API
  treats the key as opaque so farmlink- ids just work.
- Homepage BMONI strip + footer sitemap kept (landing marketing is correct there).

---

## 19. Landing landing, dashboards app + sidebar farmer desk (appended)

- Signed-out by default: initialAppState.currentUserId is now null (was Ada).
  Landing shows Login/Get Started; dashboards gate properly. NOTE: your browser
  still has Ada in localStorage — logout once or clear site data to see it fresh.
- Farmer desk: sidebar nav (sticky, Overview/Inventory/Orders & Escrow/Purses/
  Marketing/Messages/Profile), store header card (avatar initials, verified
  badge, location, BmoniModeBadge), new "Held in Escrow" stat card in overview.
- Real-first copy: checkout/purses read production (mode honesty lives only in
  the badge + collapsible sandbox tools). Backend live path unchanged: key set =
  real BMONI sandbox calls (users, CNGN wallets, start-nigeria, proposals,
  offramp); prod = same code, prod URL + prod key (see 17).
- Purses scoping is per FarmLink account (farmlink-{id}) — no BMONI id needed,
  works the same in mock, sandbox and prod.

---

## 20. Standard-look farmer desk, no AI gloss (appended)

- Seller dashboard stripped of gradients + oversized radii: rounded-3xl/2xl/xl →
  rounded-lg/md, gradient chart bars → solid primary, shadow-card/elevated →
  shadow-sm. Sidebar is a plain bordered card with solid active item.
- Rule going forward: solid colors, rounded-md max on cards, default buttons.

---

## 21. Real-project mode — mocks deleted, dashboard account creation (appended)

- Backend: every DEMO_MODE mock branch removed. No key = clear 503 error, never
  fake balances. Purses stay keyless (local ledger, starts at 0, no seeding).
  Reset route kept as close-account (needs explicit phones now, no defaults).
- New components/MoneyAccountCard.tsx: full activation on dashboards — profile →
  BMONI user → CNGN wallet → BVN rail → live VBA + balance, persisted per
  FarmLink account. Embedded in /dashboard and seller overview.
- Secure Checkout rewritten: login gate, identity from YOUR profile (name/phone
  split automatically), your own BVN input, farmer bank inputs removed in favor
  of verified-withdrawal flow. No personas, no reset box, no demo copy.
- /purses requires login, scoped to your account. Badge is Connected/Offline.
- One honest sandbox note kept (single hint line, no machinery): verification
  only passes with matching registered details — mentor test identities still
  needed until production keys + real BVNs exist. Everything else demo is gone.

---

## 16. Sandbox stuck? Your options ranked (ap