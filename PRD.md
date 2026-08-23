# PRD — EPFO Unified Digital Platform

## 1. Objective

Build a **single, unified EPFO digital platform** where a person logs in once and the platform determines all their EPFO relationships.

The user should not need to understand whether they are entering through:

* Member Sign In
* Employer Sign In
* Establishment Sign In
* Principal Employer Sign In

Instead:

> **Login once → see your contexts → choose what you're acting as → access the relevant services.**

Note: today "Employer Sign In" and "Establishment Sign In" are two tabs on the same login box on the Unified Employer Portal, and Principal Employer functions sit *inside* an establishment's login. This platform collapses all of them into one entry point.

---

# 2. Core Identity Model

```text
Person (Aadhaar-resolved)
  │
  ▼
User Account
  │
  ├───────────────┐
  ▼               ▼
Member          Portal User
(UAN)              │
                   ├── Authorized Signatory
                   ├── Delegated User
                   │
                   ▼
             Establishment (estt code + extension)
                   │
                   ├── Employees
                   │
                   └── Principal Employer capability
                            │
                            └── Contractors → Contract Workers

Portal User
     │
     ▼
Unregistered Principal Employer (PAN-based)
     │
     └── Contractors → Contract Workers
```

The system separates:

**Identity → Context → Role → Permission → Service**

### Identity resolution key

Aadhaar is the only identifier common to the member side and the employer side, and EPFO already relies on it for e-Sign. It is therefore the join key used to resolve a Person to all their contexts. UAN and Establishment ID are context identifiers, not identity identifiers.

### Establishment identity

An establishment is identified by a composite key, not an opaque string:

```text
Region Code (2 char) + Office Code (3 char) + Establishment Code (7 digit) + Extension (3 char)

APHYD 0012345 000     ← head office
APHYD 0012345 00A     ← branch
```

Branches are extensions of the same establishment code and may file ECR independently. Every context, role grant and permission must record whether it is scoped at establishment-code level or extension level.

### Principal Employer

Principal Employer is **a capability on an establishment context**, not a sibling context — except for Government Organizations / Institutions / Departments that are not registered with EPFO, who register through PAN and mobile number and have no establishment code. Those are the only standalone Principal Employer identities.

### Registration dependency

Employer registration originates on the Shram Suvidha Portal, which issues the credentials; EPFO generates the Establishment Code after verification. The identity service federates with Shram Suvidha rather than owning the account.

---

# 3. Unified Login

### User experience

The user visits:

**EPFO → Sign In**

They authenticate using the appropriate supported authentication mechanism. Authentication must resolve to an Aadhaar-verified person, since context resolution depends on it.

The platform then resolves their relationships.

### Example: ordinary employee

```text
Prajna
  │
  ▼
Login
  │
  ▼
One context found
  │
  ▼
Member Dashboard
```

No context-selection screen is necessary.

### Example: person with multiple contexts

Suppose Rahul is:

* A PF member at Tata Motors
* CA for ABC Pvt Ltd
* Authorized Signatory for his own company

After authentication:

```text
Rahul
 │
 ▼
EPFO
 │
 ▼
Your EPFO profiles
 │
 ├── 👤 Member
 │     UAN: XXXX1234
 │
 ├── 🏢 ABC Pvt Ltd
 │     Role: CA
 │
 └── 🏢 XYZ Consulting
       Role: Authorized Signatory
```

Rahul selects the context he wants to operate in.

---

# 4. Multiple Contexts

A user can have **multiple simultaneous EPFO relationships**.

The system should never force the user to maintain separate accounts for each relationship.

### Context examples

| User              | Context           | Role                 |
| ----------------- | ----------------- | -------------------- |
| Employee          | UAN 1234          | Member               |
| HR manager        | ABC Ltd           | Delegated User       |
| Director          | XYZ Ltd           | Authorized Signatory |
| CA                | ABC Ltd           | Delegated User       |
| Corporate officer | Large Corp        | Authorized Signatory / Delegated User, with Principal Employer capability |
| Government dept   | PAN-registered PE | Principal Employer   |
| Employee + CA     | Multiple contexts | Multiple roles       |

