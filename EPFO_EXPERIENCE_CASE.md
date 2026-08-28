# From a services directory to a guided EPFO workspace

## The argument in one minute

EPFO already exposes the essential services: member profile updates, ECR and challan submission, TRRN search, establishment reporting, and a Principal Employer facility for contract-employer, work-order, and worker information. The opportunity is not to replace those statutory services. It is to make the right service easier to find, safer to complete, and possible to track without asking a member or employer to understand the portal’s internal structure first.

This prototype turns a collection of official capabilities into role-specific workspaces. A member sees their PF account and the next action; an establishment sees contribution operations and approvals; a Principal Employer sees contractor compliance work. Every sensitive request follows the same legible pattern: enter details, preview what will be submitted, authenticate or attest where appropriate, see processing, and return to a tracker.

The result is a better user experience because it reduces uncertainty—not because it changes EPFO’s rules.

## What we retained from EPFO

The design deliberately maps to, rather than invents, EPFO’s real service model.

| Official EPFO capability | Experience in this prototype |
| --- | --- |
| Employer registration, online ECR/challan/OTCP, TRRN query and establishment e-report card | Establishment-specific Employees, ECR & contributions, Payments, Compliance, Reports and Access pages |
| ECR upload → employer approval → challan | A guided ECR/challan flow with a review screen, processing state and request tracker |
| Member and employer profile-update requests | Aadhaar-first profile journeys, self-attested versus Joint Declaration routes, and employer/EPFO review states |
| Principal Employer interlinking with contract employers | A separate principal-employer workspace for contract-employer links, work orders, contract workers, compliance and reports |
| EPFO’s separate member and employer sign-in contexts | Separate Member, Establishment and Principal Employer mock entry points; no confusing context switcher in a member’s personal account |

