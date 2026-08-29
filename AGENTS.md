<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.


After end of each task, keep adding tiny context information in that session to this filer AGENTS.md

Claims now use `/?view=Claims`; the sidebar label is Claims and the shared dashboard workspace is the only claims entry point.
The root portal is fixed to the member experience; the account context selector was removed, and employer/CA portals require separate routes.
Member sidebar order is Home, Claims, Passbook, Service history, Services; Account is opened from the top-right profile control, and the homepage no longer includes Account Health.
Claim-flow step labels are centered below their circles; connector lines run only between circles.
Sidebar and homepage cards share Portal's canonical URL navigation function for Claims, Passbook, ServiceHistory, Account, and Home.
Services is a status-led member view for KYC/bank, profile, nomination, and prior-PF transfer; its transfer card opens the existing Claims tracking detail.
Services now includes session-only request flows and status paths for KYC/bank, contact details, nomination, and joint declarations; no flow is connected to EPFO.
Profile correction is Aadhaar-first; employer/EPFO review is displayed only as the fallback when validation cannot confirm the requested change.
Root now begins with an in-memory mock sign-in: Member uses UAN, while Establishment and Principal employer select their own login tabs. The identifier and `EPFO@123` password are prefilled; mock OTP is `123456`; all flows have a deliberate loader and do not use CAPTCHA or real credentials.
Login begins the mock OTP step; Forgot password and Forgot ID links open recovery screens.
Forgot password and Forgot ID now open in-memory recovery screens: member password reset verifies UAN plus registered mobile, and Know your UAN uses Member ID/Aadhaar/PAN plus basic details; establishment/principal recovery sends an ID/password recovery PIN to the registered mobile.
Claim review now permits re-entering bank account and IFSC, then requires a one-time simulated Account Aggregator consent verification before Aadhaar OTP and submission; this is a prototype only, with no bank or EPFO integration.
Service history is the member-facing sidebar and URL view name (`?view=ServiceHistory`); `EmploymentHistory` remains its implementation component.
Service history exposes each member ID in a right-side detail drawer; the timeline stays concise while official-style joining, exit, transfer and status fields are shown on demand.
The drawer’s Passbook handoff uses `?view=Passbook&member=<member-id>` so the selected employment account is retained.
Account profile now contains identity/contact, KYC/bank, nomination, and employment sections; its in-memory update drawer labels each request as self-attested or Joint Declaration before submission.
Services is no longer a member route or sidebar item; Home links directly to Profile KYC using `?view=Account&section=kyc`, and profile requests simulate Aadhaar OTP, e-Sign, employer, and EPFO transitions without external integration.
Mark exit is available only from the active Member ID in the Service history detail drawer; it simulates a Joint Declaration with exit-date confirmation, consent, Aadhaar OTP, and employer/EPFO review states.
An eligible historical Member ID in Service history can start a fresh Form 13 transfer request with Aadhaar OTP; after submission its status handoff uses the existing Claims tracker.
Fresh Form 13 transfer entry now lives in Claims → Start a request; Service history only provides the eligible-record handoff, while the top shell no longer includes search or statement download controls.
Profile-service Aadhaar checks now provide a simulated UMANG handoff with Face Authentication or Aadhaar OTP; claim bank verification retains its prototype AA consent and now offers simulated Finvu, OneMoney, and CAMSfinserv provider selection.
Claims and the latest profile request persist in browser local storage, and the expandable sidebar help card provides EPFO phone links plus concise FAQ guidance.
Successful profile services now create browser-persisted shared tracker records and route to Claims status, alongside claims and Form 13 transfers.
UMANG Face Authentication now asks for client camera permission and shows a local live preview; no photo is uploaded or retained by the prototype.
Profile-service tracker IDs use browser UUIDs, while the Claims view filters any duplicate persisted IDs from earlier sessions.
The resized member sidebar now uses an opaque white background, with no backdrop blur.
Portal pages, Claims panels, notifications, login states, and drawers use brief slide-in transitions, disabled for reduced-motion preferences.
Top-right account hover cards provide identity/KYC context and logout; Profile also exposes logout. Establishment actions cover member, ECR/challan, payment, compliance, report, and access requests, while principal-employer actions cover contractor links, work orders, contract workers, compliance, and reports in local-only preview/submit flows.
Employer and principal-employer submitted actions now persist role-scoped browser request trackers, grouped by their originating service page.
`EPFO_EXPERIENCE_CASE.md` captures the product rationale, grounded in PRD/session context and official EPFO sources, while retaining clear prototype boundaries.
The experience case also incorporates prior-session decisions: financial-product framing, claim/passbook-first member hierarchy, connected employment evidence, and separate role contexts.
The language picker now supports English plus Romanized Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi and Odia; core navigation/sign-in phrasing is localized and other prototype copy falls back to English.
The language control is a single native dropdown, rather than separate quick-toggle buttons and a picker.
The language dropdown has a fixed 156px single-control width, and Passbook exposes the existing statement PDF as a contextual passbook download.
<!-- END:nextjs-agent-rules -->
