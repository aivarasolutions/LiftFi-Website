# Lift Financial Holdings LLC - Private Holding Company Website

## Overview
Lift Financial Holdings LLC is a static website positioning the company as the parent/holding company for a diversified business ecosystem founded by Kevin Jackson. The ecosystem spans technology, logistics, real estate, media, travel, hospitality, and strategic investments.

## Project Structure
- `index.html` - Main landing page: hero, investment & operating thesis, who we are, leadership (Kevin Jackson), business architecture (hierarchical holding structure with tier-type tags), portfolio/ecosystem cards with status badges and linked titles, financial architecture, treasury & capital strategy, 4-phase alternating growth roadmap, strategic focus with deal criteria + data room CTA, vision, and contact sections
- `investor-relations.html` - Premium Investor Relations page (Berkshire/Blackstone tone): hero "Build. Acquire. Scale." with gold line-work SVG bg + 2 CTAs, Who We Are, Current Portfolio (5 large cards w/ logos; New Opportunity Entertainment has no site), Business Model flow infographic (Holdings → Capital Allocation/Technology/Operations/Marketing/Shared Services → Portfolio Companies → Cash Flow → Reinvestment), 5 Strategic Advantages, Growth Roadmap (Completed/Current/Future), Investment Philosophy, Investor Information (compliance-safe "evaluated individually with qualified investors" language), Investor Data Room (11 items + "Request Investor Access" → index contact form w/ Strategic Partner preselect via ?inquiry= param), expanded footer disclaimer. Linked in main nav + footer of index.html.
- `investor-presentation.html` - Premium investor presentation (cover + 11 slides + Thank You): full-viewport slide sections, animated gold line art cover, portfolio cards w/ logos, corporate structure diagram, business model flow, advantages/growth/why lists, roadmap track, final slide w/ contacts + data room link + verbatim legal disclaimer. Print CSS renders one 16:9 landscape page per slide.
- `presentation.css` - Dedicated stylesheet for investor-presentation.html and data-room.html (pres-* slide system, print @page 13.333x7.5in rules, dr-* data room styles)
- `Lift_Fi_Investor_Presentation.pdf` - Print-ready 13-page PDF generated from investor-presentation.html via headless chromium (`chromium --headless --print-to-pdf --no-pdf-header-footer http://localhost:5000/investor-presentation.html`). **Regenerate this file whenever the presentation page changes.** Linked via prominent "Download Investor Presentation (PDF)" buttons on investor-relations.html (hero + banner) and the presentation topbar.
- `data-room.html` - Password-protected Investor Data Room (noindex). Lock screen posts access code to /api/dataroom/login; content (4 document sections + confidentiality note) fetched from /api/dataroom/content with Bearer token (sessionStorage, 12h TTL). Server-gated: content never ships in static HTML. Access code lives in DATAROOM_ACCESS_CODE secret; login is rate-limited (5/10min per IP) with timing-safe compare. If secret unset, login returns 503 "not yet available". Linked from presentation final slide + IR data room section ("Enter Data Room").
- `capital-structuring.html` - Capital structuring and land development educational page (restyled to match brand)
- `brand/liftfi/` - **Official Lift Fi brand package (source of truth)**: all logo PNGs (stacked/horizontal/icon in black/white/transparent/one-color), vector SVG master, mockups (favicon, business card, letterhead, deck cover), and Lift_Fi_Official_Brand_Package.md/.pdf brand guide. `*_web.png` files are alpha-trimmed versions for website display.
- `brand/portfolio/` - Portfolio company logos (Aivara Solutions, FreightSync TMS, RichAF Global, IPM). Aivara and IPM logos are user-supplied official artwork (background removed, trimmed, resized); FreightSync and RichAF sourced from each company's live site. All shown as transparent standalone logos on dark cards (no white background chip) via trimmed/resized `*_web.png` versions used on index.html and investor-relations.html
- `og-image.jpg` - 1200x630 social image (deck-cover style: stacked logo + gold divider + "Structure. Discipline. Long-Term Ownership.")
- Favicons generated from official crest: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `site.webmanifest`
- **command-center.html was DELETED in V2 (2026-07-03)** per user instruction — internal checklists must never be publicly reachable. Do not recreate it.
- `styles.css` - Luxury matte black/charcoal/gold stylesheet (Playfair Display + Inter typography) using official --liftfi-* color tokens; official logo image styles (.nav-logo-img / .hero-logo / .footer-logo-img)
- `script.js` - Mobile nav, smooth scrolling, backend-ready contact form (data-endpoint config + mailto fallback), robust scroll fade-in animations (visible-by-default, js-enabled gating, prefers-reduced-motion support)

