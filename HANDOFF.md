# EPFO Finance Workspace — Product & Engineering Handoff

## Session update — 2026-09-05: Chat-only pivot & cross-domain agent

This session replaced the Chat/Plan workspace described below with a single, full-screen, ChatGPT-style chat view, and made the agent genuinely read connector/cohort toggle state instead of just displaying it. **Everything under "Product decisions" → "Workspace interaction model" and the Plan/Cohort Card/Scenario Lab/Sources-drawer references further down are now historical** — kept for data-model context, not as a description of the current UI. Read this section first.

### 1. Product pivot: Chat-only, full-screen, sidebar-native

- `EpfAgent` is now a permanent left-sidebar destination ("Finance"), not a topbar-launched overlay drawer — no more "Back to EPFO" header bar or second in-page header.
- Removed entirely: the Chat/Plan tab toggle, `PlanPanel`, `CohortCard`, `ScenarioLab`, the `/simulate` and `/project` slash commands and their picker UI, and the full-screen "insight" panels (`RetirementInsight`, `PensionInsight`, `ContributionInsight`, `EligibilityInsight`, `ReadinessInsight`). Retirement projections, pension estimates, and life-event simulations are now answered **only** inline in chat (natural language or `/chart`), with real charts attached to the answer.
- The composer is pinned to the true bottom of the screen (flex-column layout, `.agent-chat-thread` scrolls, the input card sits fixed above the footer) instead of `position: sticky` mid-page.
- A small settings-gear icon top-right (`.finance-account-toggle`, `Icon name="settings"`) opens a slide-in right drawer ("Account access") — reuses the shell's existing `aside[role="dialog"]` slide-from-right animation instead of a custom one, and is now genuinely opaque (a shared CSS selector cleanup had accidentally stripped its background).
- Drawer contents: EPFO passbook status (read-only, no manual "Refresh" button — passbook connect/disconnect now lives explicitly in the chat composer instead), a **deterministic, non-AI** "Advance & withdrawal eligibility" list per claim purpose, and the cohort-data privacy toggle.

### 2. Composer: connectors live next to the message box, ChatGPT-style

- A single "Connectors" / "Broker panel" icon button sits inside the dark composer card (not inside the white input pill), opens a popover ("Broker panel") listing an explicit **EPFO Passbook** connect toggle plus Zerodha/Upstox/Groww, each expandable to per-scope checkboxes (value/holdings/transactions).
- Fixed several real interaction bugs found via live Playwright QA, not just code review:
  - Popover was anchored `left:0` and ran off the right edge of the viewport → anchored to the button correctly now.
  - Provider-name span was being stretched into an oval blob by a stray `:first-child` selector → given its own class.
  - Send-button icon was invisible when the input was empty — root cause was a generic `.finance-workspace button:disabled{color:var(--color-muted)}` rule beating the intended send-button color by CSS specificity; added a same-or-higher-specificity override.
  - Toggling EPFO off used to make the **entire chat view and composer disappear** (including the toggle that turned it off — no way back in). Now the composer/thread always render; a dismissible inline notice appears in the thread instead, and the toggle stays reachable.
  - Focusing the input while the broker popover was open used to leave both open at once ("contradictory interactions"); focus and popover-open state are now mutually exclusive.
  - Clicking the empty input used to dump a big "Prepare a request / Try asking" panel every time (felt like "the entire panel opens up"); suggestions now only appear for `/` and `@`, and the prepare-a-request actions + example prompts moved into the empty-thread state instead.

### 3. Agent now actually uses toggle state (was mostly cosmetic before)

Investigated via a live test harness hitting `/api/agent-intent` directly plus full Playwright runs — found and fixed real gaps, not just cosmetic ones:

- **Cohort toggle was fully dead**: no intent, no answer function ever consumed `permissions.cohort` after the Plan/CohortCard removal. Added a `cohort_comparison` intent (`app/api/agent-intent/route.ts`) and `answerCohortComparison()` (`EpfAgent.tsx`), wired through `AskInWords`/`runQuery`. It now genuinely reads `percentileForBalance`/`cohortBenchmark` and respects the toggle (says "paused" honestly when off, and is explicit that the benchmark is **EPF-balance-only**, not blended net worth).
- **Generic ("no broker named") portfolio questions ignored holdings/transactions scopes**, only ever returning an aggregate total-value sentence. `answerPortfolioSnapshot(null, …)` now also surfaces holdings and full trade history across every connected broker with those scopes granted, and leads with the real EPF balance for comparison context.
- **`answerMention` only surfaced the single latest trade**; now lists full recent trade history when the transactions scope is on.
- Classifier was letting a mentioned broker name leak `provider` into unrelated intents (cohort/withdrawal), silently collapsing comparative questions like *"between my EPF and my Zerodha, where's most of my money?"* into a Zerodha-only answer. Tightened `app/api/agent-intent/route.ts` instructions so `provider` only ever applies to `portfolio_snapshot`.
- **New: cross-domain synthesis.** The classifier now independently flags `includeEpf` / `includePortfolio` / `includeCohort` on every message regardless of the single primary `intentType` it picks. `applyCrossDomainContext()` in `EpfAgent.tsx` appends a real, toggle-respecting context line for each flagged topic that isn't already the primary answer. Verified live: *"What if I lost my job for 6 months — how would that hit my Zerodha holdings and where would I stand vs my peers?"* now answers with the job-loss simulation **and** the real connected Zerodha value **and** the real cohort percentile, in one turn — instead of only ever answering one bucket.
- Scenario simulation (`scenario_simulation` intent: job loss, medical emergency, market drawdown) is fully chat-native now — no more picker modal; `simulateMarketDrawdown` already read connected broker value correctly and was left as-is.