### Context switcher

The selected context should remain visible throughout the application:

> **Acting as: ABC Pvt Ltd · CA**

The user should be able to switch context without logging out.

Sensitive actions should require confirmation when switching context.

---

# 5. Member Experience

### Who?

An employee with a UAN.

### Example

**Priya works at Infosys.**

She logs into EPFO and sees:

```text
Priya
UAN: XXXX1234

━━━━━━━━━━━━━━━━━━━━
My PF
₹4,52,340
━━━━━━━━━━━━━━━━━━━━

Employment
• Infosys
• Previous employer
• Previous employer

Quick Actions
[Passbook] [Claim] [KYC] [Nomination]
```

### Member services

* Profile
* UAN
* Employment history
* Passbook
* Contributions
* PF balance
* KYC
* Nomination
* Claims
* Claim tracking
* Transfer
* Pension information
* Profile updation requests
* Notifications
* Documents

### UX principle

The member should **not need to understand EPFO's internal terminology**.

Instead of:

> "View Member ID"

prefer:

> **My Employment**

Instead of:

> "Form 19 / Form 10C"

prefer:

> **Withdraw / Claim PF**

The underlying forms remain visible when legally/operationally necessary.

---

# 6. Establishment Experience

### Who?

An EPFO-covered establishment and its authorized users.

### Example

**ABC Pvt Ltd**

```text
ABC Pvt Ltd
Establishment: ORBBS0012345000

Dashboard

Employees       4,823
ECR Status      Submitted
Payment         ₹2.4 Cr
Compliance      ✓
```

Where the establishment has extensions, the dashboard defaults to the extension the user is scoped to, with an all-extensions view for users scoped at establishment-code level.

### Establishment services

#### Organization

* Establishment profile
* Registration/coverage
* Contact information
* Branches (extension codes)
* DSC/e-Sign
* Authorized signatories

#### Employees

* Employee management
* Joining/leaving
* UAN/member information
* KYC-related operations

#### Contributions

* ECR (UAN-based)
* ECR validation
* Contribution calculation
* Challans (TRRN)
* Payments
* Payment reconciliation

#### Compliance

* Compliance status
* Notices
* Correspondence
* Reports
* Employer-side claim actions

#### Contractors (Principal Employer capability)

* Contractor management
* Contract/work-order information
* Contract-worker mapping
* Contractor compliance visibility

#### Administration

* Authorized signatories
* Delegated users
* Roles
* Permissions

---

# 7. Authorized Signatory

The Authorized Signatory is responsible for representing the establishment.

### Example

```text
ABC Pvt Ltd

Priya Sharma
Authorized Signatory
```

She can:

* Sign/approve submissions
* Perform signature-sensitive operations
* Manage establishment-level information
* Manage delegated users
* Assign predefined roles
* View all establishment operations

### Signing credentials

DSC and Aadhaar e-Sign bind to the **person**, not to the establishment. The Authorized Signatory role is an attribute of the (user, establishment) relationship. A signatory who leaves one establishment retains their signing credential and loses only the role grant.

### UX

The dashboard should clearly indicate:

> **You are acting as: ABC Pvt Ltd · Authorized Signatory**

When an operation requires legal authority:

> **This action requires Authorized Signatory approval.**

---

# 8. Delegated User

Delegated users act **on behalf of an establishment**.

They don't own the establishment.

### Example

ABC Pvt Ltd gives its CA:

```text
Rahul
Role: CA

Scope: ABC Pvt Ltd — all extensions

Permissions:
✓ View employees
✓ Submit ECR
✓ View challans
✓ View payments
✗ Manage users
✗ Change establishment profile
✗ Change authorized signatory
```

