---
name: Rate limiting behind Replit proxy
description: Correct client IP extraction for per-IP rate limits in Express on Replit
---
- Never read `x-forwarded-for` manually for rate limiting — clients can spoof it and rotate values to bypass per-IP limits.
- **Why:** architect review flagged a bypassable brute-force guard on the data-room login; raw XFF is attacker-controlled.
- **How to apply:** in Express use `app.set("trust proxy", 1)` (Replit = one trusted hop) and `req.ip`. Test with proxy-topology curl (spoofed prefix + proxy-appended real IP as last XFF entry) to confirm 429 still triggers.