### 4. Known limitation (flagged to the user, not yet built)

The classifier still picks exactly one **primary** intent per message; cross-domain flags only ever *append* short context lines for the non-primary topics, they don't produce one fully synthesized narrative answer. True multi-intent synthesis (e.g. classifying a list of intents and merging full answers/charts) would be a larger follow-up if wanted.

### 5. Files touched this session

- `app/components/EpfAgent.tsx` — largest change; see above.
- `app/api/agent-intent/route.ts` — `scenario_simulation`, `cohort_comparison` intents; `includeEpf`/`includePortfolio`/`includeCohort` flags; provider-leak fix.
- `app/finance-workspace.css` — full restyle for the chat-only, bottom-pinned, ChatGPT-style layout; removed a large amount of now-dead CSS (Plan/Cohort/Scenario-Lab rules); fixed the transparent-drawer regression.
- `app/components/Icon.tsx` — added a `settings` (gear) icon.
- Verification each round: `npx tsc --noEmit`, `npm run lint`, `npx next build --webpack`, plus live Playwright browser QA and direct `/api/agent-intent` classifier probes (not just static code review) — this is how the interaction bugs and the dead-cohort-feature bug were actually found, not guessed at.

## Purpose

The EPF agent has been shaped into a low-touch personal finance workspace for financially sophisticated EPFO members. It is designed as a trusted gateway: Rahul can understand his position, ask questions, model a decision, and selectively connect more financial accounts without being confronted by a dense dashboard.

The current implementation uses realistic, internally consistent mock data. It is a product prototype, not a live financial-data integration or financial advice service.

## Product decisions

### Primary persona: Rahul Patil

Rahul is a 34-year-old Senior Product Manager in Bengaluru. He is married, has one dependent, and earns ₹24.8L gross annually with ₹1.52L monthly take-home pay. His monthly plan allocates ₹72k to essentials, ₹17k to discretionary spending, and ₹63k to investing or goals. He has ₹4.2L in liquid savings, equivalent to roughly 4.7 months of regular outgo.

His EPF contribution is ₹8,430 employee + ₹7,180 employer EPF, with ₹1,250 routed to EPS each month. His retirement target is ₹5Cr at age 58 in 2050.

### Workspace interaction model

> **Superseded by the 2026-09-05 session update above.** There is no Chat/Plan toggle, Plan view, Cohort Card, Scenario Lab, or "Sources" drawer anymore — it's a single full-screen chat view, and connectors/passbook live in the composer. Kept below only for historical data-model context.

- Chat is the default view for questions, insights, simulations, and recommended next actions.
- Plan is a progressive-disclosure view for the longer-term retirement picture.
- Sources is a single consent drawer for EPFO access, anonymous cohort comparisons, passbook refresh, and broker connections.
- High-value actions remain visible as a single next-action card, so Rahul does not need to hunt through menus.
- Backend-like states are shown for permission changes, passbook refresh, and broker authorization: working, success, and error.
- Broker connections are read-only and require an explicit user action. No trade or money movement is implied.

### Trust and disclosure decisions

- Cohort data is labelled “synthetic model” and includes methodology, sample size, and a clear “not EPFO-published” disclosure.
- The workspace distinguishes recorded PF balance from immediately claimable money.
- The footer states that the product provides guidance, not financial advice.
- Permissions apply to this workspace only; providers cannot see another provider’s data.
- The plan exposes assumptions instead of hiding them: age, occupation, household, take-home, surplus, emergency buffer, EPF rate, and annual contribution growth.

## Data model and reconciled mock state

### EPFO member IDs

| Employer | Status | Member ID | Balance | Key event |
| --- | --- | --- | ---: | --- |
| Infosys Limited | Active | `MHBAN1318576000010404` | ₹6,76,274 | Current account; joined 3 Nov 2025 |
| Civic Data Labs | Transfer available | `MHBAN1318576000010832` | ₹2,85,000 | Previous employer; Form 13 transfer available |
| Techcore Systems | Transferred | `MPIND2742177000010037` | ₹0 | ₹4,99,574 credited into Infosys on 18 Jan 2026 |

The current total PF balance is therefore **₹9,61,274**, calculated from passbook opening balances plus credits minus debits. The transfer-ready Civic balance is included in total wealth but is not double-counted after consolidation.

### Passbook detail

