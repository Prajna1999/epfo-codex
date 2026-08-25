@AGENTS.md

# EPFO Codex project handoff

This file is the working context for future coding sessions. Read it before exploring the repository, then read `AGENTS.md` and the specification relevant to the requested change.

## Product intent

This repository is a high-fidelity frontend prototype for a unified Employees’ Provident Fund Organisation portal. One identity can act as:

- An EPFO member managing personal PF savings, employment history, withdrawals, and account details.
- An employer representative managing employees, ECR/contributions, payments, compliance, reports, and access.
- Employer and CA users will use separate sign-in routes when those portals are implemented.

The product principles are progressive disclosure, plain language, context-first navigation, and strong confirmation only for sensitive actions. `PRD.md` is the broad product source of truth. `CLAIM.md` is the source of truth for the simplified member claim journey.

This is currently a frontend prototype. There is no backend, database, authentication service, eligibility service, claim API, notification system, or external EPFO integration.

## Framework and repository rules

- Next.js `16.3.2` App Router with React `19.2.8` and strict TypeScript.
- Tailwind/PostCSS are installed, but most existing UI uses plain global CSS. The new claim flow uses a CSS Module.
- There is no component library, form library, validation library, test framework, or state-management dependency.
- Reuse native React, Next.js, HTML, CSS, and standard library features before adding code or packages.
- This Next.js version contains breaking changes. Before changing routing, layouts, forms, caching, navigation, metadata, or another framework feature, read the relevant bundled guide in `node_modules/next/dist/docs/`. This is mandatory per `AGENTS.md`.
- Keep `page.tsx` and `layout.tsx` files thin. Put interactive UI and state in named components.
- Preserve accessibility basics: real labels, fieldsets/legends, keyboard focus, `aria-current`, `aria-live`/alerts, visible focus styles, and reduced-motion behavior.

## Route map

### `/`

The unified dashboard route.

- `app/page.tsx` awaits `searchParams`, validates `view`, and passes the result as `initialNav` to `Portal`.
- Allowed member query values are `Home`, `Claims`, `Passbook`, `Employment`, `Services`, and `Account`.
- Missing, repeated, or unknown values fall back to `Home`.
- Example: `/?view=Passbook` opens the member passbook.
- Because the route reads `searchParams`, the production build reports `/` as dynamically rendered.

### Claims

- `/?view=Claims&tab=start` is the canonical start-claim view and `/?view=Claims&tab=status` is the claim-history view; `claim` selects a history record, including the completed mock PF transfer.
- `app/components/ClaimsWorkspace.tsx` embeds the guided `ClaimFlow` alongside compact, static claim history and a selected progress timeline.
- There is no standalone claims route; the dashboard Claims workspace is the only member claims entry point.
- The sidebar uses the member-facing **Claims** label.

No dedicated route currently exists for account settings or employer subsections. The passbook, employment history, claims, and Services are in-dashboard views.

## Application composition

### Root

- `app/layout.tsx` owns global metadata and imports `app/globals.css`.
- It wraps all routes in `LanguageProvider`, so language selection is shared by dashboard and claim pages.
- `app/page.tsx` contains no client state; it only validates the initial dashboard view.

### Portal state and chrome

- `app/components/Portal.tsx` is a fixed member portal. It owns mobile-sidebar visibility and one `useRouter` navigation function shared by the sidebar and member-dashboard cards.
- Home renders `MemberDashboard`, Claims renders `ClaimsWorkspace`, Passbook renders `Passbook`, Employment renders `EmploymentHistory`, Services renders `Services`, and Account renders `AccountProfile`.
- `app/components/PortalChrome.tsx` owns reusable structural UI:
- `PortalTopbar`: branding, search, notifications, language control, and profile mock.
- `PortalSidebar`: member navigation and responsive open/close state.
- Navigation definitions live in `PortalChrome.tsx`. Add a label and matching `IconName` there when adding a sidebar item.

Account is intentionally not in the member sidebar. The top-right Rahul Patil profile control opens the read-only `AccountProfile` view, which displays core EPFO personal and contact details. Corrections remain in Services via joint declaration.

### Dashboard components

`app/components/MemberDashboard.tsx` contains these named sections/components:

- `BalanceCard`: PF balance front face and UAN identity-card back face.
- `PortalTopbar`: its bell opens the latest Infosys contribution notification; the summary is intentionally not duplicated in the dashboard body.
- `ServicesSection` and `ServiceCard`: member quick actions.
- `RecentActivityCard`: recent contribution transactions.
- `ClaimStatusCard`: current medical advance progress.
- `EmploymentHistory.tsx`: sidebar Employment view. It owns the connected-line display from Techcore Systems (transferred) to Infosys Limited (active); it is intentionally not shown on Home.

The Home quick-action order is intentionally:

1. File a Claim
2. Past Claim Status
3. View Passbook

File a Claim opens the Claims start tab. Past Claim Status and the dashboard medical-advance tracker open the Claims status tab; the latter selects its active claim. View Passbook opens the Passbook view. The Account Health card was intentionally removed from Home. The member header's Download statement link downloads the static `public/pf-statement.pdf` as `EPFO-PF-Statement-2026-27.pdf`; it contains the minimal headers EPF Wages, EPS Wages, Employee Share, Employer Share, and Pension Share.