Every grant carries a scope as well as a permission. A site manager may hold the same permissions scoped to a single extension.

The Authorized Signatory assigns these permissions.

EPFO provides the predefined permission catalogue.

### UX

Rahul logs in:

```text
Good afternoon, Rahul

Acting as:
ABC Pvt Ltd
CA

[Employees]
[ECR]
[Payments]
[Reports]
```

He shouldn't see functionality he isn't authorized to use.

**Don't merely disable everything. Hide irrelevant capabilities where appropriate, while clearly explaining restricted actions when discovered through workflows.**

---

# 9. Principal Employer

A Principal Employer is an organization that engages contractors and needs visibility into their EPF compliance.

There are two categories:

1. **Establishments already registered with EPFO** — identified by establishment code and mobile number. For these, Principal Employer is a capability inside the establishment context, not a separate context.
2. **Government Organizations / Institutions / Departments not registered with EPFO** — identified by PAN and mobile number. These have no establishment code and appear as a standalone context.

### Example

```text
Tata Motors
       │
       ├── ABC Security
       ├── XYZ Housekeeping
       └── PQR Staffing
```

Contractors are added by establishment ID and verified by lookup before the mapping is saved. Tata Motors can see relevant contractor/contract-worker compliance, including wages on which EPF dues were remitted by the contractor against the contract.

### Services

* Principal Employer registration (establishment-code or PAN route)
* Organization profile
* Contractor management
* Contract/work-order information
* Contract-worker mapping
* UAN verification
* Contractor ECR visibility
* Contribution/remittance visibility
* Contractor compliance
* Compliance dashboard
* Reports
* Notifications

### UX

For a covered establishment, this appears as a section within the establishment context:

```text
Tata Motors
Authorized Signatory

Compliance Overview — Contractors

Contractors             42
Compliant                38
Attention Required        4

[Contractors]
[Contracts]
[Workers]
[Compliance]
[Reports]
```

For a PAN-registered government body, it appears as its own context.

---

# 10. Multiple-Context UX

This is one of the most important product features.

### Example

Rahul has:

```text
👤 Member
UAN XXXX1234

🏢 ABC Pvt Ltd
CA

🏢 XYZ Ltd
Authorized Signatory

🏢 Tata Motors
Authorized Signatory · includes contractor compliance
```

After login:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Good morning, Rahul

What would you like to access?

👤 My PF
   Member · UAN XXXX1234

🏢 ABC Pvt Ltd
   CA

🏢 XYZ Ltd
   Authorized Signatory

🏢 Tata Motors
   Authorized Signatory
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

After selecting **ABC Pvt Ltd**:

```text
ABC Pvt Ltd
CA

Dashboard
Employees
ECR
Payments
Reports
```

The context remains visible.

---

# 11. Context Switching

A persistent context switcher should be available:

```text
┌──────────────────────────────┐
│ Acting as: ABC Pvt Ltd · CA ▼│
└──────────────────────────────┘
```

Clicking it:

```text
Switch context

👤 My PF
🏢 ABC Pvt Ltd · CA
🏢 XYZ Ltd · Authorized Signatory
🏢 Tata Motors · Authorized Signatory
🏛 Ministry Dept · Principal Employer (PAN)
```

Switching context should **not require another login**.

For high-risk operations, the system can require:

* MFA
* Re-authentication
* DSC/e-Sign

---

# 12. Authorization Model

Every API request should effectively answer:

```text
WHO?
  ↓
User

ACTING AS?
  ↓
Context

IN WHAT ROLE?
  ↓
Role

WHAT CAN THEY DO?
  ↓
Permission

ON WHICH RESOURCE?
  ↓
Resource / Establishment + Extension / UAN

AT WHAT SCOPE?
  ↓
Establishment-code level or extension level
```

Example:

