---
name: Print-ready PDF from HTML pages
description: How this project turns HTML pages into 16:9 print PDFs, and the regen obligation
---
- Print-ready PDFs are generated from live pages with headless chromium (nix system dep): `chromium --headless=new --no-sandbox --virtual-time-budget=15000 --print-to-pdf=<file> --no-pdf-header-footer http://localhost:5000/<page>`.
- **Why:** the PDF is a static committed asset, not generated on the fly — it silently goes stale when its source page changes.
- **How to apply:** any edit to a page with a companion PDF (e.g. investor-presentation.html) must be followed by regenerating the PDF and verifying page count/size with pdfinfo.
- Print pitfall: in chromium print rendering, `max-width` media queries written for mobile can match the print viewport, collapsing multi-column slide grids and overflowing the fixed 540pt page. Give any responsive slide layout explicit `@media print` grid-template-columns overrides.
- Verify new/changed slides visually by rendering pages with `pdftoppm -jpeg -r 72 -f N -l M` and reading the images.