`Services.tsx` is the low-frequency account-maintenance overview: KYC/bank, contact details, nomination, Aadhaar-first profile updates, previous-PF transfer, and UAN card. The four update services use a local two-step request flow and session-only request-status tracker; profile updates show employer/EPFO review only as a validation fallback. Transfer opens the existing Claims tracking detail and the UAN card returns Home. Do not add network submission without a secure backend service, authentication, document handling, OTP/e-sign, and employer/EPFO approval contracts.

`app/components/Passbook.tsx` is the member passbook. It has native Member ID and financial-year selects: the current Infosys ID plus a Techcore past-member ID. The selected account determines available years and its static ledger. A clean four-column table exposes the two transaction types through their attributes—date, particulars, credit, and debit—while the summary calculates opening, credit, debit, and closing totals. `passbook-data.ts` holds the sample ledgers and pure `passbookTotals` helper; `passbook-data.test.mjs` verifies their balances. Use static prototype data until a secure account API is designed. `passbook.module.css` keeps the table responsive with horizontal scrolling on narrow screens.

`app/components/EmployerDashboard.tsx` remains an unused mock component until a separate employer route is requested.

`app/components/Icon.tsx` contains the inline SVG path registry. Use an existing `IconName` before adding another icon. `LanguageSwitch.tsx` uses `LanguageProvider` to switch between English and Romanized Hindi.

## Balance and UAN card behavior

- `BalanceCard` stores only a `cardFlipped` boolean.
- “View UAN ID” flips to the back face; Balance flips back.
- The download control links to `/uan-card.pdf` with download name `EPFO-UAN-Card-100920000123.pdf`.
- The first-load coachmark, pulse animation, edge peek, local-storage key, and dismiss logic were intentionally removed. Do not restore a hint unless explicitly requested.
- `public/uan-card.pdf` is an untracked working asset. Preserve it.

## Localization

- `app/language.tsx` contains one `dict` mapping an English lookup key to `{ en, hi }`.
- `t(key)` returns the localized string or the key itself when missing.
- `tpl(key, params)` localizes and replaces `{param}` placeholders.
- Language values are `en` and `hi`; `hi` is Romanized Hindi, not Devanagari UI copy.
- The selected language is stored as `epfo.lang` in `localStorage` and synchronized by a browser `storage` event.
- Server rendering always starts with English through `readLanguageServer`; client hydration then reflects the stored preference.
- Add both English and Hindi values for every new user-facing phrase. Stable form values should remain English constants, while rendered labels pass through `t`; this prevents language changes from corrupting conditional state.

## Claim flow specification and implementation

### Files

- `app/claims/new/ClaimFlow.tsx`: interactive four-step UI embedded by `ClaimsWorkspace`.
- `app/claims/new/claim.ts`: types, constants, mock details, legacy-form mapping, and pure step validation.
- `app/claims/new/claim-flow.module.css`: route-scoped layout and responsive styling.
- `app/claims/new/claim.test.mjs`: minimal Node test covering every branch and the OTP gate.
- `CLAIM.md`: product requirements and legacy Form 31/19/10C reference.

### Draft state

`ClaimDraft` contains:

- `type`: `advance`, `settlement`, `pension`, or empty.
- `detailsConfirmed`: confirmation of auto-filled UAN/KYC details.
- Advance fields: `purpose`, `amount`, and `purposeDetail`.
- Settlement field: `taxDeclaration`.
- Pension field: `pensionChoice`.
- Final confirmation fields: `bankConfirmed` and `otp`.

`otpSent`, current `step`, validation `error`, and `submitted` are separate UI state in `ClaimFlow`.

Changing claim type resets the complete draft, OTP-sent state, and errors so answers from one legacy form cannot leak into another branch. Back and Continue preserve the current draft. Refreshing or leaving the route resets everything because there is intentionally no persistence.

### Step 1 — Choose claim

The user must choose exactly one card/radio option:

- PF advance → Form 31.
- Final PF settlement → Form 19.
- Pension benefit → Form 10C.

The selected card is visually highlighted. Continue is rejected until a type is selected.

### Step 2 — Confirm details

All values are displayed as read-only definition-list data. The user must check “These details are correct.”

Shared mock values:

- Name: Rahul Patil.
- UAN: `1009 2000 0123`.
- Bank: HDFC Bank `•••• 4821`.

Employment values depend on claim type:

- PF advance: Infosys Limited, joined 1 July 2023, currently employed.
- Settlement or pension: Techcore Systems, joined 1 April 2021, left 30 June 2023.

### Step 3 — Relevant questions

PF advance requires:

- A purpose from Illness, Housing, Marriage, Education, Natural calamity, Electricity cut, or Assistive equipment.
- A numeric amount greater than zero.
- One non-empty conditional detail whose label comes from `purposeQuestions`:
  - Illness → Patient and relationship.
  - Housing → Housing requirement.
  - Marriage → Beneficiary and relationship.
  - Education → Student and course.
  - Natural calamity → Date and place affected.
  - Electricity cut → Outage period.
  - Assistive equipment → Equipment required.