## Technology Stack
- Pure HTML5, CSS3, and JavaScript frontend (no frameworks)
- Node.js Express backend (`server.js`) — serves static files + `/api/contact` email endpoint on port 5000
- Resend email via Replit connector (`@replit/connectors-sdk`) — credentials handled server-side only, never exposed to frontend
- Font Awesome icons
- Google Fonts (Playfair Display for headings, Inter for body)

## Brand & Design
- **Official Lift Fi brand identity (Crest + Holding Architecture)**: metallic gold shield, gold canopy beam, three white pillars, serif "Lift Fi" wordmark, champagne "LIFT FINANCIAL HOLDINGS LLC" subtitle
- Official colors: Matte Black #0A0A0A, Deep Charcoal #2B2B2B, White #FFFFFF, Metallic Gold #C9A24B, Soft Champagne Gold #D6B87A (CSS tokens: --liftfi-black/charcoal/white/gold/champagne)
- Logo usage: horizontal lockup in navbar/footer, stacked logo in hero, icon-only crest for favicons/app icons. Never stretch, add effects, or recreate the logo — use files from brand/liftfi/
- Investor-ready, professional, strategic tone
- Serif display headings (Playfair Display), clean sans body (Inter)
- Mobile responsive with hamburger navigation
- Visual ownership chart, portfolio cards, roadmap timeline

## Portfolio Companies Featured
- Aivara Solutions LLC — technology, software, automation, AI systems
- FreightSync TMS LLC — logistics technology (ownership interest)
- New Opportunity Entertainment LLC — media, entertainment, content
- RichAF Global — travel brand, lifestyle media
- International Property Management — short-term rental & property services
- Future Ventures — real estate, investments, acquisitions

## Compliance Notes
**CRITICAL**: All language must remain professional and avoid guarantees. Use "designed to," "structured to," "focused on," "intended to."

**What the website must NOT claim:**
- ❌ NO offers of securities or solicitation of investment
- ❌ NO guarantees of returns or outcomes
- ❌ NO lending, financing, or credit-related services (prior Wells Fargo compliance requirement — company is NOT a lender, bank, broker, credit repair organization, or credit services provider)
- ❌ NO financial, legal, or tax advice

Footer disclaimer on every page states the above explicitly.

## Contact Form / Email Workflow (Resend)
- `#contactForm` POSTs JSON to `/api/contact` (data-endpoint attribute). If endpoint is ever emptied, form falls back to mailto admin@liftfi.io.
- `server.js` sends TWO emails per submission via the Resend Replit connector:
  1. **Internal notification** → admin@liftfi.io + kevin@aivarasolutions.com, From "Lift Fi <admin@liftfi.io>", Reply-To = lead's email, subject "New Lift Fi Inquiry — [Name]", all form fields + source + Central Time timestamp
  2. **Customer confirmation** → submitter, From "Lift Fi <admin@liftfi.io>", Reply-To admin@liftfi.io, subject "We Received Your Lift Fi Inquiry", branded HTML (matte black header + logo, gold divider, white card, charcoal text, black footer) + plain-text fallback
- Config env vars (all have correct defaults in server.js): LIFTFI_FROM_EMAIL, LIFTFI_PUBLIC_EMAIL, LIFTFI_ADMIN_EMAILS, LIFTFI_REPLY_TO_EMAIL
- Spam protection: hidden honeypot field (`website`, silently accepted+dropped), per-IP rate limiting (5 per 10 min), server-side validation/sanitization (HTML-escape, newline stripping for header injection)
- Confirmation email failure does NOT fail the request (lead already captured); internal notification failure returns 502
- Kevin's email (kevin@aivarasolutions.com) is INTERNAL ONLY — never show publicly. All public references use admin@liftfi.io
- Domain liftfi.io must remain verified in Resend for sending from admin@liftfi.io

