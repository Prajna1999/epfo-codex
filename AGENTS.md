<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.


After end of each task, keep adding tiny context information in that session to this filer AGENTS.md

Claims now use `/?view=Claims`; the sidebar label is Claims and the shared dashboard workspace is the only claims entry point.
The root portal is fixed to the member experience; the account context selector was removed, and employer/CA portals require separate routes.
Member sidebar order is Home, Claims, Passbook, Employment, Account; the homepage no longer includes Account Health.
Claim-flow step labels are centered below their circles; connector lines run only between circles.
<!-- END:nextjs-agent-rules -->
