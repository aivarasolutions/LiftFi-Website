# Lift Financial Holdings LLC - Private Holding Company Website

## Overview
Lift Financial Holdings LLC is a static website positioning the company as the parent/holding company and financial command center for a diversified business ecosystem founded by Kevin Jackson. The ecosystem spans technology, logistics, real estate, media, travel, hospitality, and strategic investments.

## Project Structure
- `index.html` - Main landing page: hero, who we are, leadership (Kevin Jackson), business architecture (hierarchical holding structure), portfolio/ecosystem cards with status badges, financial architecture, treasury & capital strategy, 4-phase growth roadmap, strategic focus, vision, and contact sections
- `command-center.html` - INTERNAL ONLY page (noindex/nofollow, deliberately unlinked from all public navigation/footer) summarizing current vs. target structure, active companies, DBAs, next steps, documents needed, advisor review items, and funding readiness checklist
- `capital-structuring.html` - Capital structuring and land development educational page (restyled to match brand)
- `styles.css` - Luxury matte black/charcoal/champagne-gold stylesheet (Playfair Display + Inter typography); text-based "LF" brand mark (no image logo)
- `script.js` - Mobile nav, smooth scrolling, backend-ready contact form (data-endpoint config + mailto fallback), robust scroll fade-in animations (visible-by-default, js-enabled gating, prefers-reduced-motion support)

## Technology Stack
- Pure HTML5, CSS3, and JavaScript (no frameworks)
- Font Awesome icons
- Google Fonts (Playfair Display for headings, Inter for body)
- Static file hosting via Python HTTP server on port 5000

## Brand & Design
- Luxury matte black (#0B0B0D), deep charcoal (#111116/#1A1A1F), white, champagne gold (#C8A96A), metallic gold (#E6C678) palette; soft gray text (#B8B8B8)
- Text-based "LF" brand mark — NO blue/green chart logo (logo.png retired from all pages)
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

## Contact Form
- Backend-ready: `#contactForm` has a `data-endpoint` attribute (empty by default). Set it to a real endpoint (e.g. CONTACT_FORM_ENDPOINT value) to POST JSON inquiries. With no endpoint configured, the form validates input then opens a pre-filled mailto to Admin@LiftFi.io. Success/error/pending states render in `#formStatus`.

## Recent Changes
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
