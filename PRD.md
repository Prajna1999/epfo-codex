# PRD — EPFO Unified Digital Platform

## 1. Objective

Build a **role-appropriate EPFO digital platform** with separate sign-in routes for members, employers, and CA users.

Each route should make its audience clear:

* Member Sign In
* Employer Sign In
* Establishment Sign In
* Principal Employer Sign In

The member portal is a single personal account experience; it does not contain an account-context switcher. Employer and CA portals are separate experiences when implemented.

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

# 3. Role-Specific Entry

### User experience

The user begins from the route matching the work they need to do:

* **Member sign in** → personal UAN dashboard.
* **Employer sign in** → establishment operations.
* **CA sign in** → delegated employer operations.

Each route uses its appropriate authentication and authorization model. A member who also has employer responsibilities signs in through the employer or CA route; the member portal does not expose account switching.

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

# 4. Separate Role Experiences

The platform may resolve a person's member and employer relationships internally, but it presents them through separate sign-in routes and route-specific shells. This keeps the high-frequency member experience focused on a single UAN while employer and CA users get the authorization, establishment, and extension scope they need.

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

Most used
[File a claim] [Track claims] [Passbook]

Services
[KYC & bank details] [Nomination] [Transfer previous PF] [Profile details]
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

> **Claim PF**

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

# 10. Role-Specific UX

The member portal remains a single-account experience:

```text
Rahul Patil
UAN XXXX1234

Home · Claims · Passbook · Service history · Services · Account
```

Employer and CA routes show the selected establishment, role, and extension scope within their own shells. They do not appear as options in member navigation.

---

# 11. Sensitive Operations

High-risk operations within each role-specific route can require:

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

### Clear role entry

Make it clear whether the person is entering the Member, Employer, or CA route. The member route should never ask a typical UAN holder to choose an account context.

Employer and CA routes must still make establishment and extension scope obvious.

### Progressive complexity

Members see a simple member experience.

CAs see employer operations.

Authorized Signatories see governance/approval capabilities.

Establishments that engage contractors see contractor compliance.

### No unnecessary terminology

Use human-readable labels and expose EPFO form numbers/codes only where useful.

### No unnecessary choices

Keep role selection at entry, not inside the member portal.

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
* Service history
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