EPFO’s employer pages explicitly list online ECR/challan submission, TRRN query, establishment search and e-reporting, and describe online monthly return filing integrated with contribution payment. [EPFO — For Employers](https://www.epfindia.gov.in/site_en/For_Employers.php/Copyright.php) The ECR flow also describes a digitally signed uploaded return and a challan generated after employer approval. [EPFO — Online ECR/Challan Submission](https://www.epfindia.gov.in/site_en/Online_ECR.php/index.php)

For Principal Employers, EPFO already frames the job as interlinking with contract employers and capturing work orders, outsourced contracts and contract-worker information. [EPFO — Principal Employer](https://www.epfindia.gov.in/site_en/Principal_Employer.php)

## What changed

### 1. The portal now starts with the person’s job, not the organisation chart

The official service landscape is necessarily broad: it contains statutory links, reference material, account types and specialist tools. That is useful for coverage, but it asks users to translate intent into portal terminology.

This product reverses that burden:

- “Transfer previous PF” starts a Form 13 journey rather than making the member locate the form.
- “Mark exit” lives next to the active employment record, where the member naturally expects it.
- “KYC and bank”, “Nomination”, and “Identity and contact” sit inside Profile rather than behind a generic services catalogue.
- An employer sees “Upload ECR”, “Generate challan” and “Pay actionable challan” as a sequence, not disconnected destinations.
- A Principal Employer sees contractor links, work orders and contract workers as one compliance domain.

This is the PRD’s core principle in practice: use plain-language tasks while preserving official form names when they matter.

### 2. Requests are treated as journeys, not clicks

The biggest experiential difference is continuity. Prior work in this session added a common request model across member, establishment and principal-employer tasks:

1. Enter the data.
2. Preview the consequential request before submission.
3. Complete the appropriate simulated proof step—Aadhaar OTP, live camera confirmation, AA-style bank consent, employer attestation, or Joint Declaration.
4. See a deliberate processing state.
5. Land on a persisted tracker with a reference and clear next status.

That pattern gives the user the essential answer after any government-service action: *what did I submit, what happens next, and where can I find it later?*

Browser-local persistence is intentional for the prototype. It demonstrates continuity across refreshes without pretending that EPFO, Aadhaar, an Account Aggregator, a bank, or an employer has received real data.

### 3. Identity confidence is visible, not implied

The member experience now makes the security path understandable:

- Aadhaar-linked OTP is offered as a clear route.
- Face authentication asks the browser for camera permission, shows a live preview, and explicitly states that the photo is not uploaded or retained.
- Claim bank verification uses an AA-style consent screen with a selected simulated provider and a defined data purpose.
- Profile changes visibly split into self-attested and Joint Declaration routes, so a member knows when employer review is required.

This does not replace EPFO’s actual authentication or legal controls. It makes the reason for each control legible before the user commits.

### 4. The profile becomes a trusted account centre

The original member account view was too narrow for the decisions users actually need to make. It now brings together identity and contact information, KYC and bank details, nomination, and current/previous employment. The top-right hover card gives a brief UAN/KYC view and logout; the Profile page offers the same safe exit.

That matters because profile corrections, KYC, nomination and employment history are not unrelated services. They are the evidence layer beneath claims, transfers and settlements.

### 5. Employer and Principal Employer are now different products, as they should be

The PRD is explicit that a Principal Employer is not simply an employer dashboard with different copy. The two roles now have distinct navigation and action sets:

- **Establishment:** Employees; ECR & contributions; Payments; Compliance; Reports; Users & access.
- **Principal Employer:** Contract employers; Work orders; Contract workers; Compliance; Reports.

Both use review, simulated submission and role-scoped trackers, but their information architecture reflects their real responsibilities. This is especially important for contractor compliance: the work order and the workers are context for the compliance task, not optional attachments.

## The design lineage from earlier sessions

This was not a one-screen reskin. Earlier work established a consistent product position that the current flows build on:

- **Treat EPFO as a financial product.** The home experience leads with PF balance, contribution context and Passbook, instead of a generic government-service landing page. The UAN card remains available as a trust and identity artefact without displacing the financial job.
- **Prioritise the three highest-frequency member jobs.** File a Claim, Past Claim Status and View Passbook appear before lower-frequency maintenance tasks. That is a deliberate hierarchy, not just a rearranged menu.
- **Make claims one workspace.** Starting an advance, settlement or pension claim and tracking a past claim no longer compete as separate destinations. The user can move from application to status without reorienting.
- **Make employment history operational.** The connected employment view is not a static timeline: a member can inspect a Member ID, open the relevant passbook, initiate a transfer from an eligible history record, or mark exit from the active record through the right declaration path.
- **Keep navigation singular.** Home cards and the sidebar use the same destinations, so a user does not arrive at a different version of Claims, Passbook or Service History depending on where they clicked.
- **Respect context boundaries.** The member does not have to choose among unrelated account contexts. Establishment and Principal Employer work start from their own sign-ins and carry their own task models.

These decisions are why the proposal feels coherent: the financial account, service history, claims, identity controls and employer compliance tools each have a clear home, but no longer behave as isolated products.

## Why this is a better solution

| User problem | Better design response | Value |
| --- | --- | --- |
| “Which EPFO service applies to me?” | Role-specific navigation and task names | Less terminology to learn; faster first action |
| “Am I about to submit the right thing?” | Request preview before OTP/e-sign/attestation | Fewer avoidable errors and more confidence |
| “Did anything happen?” | Explicit processing and tracker handoff | Reduced repeat submissions and support demand |
| “Why is this taking longer?” | Visible self-attested, employer-review and EPFO-review stages | Clear expectations instead of a black box |
| “Where is my previous PF / employment evidence?” | Service-history drawer, passbook handoff and transfer/exit actions in context | Better decisions at the moment of need |
| “What can I do as this organisation?” | Separate Establishment and Principal Employer workspaces | Less risk of showing the wrong tools or mental model |

## The important boundary

This is a **frontend product prototype**, not a claim that the statutory process is complete. It does not connect to EPFO, Aadhaar, UMANG, an Account Aggregator, a bank, an employer, or a payment gateway. It stores prototype trackers only in the browser. A production implementation would require authenticated APIs, authorisation and scope enforcement, secure document handling, audit trails, real OTP/e-sign and payment contracts, data retention rules, accessibility testing, and EPFO legal/process approval.

That boundary makes the argument stronger: the prototype proves a clearer service experience without misrepresenting real government processing.

## How to judge the redesign

The next evaluation should measure outcomes, not polish:

- Time to start and complete a KYC, nomination, correction, exit or transfer journey.
- Incorrect or abandoned submissions before and after request preview.
- Repeat submissions and “where is my request?” help contacts.
- Employer ECR-to-challan completion rate.
- Principal Employer success in linking a contractor and recording a work order.
- Completion and error rates by role, device size and language.

If those improve while statutory controls remain intact, this is not merely a nicer EPFO website. It is a more dependable public-service experience.