## Recent Changes
- 2026-07-08: **Investor Presentation + PDF + Data Room** — New investor-presentation.html (cover + 11 slides + Thank You, Berkshire/Blackstone-grade, brand black/gold/white, compliance-safe language, verbatim legal disclaimer on final slide) with presentation.css (screen slides + print 16:9 pages). Print-ready 13-page Lift_Fi_Investor_Presentation.pdf generated via headless chromium (installed as system dep). IR page: new Investor Presentation banner section + hero CTAs now "Download Investor Presentation (PDF)" / "View Presentation"; data room section gained "Enter Data Room" button. New password-protected data-room.html backed by /api/dataroom/login + /api/dataroom/content in server.js (DATAROOM_ACCESS_CODE secret, in-memory Bearer tokens 12h, strict rate limit, timing-safe compare).
- 2026-07-08: **Portfolio logo corrections** — Replaced Aivara Solutions and IPM logos with user-supplied official artwork (background-removed via AI tool, trimmed, resized to match existing convention). Removed the `.has-bg` white chip treatment from both cards on index.html and investor-relations.html so all four real portfolio logos (Aivara, FreightSync, RichAF, IPM) now display consistently as standalone transparent logos directly on the dark card background.
- 2026-07-08: **Investor Relations page launched** — New `investor-relations.html` (premium Berkshire/Blackstone tone) with all spec sections; added to index.html main nav + footer Explore list. Font Awesome 6.5.2 CDN added to both pages (was never loaded before despite fa- icon usage). New `ir-*` namespaced CSS appended to styles.css (hero line-work, flow diagram, adv/roadmap/info/dataroom grids, responsive 1080/992/768/560 breakpoints). script.js `initDataRoomCta` extended to preselect inquiry type from `?inquiry=` query param for cross-page CTAs. Compliance language uses "designed to / intended to"; no returns promises; expanded footer disclaimer.
- 2026-07-08: **Portfolio cards updated with live company sites** — Aivara Solutions LLC, FreightSync TMS LLC, RichAF Global, and International Property Management now show their real logos (hotlinked-then-saved to `brand/portfolio/`, trimmed/optimized `_web.png` versions), a clickable logo, a clickable "www.company.com" URL line, and a gold/black "Visit [Company]" CTA button (opens in new tab, `rel="noopener"`). Removed "Site coming soon" labels for these four (still shown for New Opportunity Entertainment LLC and the Future Ventures placeholder, which remain unchanged). New CSS: `.card-logo` (+ `.has-bg` white chip variant for logos with opaque white backgrounds), `.card-url`, `.card-cta`.
- 2026-07-03: **Resend email workflow** — Added Node.js Express server (server.js) replacing python http.server: serves static site + POST /api/contact. Sends internal admin notification (admin@liftfi.io + kevin@aivarasolutions.com, reply-to lead) and branded customer confirmation (from Lift Fi <admin@liftfi.io>, reply-to admin@liftfi.io) via Resend Replit connector. Honeypot + rate limiting + server-side validation. Form messages updated to spec copy; all public emails normalized to admin@liftfi.io. Workflow + deployment run command now "node server.js". End-to-end send tested successfully.
- 2026-07-03: **Official brand rollout** — Saved full Lift Fi brand package to brand/liftfi/ (logos, SVG master, mockups, brand guide MD+PDF). Applied official identity site-wide: horizontal lockup in navbar+footer, stacked logo in hero, full favicon set from crest icon (ico/16/32/apple-touch/android 192+512 + site.webmanifest), new deck-cover-style og-image.jpg with tagline. Updated CSS tokens to official colors (#0A0A0A/#2B2B2B/#C9A24B/#D6B87A) with --liftfi-* variables; replaced all old gold hexes; removed text-based LF brand-mark and old logo.png/inline SVG favicon. New SEO title "Lift Fi | Lift Financial Holdings LLC" + OG/Twitter copy per brand spec. capital-structuring.html updated to new palette + favicons.
- 2026-07-03: **V2 polish** — Deleted command-center.html entirely (with all cc-* CSS); added SEO/OG/Twitter meta + generated og-image.jpg (1200x630) and logo.png apple-touch-icon (Pillow-generated, matte black + gold LF); raised --text-muted to #A0A0A8 for WCAG contrast; new Investment & Operating Thesis section (4 cards); Strategic Focus rebuilt with 6 deal criteria + evaluation paragraph + compliance note + "Request Data Room Access" CTA (pre-selects Strategic Partner); portfolio titles linked (richaf.global, ipm.services; others "Site coming soon" placeholders) with LF watermark; org chart tier-type tags (Active LLCs / Brand Assets-DBAs / Operating Vertical / Target Structure); alternating desktop roadmap timeline; founder photo placeholder + focus tags + copy update (property operations). Contact form is Formspree-ready via data-endpoint (awaiting real form ID; honest mailto fallback until then).
- 2026-07-03: **Investor-ready redesign (v2)** — Champagne/metallic gold palette, text-based LF brand mark, leadership section, hierarchical org chart with gold connecting lines, portfolio badges (Active LLC / Brand-DBA / In Development / Ownership Interest), rewritten 4-phase roadmap (no internal to-do language), strategic focus section, backend-ready contact form with validation and mailto fallback, robust visible-by-default scroll animations with prefers-reduced-motion support, Command Center removed from all public navigation/footer.
- 2026-07-03: **Complete repositioning as parent holding company** — Rebuilt entire site with luxury black/white/gold design. Added hero, about (Kevin Jackson founder), ownership structure chart, portfolio company cards, financial architecture, treasury/reserve strategy, growth roadmap, investor readiness, vision, contact sections, and Command Center internal page. Restyled capital-structuring.html to match.
- 2025-10-28: Compliance update removing all credit-related services (Wells Fargo requirement)
- 2025-10-28: Initial import from GitHub and Replit environment setup

## Deployment
- Static website served via Python HTTP server on port 5000
- No build process required

## Contact Information
- Email: Admin@LiftFi.io
- Phone: 1-281-310-1114
- Location: Houston, Texas
