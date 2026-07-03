---
name: Resend connector requires Node SDK
description: Why this static site runs a Node Express server instead of python http.server
---

The Replit connectors Python SDK (`replit-connectors`) is not published on PyPI — only `@replit/connectors-sdk` (npm) works.

**Why:** When adding the Resend email workflow (July 2026), `uv add replit-connectors` failed with "not found in the package registry", so the backend was built in Node (Express `server.js`) even though the site was previously served by `python3 -m http.server`.

**How to apply:** Any future server-side connector usage in this project should go through the Node server. Also: connections need BOTH `addIntegration` (code wiring) and `proposeIntegration` (platform binding) — a 401 "No connection found for replid" from the connectors proxy means the binding step is missing, not a code bug. The Express server also has a denylist middleware blocking non-public files (replit.md, server.js, attached_assets, dotfiles) — keep new sensitive files covered by it.