Passbook entries now carry:

- contribution, interest, transfer, and claim categories;
- employee EPF, employer EPF, and EPS splits for contributions;
- ECR, interest, transfer, and claim references;
- opening balance, credits, debits, and closing balance per financial year;
- the ₹60,000 education advance that appears both in the claim history and Civic ledger;
- the completed Techcore transfer represented as a debit in the old account and a credit in the Infosys account.

### Cohort benchmark

The cohort is a matched synthetic group of 3,842 profiles: age 32–36, salaried technology roles, and 7–10 years of EPF-linked service.

Current benchmark points:

- 25th percentile: ₹3.2L
- median: ₹6.1L
- 75th percentile: ₹9.2L
- 90th percentile: ₹14.8L
- median monthly EPF credit: ₹11,400
- median contribution continuity: 91%
- median linked service: 7.4 years

Rahul’s ₹9.61L balance resolves to the 76th percentile using linear interpolation between the benchmark points. The UI also explains that his position is influenced by uninterrupted deposits and the completed transfer, not only salary.

### Broker connector snapshots

The source drawer includes realistic read-only snapshots for:

- Zerodha — Kite `••K218`, ₹7,61,450 value, 14 holdings, ₹6,42,550 invested;
- Upstox — UCC `••7741`, ₹2,28,740 value, 7 holdings, ₹2,07,410 invested;
- Groww — Demat `••9046`, ₹5,37,460 value, 9 holdings, ₹4,69,240 invested.

Each connected provider shows a rounded allocation mix and calculated gain. These are intentionally compact: enough to establish confidence and context without turning the source drawer into a portfolio terminal.

## Code changes

### New files

- [`app/components/finance-profile-data.ts`](./app/components/finance-profile-data.ts) — canonical Rahul persona, cohort benchmark, percentile calculation, and broker snapshots.
- [`app/components/passbook-data.ts`](./app/components/passbook-data.ts) — detailed multi-employer passbook ledger and balance helpers.
- [`app/components/service-history-data.ts`](./app/components/service-history-data.ts) — aligned employment timeline and transfer state.
- [`app/api/finance-action/route.ts`](./app/api/finance-action/route.ts) — validated mock backend action endpoint with simulated server latency.
- [`app/api/passbook/route.ts`](./app/api/passbook/route.ts) — mock passbook refresh endpoint.

### Main updated areas

- [`app/components/EpfAgent.tsx`](./app/components/EpfAgent.tsx) — Chat/Plan workspace, cohort card, scenario lab, source drawer, permission toggles, connector states, and server-action feedback.
- [`app/components/agent-data.ts`](./app/components/agent-data.ts) — projections, contribution checks, pension/service calculations, and chart data now read from the shared dataset.
- [`app/components/MemberDashboard.tsx`](./app/components/MemberDashboard.tsx) — derived PF balance, active/transfer-ready split, and recent contribution activity.
- [`app/components/Passbook.tsx`](./app/components/Passbook.tsx) — employee/employer/EPS columns, other credits, debits, and references.
- [`app/components/AccountProfile.tsx`](./app/components/AccountProfile.tsx) — canonical identity and employment details.
- [`app/components/claims-data.ts`](./app/components/claims-data.ts) and [`app/claims/new/claim.ts`](./app/claims/new/claim.ts) — corrected claim and transfer records.
- [`app/components/MockLogin.tsx`](./app/components/MockLogin.tsx) — corrected Rahul recovery date.
- [`app/finance-workspace.css`](./app/finance-workspace.css) — responsive workspace, cohort statistics, plan view, source drawer, loaders, and status treatments.

## Validation completed

The following checks pass:

```bash
node --test app/**/*.test.mjs
npm run lint
npm run build
git diff --check
```

The cross-workspace test verifies the PF total, percentile, household cash-flow equation, member/service ID alignment, education claim ledger entry, completed transfer pair, and broker snapshot sanity.

The workspace was also checked at a phone-sized viewport for horizontal overflow and visually inspected with the Sources drawer open and Zerodha connected.

## Important prototype boundaries

- All balances, cohort statistics, broker values, and server responses are mock data.
- Cohort comparisons must be replaced with an approved, privacy-reviewed aggregate dataset before production use.
- Broker connectors need OAuth, provider-specific consent scopes, token storage, revocation, error handling, and security review.
- EPFO data access needs a real authenticated server boundary; never expose credentials or raw personal financial data to the client.
- Projection output is illustrative and should eventually show scenario ranges, inflation treatment, and a clear methodology approved by compliance.
- “Last synced” labels are prototype timestamps and must come from server metadata in production.

## Recommended next implementation slice

Keep the interface stable and replace the mock seams one at a time:

1. Introduce a server-side account snapshot contract matching `finance-profile-data.ts` and `passbook-data.ts`.
2. Replace the passbook endpoint with authenticated EPFO data and preserve the same derived balance helpers.
3. Add one broker connector end-to-end (read-only holdings first) before adding more providers.
4. Instrument consent, refresh, and insight usage before adding any new surface area.

