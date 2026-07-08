---
name: Section QA via anchor screenshots
description: How to screenshot below-the-fold sections of this static site for visual QA
---
The screenshot tool only captures the top viewport. To QA lower sections, screenshot `/page.html?qa=N#section-id` — the unique query param busts caching and the hash fragment scrolls to the section. All major sections on this site have `id` attributes, so no temporary anchors are needed.

**Why:** repeatedly needed when visually verifying new sections on this multi-section landing site.
**How to apply:** any time a section below the fold needs visual verification.

Exception: anchor screenshots of investor-presentation.html slides capture solid black (smooth-scroll timing artifact on the full-viewport slide layout). QA presentation slides via the regenerated PDF pages (pdftoppm) instead.
