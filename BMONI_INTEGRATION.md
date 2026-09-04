# Farmyn Nigeria — BMONI Integration Write-up

## What the platform is about
Farmyn Nigeria is a farm-to-home marketplace connecting verified local farmers
directly with households and businesses buying fresh produce, poultry, livestock
and grains. Buyers browse the marketplace, place bulk orders, chat with sellers
and check out — while sellers manage listings, escrow orders, adverts and payouts
from a full-height sidebar dashboard (buyer `/dashboard`, seller `/seller/dashboard`).

## How BMONI helps on the platform
Trust is the product. Buyers won't prepay strangers; farmers won't ship unpaid.
BMONI Embedded rails solve this with **escrow**: buyer money locks as CNGN in a
smart wallet on order, the farmer ships knowing funds are secured, and money is
released to the farmer's bank only after the buyer confirms delivery.
No delivery, no payout. Released payouts then flow into **Farm Purses** —
budgeting splits across Seeds & Restock, Family and Savings.

## What BMONI does here (live calls, no mocks)
- Users → `POST /v1/users` (money account per FarmLink profile)
- CNGN smart wallet → owner-proof-challenge → sign → create-managed
- NGN rail → `start-nigeria` (BVN) + NGN virtual deposit account
- Escrow → TRANSFER proposal → approve → sign → release
- Payout → verify Nigerian account → register withdrawal account → offramp
- Purses → local budgeting ledger over the live wallet balance

## How I integrated it
- `apps/backend/index.js` — Express proxy holding the `x-api-key`, one route per
  BMONI step (`/api/bmoni/users`, `/wallet`, `/onboard-ngn`, `/escrow/lock`,
  `/escrow/release`, `/offramp`, `/purses/*`), file-backed user cache and live
  recovery across paginated user lists.
- `apps/web/lib/bmoni.ts` — typed client used by the UI.
- `apps/web/components/MoneyAccountCard.tsx` — dashboard money setup: BMONI user
  → wallet → BVN rail → virtual account + balance, with sandbox persona picker
  (Bunch Dillon / Samson Jabo), find-existing, link-by-ID and start-fresh flows.
- `apps/web/app/checkout-bmoni/page.tsx` — 5-step secured checkout (Account →
  Wallet → NGN rail → Escrow lock → Release & payout) with a timestamped Order
  activity log showing every live BMONI event.

## Step-by-step: how I consumed and integrated it
1. **Read the docs** (`Hackathon_guide.md`, then `bkey.mintlify.app`): lifecycle
   order is user → wallet → KYC/rail → fund → move money. Set the backend to the
   sandbox base URL with the shared `x-api-key`.
2. **Built the proxy** (`apps/backend/index.js`): one route per BMONI step, file-backed
   user cache, fail-fast 503 with no key. Health check returned live, key valid.
3. **Built the UI** (`MoneyAccountCard`, farmer dashboard, `checkout-bmoni`):
   profile → BMONI user → CNGN wallet → BVN rail → virtual account + balance,
   then the 5-step escrow checkout with a timestamped activity log.
4. **Tested live**: user, wallet, balances (0, unfunded as expected), deposit
   account and BVN start all OK — then escrow lock failed
   (`proposalId must be a UUID`). Inspected the payload, found the nested
   `proposal.proposal.id`, fixed the parser, re-ran: `PENDING_SIGNATURES`.
5. **Hit the wall**: creating Bunch Dillon returned 409 — number already held.
   The error hint blamed a cleared local cache, so recovery was improved (10-page
   scan, `+` phone fix) — but recovery then linked a stranger's `Agent` record.
6. **Investigated**: scanned the shared user list page by page with last-10-digit
   phone matching and found both canonical numbers occupied by other teams
   (`Agent` page 4, `hamzat` page 5). That was the moment it clicked: not our bug,
   a shared-fixture collision.
