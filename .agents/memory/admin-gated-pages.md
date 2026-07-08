---
name: Access-code-gated page pattern
description: Auth pattern for gated pages (data room, admin) and a UI-gate pitfall
---
- Gated pages (data-room, admin) follow one pattern: POST login with access code from a secret (timing-safe compare, per-IP rate limit via req.ip with trust proxy) → random Bearer token in an in-memory Map with 12h TTL → protected endpoints check the token.
- **Why:** A gated page's initial/resume load must fetch through an AUTH-REQUIRED endpoint, not a public one. An early admin panel revealed the editor UI to anyone who planted a junk token in sessionStorage because resume only checked token presence and loaded public data (caught in review).
- **How to apply:** Every gated UI needs a server-validated read endpoint for its boot/resume path; keep the gate visible until that call succeeds.
- Admin code (ADMIN_ACCESS_CODE) and data room code (DATAROOM_ACCESS_CODE) are separate secrets on purpose — never reuse one for the other.