```text
Rahul
 ↓
ABC Pvt Ltd (ORBBS0012345, all extensions)
 ↓
CA
 ↓
ECR.submit
 ↓
ABC's ECR for August
```

A grant scoped to extension `00A` must not satisfy a request against extension `000`.

This should be enforced **server-side**, not merely by hiding UI elements.

---

# 13. API Architecture

```text
                         Web / Mobile
                              │
                             WAF
                              │
                        API Gateway
                              │
                        FastAPI APIs
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       Identity            Member             Employer
        APIs                APIs                APIs
          │                   │                   │
   Aadhaar / Shram            │          Principal Employer APIs
   Suvidha federation         │                   │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                  Redis              Read DB
                    │                   │
                    └─────────┬─────────┘
                              ▼
                       Transaction DB
```

FastAPI should primarily handle:

* Authentication orchestration
* Authorization
* API requests
* Read APIs
* Transaction initiation
* Service orchestration

Large asynchronous workloads should be moved to workers.

---

# 14. ECR / High-Volume Operations

For example:

```text
Employer uploads
100,000 employee ECR
        │
        ▼
     FastAPI
        │
        ▼
 Accept + validate
        │
        ▼
     Job created
        │
        ▼
      Queue
        │
        ▼
     Workers
        │
   ┌────┼────┐
   ▼    ▼    ▼
Validate Calculate Ledger
        │
        ▼
   Reconciliation
        │
        ▼
   TRRN issued
```

The employer receives:

> **ECR #12345 — Processing**

rather than keeping an HTTP request open for minutes.

Job identifiers must reconcile with the TRRN issued for challan payment rather than introducing a parallel ID space.

---

# 15. UX Principles

### One account

Users should not maintain separate Member/Employer/Principal Employer credentials where the same person can have multiple relationships.

### Context first

Always make it obvious:

> **Who am I acting as?**

And, where extensions exist:

> **Which branch am I acting on?**

### Progressive complexity

Members see a simple member experience.

CAs see employer operations.

Authorized Signatories see governance/approval capabilities.

Establishments that engage contractors see contractor compliance.

### No unnecessary terminology

Use human-readable labels and expose EPFO form numbers/codes only where useful.

### No unnecessary logins

Context switching should normally be instant.

### Strong confirmation for irreversible actions

For:

* ECR submission
* payment
* claim approval
* establishment changes
* delegation changes

show a clear confirmation and audit information.

---

# 16. MVP

### Phase 1 — Identity

* Unified login
* Aadhaar-based person resolution
* Shram Suvidha federation
* User identity
* UAN relationship
* Establishment relationship (code + extension)
* Principal Employer relationship
* Context resolver
* Role/permission service, with scope
* Person-bound DSC/e-Sign
* Context switching

### Phase 2 — Member

* Profile
* Employment
* Passbook
* Contributions
* KYC
* Nomination
* Claims

### Phase 3 — Establishment

* Dashboard
* Employees
* ECR
* Payments
* Compliance
* Authorized Signatory
* Delegated users

### Phase 4 — Principal Employer

* Contractors
* Contracts
* Contract workers
* Compliance
* ECR/remittance visibility

---

## Core product decision

**One EPFO identity. Multiple contexts. Context-specific, scope-bound permissions.**

```text
                 ONE LOGIN
                    │
                    ▼
                  PERSON
                    │
              ┌─────┴─────┐
              ▼           ▼
           MEMBER      PORTAL USER
              │           │
             UAN      ┌────┼─────────┐
                      ▼    ▼         ▼
                    Auth  Delegate   PE
                    Sign.   User   (PAN)
                      │      │        │
                      ▼      ▼        ▼
                 ESTABLISHMENT       PE
                  (+ extension)       │
                      │               │
              ┌───────┴───────┐       │
              ▼               ▼       ▼
          SERVICES      CONTRACTORS SERVICES
```

That becomes the **foundation of the entire new EPFO platform**.