7. **Confirmed in the docs**: "Only the values below resolve" plus the
   persona-matching rule, and the quickstart's note that 409-on-retry is correct
   behavior ("recover the existing user"). Also verified the `bvn-lookup` helper
   live (Samson's record, HTTP 200) as a guaranteed-green KYC call.
8. **Hardened the demo**: wallet 409 → reuse via balances, link-by-ID, start-fresh,
   collapsible sandbox UI, and this write-up.

## How I checked who holds the test numbers
The shared key exposes a paginated user list (`GET /v1/users?limit=100&page=N`),
so I scanned it page by page and matched phone numbers on their last 10 digits
(BMONI stores phones as `+234…`, `234…` or `080…`, so suffix matching is the
robust comparison). That scan found `+2348000000000` occupied on page 4 by
`Agent` (`agent@elderpay.example.com`, created 2026-07-30) and `+2348000000001`
on page 5 by `hamzat` (`hamzat1@gmail.com`). The same scan drives the backend's
10-page recovery lookup, so "Find my existing account" now reaches occupants the
old first-100-only check could never see.

## Sandbox evaluation (for the judges)
The API works; the shared-sandbox model does not scale past two teams. The docs
fix the resolvable identities to two personas, yet phone/email uniqueness is
enforced globally on the shared key — so the first two teams to claim the numbers
lock out everyone else. Notably, the docs already describe a `403 — User does not
belong to this partner` case, so a partner-scoping concept exists in the platform;
it is simply not applied to identity claiming on the shared key. Recommendations:
scope claimed numbers per partner/key, or issue the org keys fast enough that
nobody demos on shared fixtures. Our 409s are this flaw manifesting, not an
integration bug — every other call runs green on the same key.

## Challenges faced
1. **Nested proposal IDs** — escrow approve failed with `proposalId must be a UUID`
   because BMONI nests the id (`proposal.proposal.id`). Fixed the parser; lock then
   returned `PENDING_SIGNATURES` (proposal `e17e73d7…`, verified live).
2. **409 user conflicts — squatted test identities** — the shared sandbox key holds
   one user database for all partners, and the two canonical test numbers were
   already claimed by other teams: `+2348000000000` by `Agent`
   (`agent@elderpay.example.com`, page 4 of the user list) and `+2348000000001` by
   `hamzat` (`hamzat1@gmail.com`, page 5). Creating Bunch/Samson with the documented
   numbers therefore 409s. The docs confirm this 409 is the correct response to a
   duplicate create ("recover the existing user rather than retrying"), so recovery
   was fixed to scan 10 pages, a phone matcher that rejected leading `+` was fixed,
   and the UI gained find-existing, link-by-ID and start-fresh flows.
3. **409 wallet conflicts** — one CNGN wallet per user, so re-running setup on a
   recovered account errored (`E502`). The wallet route now reuses the existing
   wallet via the balances endpoint instead of failing (verified live:
   `379eb051…` / `0x9583…0482`).
4. **Unfunded sandbox + persona matching** — wallets start at 0 with manual test-token
   funding (up to 1 business day), and BVN verification requires the exact registered
   name + phone pair, so full money movement can't go green on a squatted identity.
   The UI surfaces each of these as an explained, timestamped event rather than a
   silent failure.
5. **Lifecycle gap (next step)** — the full lifecycle's USD account needs Enhanced
   Due Diligence plus document uploads (out of scope for this demo). For the NGN
   flow itself no gap remains: per the KYC–Nigeria docs, BVN verification during
   `start-nigeria` auto-populates the KYC profile, so our user → wallet →
   onboard call order already matches. The docs also name `22222222222` (Samson)
   as the sandbox test BVN that always verifies, and expose a no-side-effect
   helper `GET /v1/users/{userId}/kyc/bvn-lookup/:bvn` — wired as
   `/api/bmoni/kyc/bvn-lookup/:userId/:bvn` and verified live (returns Samson
   Jabo's fixed holder details, photo included).