Final settlement requires one tax declaration value: Not applicable, Form 15G, or Form 15H.

Pension benefit requires one radio choice: Pension claim benefit or Scheme certificate.

No official eligibility limits, document uploads, tax calculations, or service-duration rules are implemented.

### Step 4 — Review, OTP, and submit

- Displays claim type, mapped legacy EPFO form, branch answers, and payment account.
- Requires explicit bank-account confirmation.
- Send OTP only toggles the local `otpSent` state and reveals the OTP input.
- OTP accepts digits only, is truncated to six characters, and validates against exactly six digits.
- Any six digits are accepted. No demo OTP is displayed and no network request occurs.
- Successful submit creates an in-memory record with reference `CLM-20260825-001`, then returns to the selected Claim status detail. `claims-data.ts` contains the mock history and `claims-data.test.mjs` checks submitted-record creation.

### Accessibility behavior

- Each step uses a real `fieldset` and `legend`.
- Radio and checkbox controls have associated label content.
- The progress list uses `aria-current="step"`.
- Validation text uses `role="alert"`.
- The step heading receives focus after each step or success transition.
- Inputs expose native keyboard/input semantics; OTP uses `inputMode="numeric"` and `autoComplete="one-time-code"`.
- CSS retains existing global focus-visible and reduced-motion rules.

## Styling conventions

- `app/globals.css` contains legacy portal rules followed by a “2025 consumer refresh” override section and UAN flip styles. Order matters; later rules intentionally override earlier rules.
- Avoid adding claim-specific selectors to `globals.css`; use `claim-flow.module.css`.
- Global design tokens include `--navy`, `--blue`, `--ink`, `--muted`, `--line`, `--bg`, and `--green`.
- The portal’s primary responsive breakpoints are approximately 1100px, 780px, and 480px.
- `action-card` supports both buttons and links; the final global rule removes link decoration while retaining the same visual card treatment.
- Do not run a formatter that mechanically rewrites the dense legacy CSS unless that cleanup is the explicit task.

## Prototype boundaries

Do not mistake simulated UI for production integration:

- No member authentication or authorization checks.
- No server-side claim validation or Server Action.
- No EPFO eligibility or balance calculation.
- No real OTP delivery, Aadhaar validation, e-sign, or anti-fraud controls.
- No claim persistence, idempotency, retry handling, or audit trail.
- No document upload or Form 15G/15H file handling.
- No generated Form 31/19/10C PDF; only an in-memory mapping and review summary.
- Claim history is representative in-memory mock data. New submissions disappear after a reload and are not connected to EPFO.

If real submission is requested, treat it as a new backend/security project. Do not convert the prototype submit button into a network call without defined authentication, API contracts, server validation, error behavior, and data-handling requirements.

## Verification commands

Run these after claim, routing, language, or shell changes:

```sh
npm run lint
npx next typegen
npx tsc --noEmit
node --experimental-strip-types --test app/claims/new/claim.test.mjs app/components/passbook-data.test.mjs app/components/claims-data.test.mjs
npx next build --webpack
```

Notes:

- `next typegen` is important after adding or removing routes. Stale `.next/types` and `.next/dev/types` can otherwise conflict during a standalone `tsc` run.
- The Node test emits a harmless module-type warning because `package.json` does not declare `type: module`. Do not change the entire package module mode merely to remove that warning.
- The default Turbopack production build may panic in restricted environments while binding an internal worker port. `npx next build --webpack` is the verified fallback.
- The latest completed checks passed ESLint, route type generation, strict TypeScript, the claim branch test, `git diff --check`, and a production webpack build.
- The verified production route table showed `/` as dynamic and `/claims/new` as statically prerendered.
- Visual browser QA of the Claims workspace is still pending because no in-app or connected browser was available during implementation.

## Current worktree and ownership

The repository is intentionally dirty. Existing modified or untracked files belong to the ongoing prototype work and must be preserved.

Expected working changes include:

- Modified root layout, dashboard page, global styles, and language dictionary.
- Untracked/refactored files under `app/components/`.
- New claim route and components under `app/claims/`.
- Untracked `CLAIM.md` specification.
- Untracked `public/uan-card.pdf`.
- An untracked screenshot under `public/` whose filename contains the capture timestamp.

Do not use destructive Git commands, delete untracked assets, revert unrelated changes, or assume the current Git baseline reflects the visible application.

## Recommended next-session startup

1. Read `AGENTS.md`, this file, and the specification relevant to the request.
2. Run `git status --short`; preserve every existing change unless the user explicitly scopes its removal.
3. Inspect the specific component and all callers before editing.
4. If changing Next.js behavior, read the matching bundled Next.js 16 guide first.
5. Make the smallest change at the shared/root cause location.
6. Add or update English and Romanized-Hindi copy together.
7. Run the verification commands above.
8. If browser control is available, manually exercise `/`, File a Claim navigation, all three Step 3 branches, Back/Continue retention, invalid OTP, successful submission, Hindi mode, and mobile layout.
