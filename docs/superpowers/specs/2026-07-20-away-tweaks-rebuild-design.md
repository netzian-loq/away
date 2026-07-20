# Away Tweaks — Rebuild Design

Status: Approved by user 2026-07-20. Supersedes nothing (greenfield repo).

## 1. Summary

Rebuild the Away Tweaks marketing site (currently a single 2,900-line TanStack
Start route, `hex-core-forge-main`) as a modern multi-page **Next.js** site in
this repo (`away`). Same business (private PC optimization for competitive
gamers), same pricing/services/contact info, new architecture, new design
polish, better performance and SEO.

## 2. Constraints (non-negotiable)

- All 6 services, all 5 pricing bundles, and all individual service prices
  are preserved exactly as they are in the current site. No copy changes to
  price or scope without asking first.
- All contact information preserved: `Mattiaarminante77@gmail.com`, Discord
  server invite (`discord.gg/saKde8DD9`), Discord vouch-channel invite
  (`discord.gg/29Swpe8rM`).
- Business info (positioning, results claims, methodology) preserved in
  substance; copy may be rewritten for clarity/tone but not changed in
  meaning without asking.

## 3. Tech stack

- **Next.js** (latest stable, App Router), TypeScript, React
- **Tailwind CSS v4**
- **Framer Motion** for standard reveals/hover/stagger animation
- **GSAP + ScrollTrigger** — dynamically imported, scoped only to the AwayOS
  video showcase section's pinned scroll effect
- **Resend** (or equivalent transactional email API) for the contact form,
  invoked from a Next.js Server Action
- **shadcn/ui** (Radix-based) for form primitives, dialog, etc. — same
  library family the current site already uses
- Package manager: npm (default `create-next-app` tooling), unless told
  otherwise
- Deployment target: Vercel

## 4. Content architecture

All durable business content lives in typed data modules, not inline in
components — this directly fixes the current site's biggest maintainability
problem (everything hardcoded in one giant file).

```
src/content/
  services.ts   // the 6 services: title, price, short body, long body, features[], images?
  pricing.ts    // the 5 bundle tiers: name, price, description, features[], featured?
  site.ts       // business info: name, email, discord links, nav links, footer links, stats
  about.ts       // About-page copy (mission, method, credentials) — drafted by Claude
```

Every page (`/`, `/services`, `/about`, `/contact`) imports from these
modules rather than redefining content, so a price or feature-bullet change
is a one-line edit applied everywhere it's shown.

## 5. Information architecture

**Home (`/`)**
1. Hero — headline, subhead, primary CTAs, stat counters (rigs tuned,
   retention, support, rating). Visually impressive, no scroll-jacking
   timeline (see §7).
2. Trust marquee strip (FPS BOOST / LOW LATENCY / etc.)
3. Manifesto one-liner ("the Away method")
4. AwayOS video showcase — kept, same YouTube embed behavior (autoplay
   muted looping 25s clip, click-through blocked), same pinned-scroll reveal
   treatment rebuilt lighter (see §7)
5. Services teaser — 6 condensed cards (icon, title, price, one-line body),
   "See all services" → `/services`
6. Why Away Tweaks — condensed reasons grid
7. **Full pricing bundle grid** (all 5 tiers, unabridged)
8. Vouches / Discord CTA
9. Final CTA → `/contact`

**Services (`/services`)**
1. Page intro
2. All 6 services in full detail, directly in the page (not hidding behind a
   modal — better for SEO/scannability): long description, full feature
   list, the 2 product screenshots on the Windows Tuning entry
