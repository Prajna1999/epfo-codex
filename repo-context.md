# EPFO Codex Repository Context

## Product

EPFO Codex is a prototype for the EPFO Unified Digital Platform described in `PRD.md`.
Its central product decision is **one EPFO identity, multiple contexts**. A person signs in once, sees the EPFO relationships resolved to their identity, and chooses the context they want to act in.

## Current Route

- `/` renders the unified profile chooser.
- The chooser currently exposes three sample contexts: Member, Establishment, and Principal Employer.
- Selecting a context switches to a client-side service catalogue.
- The selected context remains visible in the workspace header and can be changed without another login.
- The profile menu repeats the same context-switching affordance.

## Product Language

- Prefer human-readable labels such as `My PF`, `My employment`, and `Withdraw / Claim PF`.
- Make `Acting as` and the active role obvious at all times.
- Distinguish Member, Establishment, Authorized Signatory, Delegated User, and Principal Employer responsibilities.
- Do not expose services the current role should not see.
- Do not invent balances, employee counts, compliance scores, or other operational metrics.

## Technical Shape

- Next.js `16.3.2` App Router with React `19.2.8`.
- `app/page.tsx` is a server component that passes static sample profiles into `app/profile-chooser.tsx`.
- `app/profile-chooser.tsx` is a client component because it owns profile and service selection state.
- Global styles live in `app/globals.css` and import `tokens.css`.
- Tailwind CSS v4 is available, but the existing interface primarily uses semantic global CSS classes.
- Typography uses `next/font/google` Geist and Geist Mono, exposed through CSS variables in `app/layout.tsx`.

## Existing Design Direction

- Light civic palette with institutional blue accent.
- Reassuring, clear, institutional tone.
- Dense administrative content is organized into calm cards and grouped service lists.
- Existing styling includes responsive breakpoints, visible focus states, reduced-motion handling, and subtle hover/active transitions.

## Redesign Guardrails

- Keep the single-route prototype functional while improving the visual system.
- Preserve profile switching and service selection behavior.
- Use small, purposeful transitions for page entry, context selection, and hover states.
- Respect `prefers-reduced-motion`.
- Verify the layout at 320px, 375px, 414px, and 768px widths as well as desktop.
- Keep edits focused on the current route unless the product flow requires a supporting change.