3. Pricing bundles repeated in full (visitors landing here from search won't
   have seen Home's version)
4. CTA → `/contact`

**About (`/about`)**
1. Mission / story — drafted from existing "Why Away Tweaks" material and
   business info already on the site
2. Method/process — the current "why us" reasons expanded into fuller
   narrative sections
3. Trust stats (same counters as Hero)
4. CTA → `/contact`

**Contact (`/contact`)**
1. Contact form: name, Discord username, PC specs, message → Server Action
   → email via Resend → on-page success state (replaces today's `mailto:`
   approach)
2. Direct contact info (email, Discord links)
3. Response-time expectation copy ("within 24 hours", matches current site)

**Shared across all pages:** sticky Discord banner, nav (now real links:
Home / Services / About / Contact + "Get Optimized" CTA), footer (quick
links, services list, contact, copyright).

## 6. Design system

**Direction:** refined neon-dark — same purple/electric aesthetic the brand
is already known for (confirmed by the new logo mark provided: violet/purple
glow on near-black), tightened up: less competing glow, cleaner hierarchy,
more confident whitespace. Not a shift to generic light corporate design.

- Color: near-black background, single violet/purple accent (matches the new
  "A" logomark), keep the `oklch`-based token approach from the current site
  as a starting palette, adjusted to the new logo's exact hue
- Typography: keep the current font pairing direction (display/sans/mono
  three-way split) unless the new logo implies a different display face
- Components: glassmorphism cards, glow borders/shadows, kept but toned down
  vs. current (current site layers glow on nearly every element — the
  rebuild uses it more selectively, as an accent rather than a default)

## 7. Animation strategy

- **Framer Motion** for section reveals (fade/slide on scroll into view),
  hover states, stagger lists, page-level transitions. Idiomatic React,
  no manual `useEffect` cleanup plumbing like the current GSAP-everywhere
  approach.
- **GSAP ScrollTrigger** — used in exactly one place: the AwayOS video
  showcase's pinned scale/reveal effect. Dynamically imported so its cost
  never loads on pages that don't have that section.
  - Rebuilt as a **single scrub tween** (pin + scale + fade), not the current
    site's multi-stage timeline. The old hero's 7,000px multi-stage pinned
    GSAP timeline (mouse-tilt tracking + scroll-jacked card morph +
    counter/progress-ring choreography, all running together) is the
    prime suspect for the lag the user flagged, so it is **not** carried
    over. The new hero is visually rich (gradient/particle background,
    staggered text reveal, animated stat counters) but scrolls normally —
    no pinning, no scroll-hijacking.
- Reduced-motion and low-end-device fallback preserved: a "lite mode" gate
  (prefers-reduced-motion, software-rendering detection, or a live frame-rate
  sample) disables blur/backdrop-filter and heavy animation, same intent as
  today's `perf-lite` class.

## 8. Contact form & email pipeline

- Client: React form (shadcn `Input`/`Textarea`), client-side validation
  with `zod`
- Submit: Next.js Server Action → sends via Resend (or equivalent) to
  `Mattiaarminante77@gmail.com`
- Basic spam mitigation: honeypot field + minimum-fill-time check (no
  CAPTCHA — keep friction low for conversion)
- On success: inline confirmation state, no page navigation; on failure:
  inline error with a `mailto:` fallback link so a visitor is never fully
  stuck

## 9. SEO plan

- Per-route metadata via Next.js Metadata API (title, description, OG,
  Twitter card, canonical) for all 4 pages
- `ProfessionalService` + `OfferCatalog` JSON-LD (carried over from current
  site, updated for multi-page structure)
- `sitemap.xml`, `robots.txt`, `llms.txt` regenerated for the new routes
- Real routes for Services/About/Contact (vs. today's single-page anchors)
  is itself an SEO improvement — indexable, linkable, distinct titles

## 10. Performance targets

- Faster than current site on Core Web Vitals (current site's biggest
  cost is the always-on GSAP timeline + mouse-tracking on the hero: this
  goes away per §7)
- `next/image` for all images (automatic optimization/responsive sizing)
- GSAP loaded only on the route/section that needs it
- Mobile-first responsive pass on every section (current site is
  reasonably responsive already, so this is a refinement, not a rebuild,
  of that behavior)

## 11. Open items — assets needed from user before launch

The current repo does not contain the actual image binaries (they're
Lovable CDN pointer files). Needed before final polish/launch:

1. The new logo file shown in chat (violet "A" mark + "Tweaks" wordmark) —
   please save it into `away/public/` (or tell Claude to fetch it from
   somewhere reachable).
2. `awayos-desktop.png` and `awayos-setup.png` (the two AwayOS app
   screenshots used on Windows Tuning / the free-utility section) — same
   deal, or confirm these should be dropped/replaced.

Implementation will proceed with placeholder/blank image slots until these
are supplied; nothing else is blocked on this.

## 12. Out of scope (this round)

- No CMS/database — content stays in code-level data modules
- No user accounts, payments, or booking flow — contact remains
  inquiry-based (email/Discord), matching current business model
- No blog
