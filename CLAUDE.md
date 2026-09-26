# CLAUDE.md — DeltaV Landing Page

## Project Brief

This is the landing page for **DeltaV** — a **delta team / dev shop** of five software engineers. We take any software or compute problem — from a business or an individual — and turn it into working software, using applied AI where it earns its place. The page is a **lead-generation tool**: it backs our outreach and captures inbound interest.

> **Positioning update (2026-09):** DeltaV is no longer framed as a Final Year Project / POC studio. Do not reintroduce FYP, academic-year, student, or "no staffing cost" language. Scope is software/compute/AI only — no hardware delivery for now. The domain list in Section 3 stays as-is. Sections below that still describe the old POC/FYP model are superseded by what's live in `src/index.html`.
>
> **Services framing (2026-09-24):** The page is a services portfolio sent to prospects and leads. Content is outcome-led (time, money, manual effort eliminated); tone stays military/direct. Invite, don't filter: no gatekeeping copy ("We're listening", "a problem that fits", "if a template solves it…"), no yes/no gate on the intake form. CTAs name a concrete action (e.g. "Book a scoping call"). Position DeltaV as a multiplier — speed, productivity, value (Δv = change in velocity; hero: "We add velocity to your business."). Never frame it as where grunt work or disposable tasks get dumped, and don't imply the client's team is incapable ("can't or won't" was rejected).

> **Engagement model (2026-09-26):** Scope → Build → Run. deltaV keeps the code, docs and methodology and hosts the software on its own infrastructure (AWS); clients get full use of it and pay a monthly retainer for hosting and maintenance. Never claim handover, client code ownership, "yours", or a bug-fix warranty. Client data stays the client's. No retainer amounts on the site.
>
> **Design update (2026-09-26), all pages:** Palantir-style: dark and restrained, but readable. Tokens are shared by `src/site.css` and the homepage `<style>`; keep them in sync. Headlines (h1/h2, hero, big section heads) in Barlow Condensed 700 uppercase; everything else in the system sans-serif, h3 in sentence case, monospace only for small numbers and URLs, labels ≥13px, text contrast ≥4.5:1, no noise texture, no blinking cursor. Every page, homepage included, uses the same header (ΔV DeltaV · Services · Prototypes · Insights · Book a call) and footer links. Hierarchy comes from thin rules and whitespace, not boxes or icons. Primary buttons are light-on-dark. Green (`--accent-bright`) marks the V in ΔV, section labels and eyebrows, table headers, list numbers, the header "Book a call" button and accent rules; body text and main CTAs stay neutral. This wins over the sections below.

Target audience: **businesses and individuals** with a real problem that runs on compute — CTOs, founders, operators.

---

## Name & Domain

**Team name:** deltaV (written as **ΔV** in display contexts, **deltaV** in body text — lowercase d, since 2026-09-26. Exception: "Emerson DeltaV" in the disambiguation lines refers to another product.)

**Domain:** `deltav.build`

**Why the name — and this must appear on the page:**

DeltaV (Δv) is a term from astronautics. It is the measure of the impulse required to change an object's trajectory — the single number that determines whether a spacecraft reaches orbit or falls back to earth. The more DeltaV a system has, the more it can change where it's going.

The name maps directly to what the team does: we are the DeltaV for ideas that are stuck. Ideas with real technical depth, real potential, but no trajectory. We give them the impulse to move — from concept to proof of concept — so the people who own them can figure out where they're going next.

This definition must be used verbatim (or close to it) on the website, rendered in a way that feels like a technical specification or mission brief — not marketing copy. Think of how Palantir explains "Gotham" or how DARPA titles a program. Clinical, precise, purposeful.

---

## Identity & Aesthetic Direction

The site must feel like **Palantir, Lockheed Martin, or DARPA** — not a student project, not a startup landing page, not a portfolio site. The identity is:

- **Spec-ops / delta unit** — elite, precise, operating in a domain most people can't enter
- **Serious and transactional** — no fluff, no padding, no corporate warmth
- **Dark, technical, military-grade** — think classified briefings, targeting systems, mission readiness
- **Confident to the point of exclusion** — this page should make the wrong kind of company feel like they shouldn't reach out

Visual direction:

- **Dark background** — near-black (#0a0a0a or similar), not pure black
- **Accent color** — one sharp accent only. Use a desaturated military green (#4a5c3a range) OR a cold steel blue (#2a3f5f range). Pick whichever reads more "spec-ops command center" than "tech startup." No purple gradients, no neon, no gradients at all unless very subtle and purposeful.
- **Typography** — headlines use `--font-display`: Barlow Condensed 700, self-hosted at `src/fonts/barlow-condensed-700.v1.woff2` (basic-Latin subset, 7 KB, preloaded, cached immutably; bump `.vN` if it changes). Body is the system sans-serif stack (`--font-sans`); `--font-mono` only for step numbers, counters and URLs. No other web fonts.
- **Texture** — none. Flat near-black; depth comes from thin rules and spacing.
- **Motion** — restrained and purposeful. One staggered load sequence where elements reveal top-to-bottom with a short delay. Subtle hover states. No bouncing, no spinning, no scroll-triggered explosions.
- **Layout** — asymmetric, generous negative space. Not centered-everything. Some elements should break the grid slightly.

---

## Performance Requirements — NON-NEGOTIABLE

**The initial HTML file served must be under 14KB gzipped/brotli.** This is the TCP initial congestion window limit. The page must begin rendering before the second round trip.

To achieve this:

1. **Single HTML file** — all critical CSS inlined in `<style>` in `<head>`. No external CSS file for above-the-fold content.
2. **No JavaScript frameworks** — vanilla JS only. Zero dependencies. No React, Vue, Alpine, jQuery, nothing.
3. **Web fonts via `font-display: swap` + preconnect** — load fonts asynchronously so they never block render. The page must be fully readable with fallback fonts while web fonts load.
4. **No images in the critical path** — if any images/icons are used, they must be inline SVG or CSS-drawn. No `<img>` tags that block paint.
5. **JS deferred** — any JavaScript must be at the bottom of `<body>` with `defer` or loaded after `DOMContentLoaded`. No JS in `<head>`.
6. **Minify everything** — the final `index.html` must be minified before deployment. Use a build step (e.g., `html-minifier-terser`) to produce a `dist/index.html`. Target: raw file under 30KB, gzipped/brotli under 14KB.
7. **No external dependencies loaded in the critical path** — fonts via Google Fonts are acceptable only with `<link rel="preconnect">` and loaded async.

Test your output with: `gzip -c dist/index.html | wc -c` — must be under 14336 bytes.

---

## Tech Stack

- **Language**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Build tool**: A minimal `package.json` with a single build script using `html-minifier-terser` to produce `dist/index.html` from `src/index.html`
- **Hosting**: Cloudflare Pages — deploy from `dist/` directory
- **Form backend**: Formspree (free tier) — form submissions go to Formspree endpoint, no backend required. Use `https://formspree.io/f/[FORMSPREE_ID]` as the action — leave `[FORMSPREE_ID]` as a placeholder.
- **No frameworks, no bundlers (webpack/vite/etc.), no CSS preprocessors** — keep the build chain minimal

File structure:

```
/
├── src/
│   └── index.html          # Source file — edit this
├── dist/
│   └── index.html          # Minified output — deploy this
├── package.json
├── .gitignore
└── CLAUDE.md
```

---

## Page Structure & Content

The page is a **single scrollable page** with four sections. No multi-page routing.

### Section 1 — Hero

Full viewport height. This is the first thing they see.

Content:

- Team name: **ΔV** — displayed as a small badge top-left. Render the delta symbol (Δ) large and the V tight beside it, monospaced feel. On hover, expand to show "DeltaV" in a lighter weight beside it
- Main headline (large, commanding): Something in the vein of:

  > "We build the POC your team won't."

  Or:

  > "One idea. One year. One team that can actually build it."

  Write a headline that a CTO would read and immediately think "this is for me or it isn't" — no ambiguity, no hedging.

- Sub-headline (1–2 lines max): Briefly name the audience and the exchange. Something like:

  > "For founders sitting on technically complex ideas they haven't pulled the trigger on. We take the risk off the table."

- Single CTA button: **"We're listening"** or **"Tell us you're interested"** — clicking this smooth-scrolls to Section 4 (the contact/interest form).

No nav bar. No hamburger menu. No logo beyond the team name badge.

### Section 1.5 — The Definition (sits directly below the hero fold, no hard section break)

Immediately below the hero fold, before the model explanation, render the scientific definition of DeltaV as a technical brief. Style it like a classified document entry or a DARPA program description — left-aligned, monospaced font, subtle horizontal rule above, a dim label ("DESIGNATION") above the rule.

Suggested render:

```
DESIGNATION
─────────────────────────────────────────────
Δv  /ˈdɛltə viː/  —  astronautics

DeltaV is the measure of the impulse required to change
the trajectory of an object in space. It is the single
number that determines whether a spacecraft reaches orbit
or falls back to earth.

We are the DeltaV for ideas that are stuck.

Ideas with real technical depth, real potential — but no
trajectory. We provide the impulse: from concept to proof
of concept, in one year, at no staffing cost to you.
```

The final two lines (starting from "We are the DeltaV...") should render slightly brighter and slightly larger — signalling the pivot from scientific definition to mission claim. Everything above reads like a technical specification. Use a blinking cursor character (|) at the very end to give it a terminal/command-line feel.

---

### Section 2 — The Model

This section explains exactly how this works. Keep it tight. No bullet points with icons, no feature cards with drop shadows. Use raw text with strong typographic hierarchy.

Content structure:

1. **A short framing statement** (1 sentence): Name exactly who this is for. E.g.:

   > "This is not for the company that needs a CRUD app."

2. **What we do** (3–4 sentences): The model in plain language — you have technically complex ideas that are too uncertain to staff. We take one, build the POC in a full academic year as our Final Year Project, and hand it back. You figure out if there's a market.

3. **What we need from you** — presented as three clean numbered items (styled as a technical list, not a bullet-point feature grid):
   1. An idea with real technical depth
   2. Access to someone who understands the problem
   3. Honest feedback as we build

4. **What you get** — mirror the above, three items:
   1. A working POC, no staffing cost
   2. A dedicated team for 12 months
   3. Zero equity, zero commitment beyond the engagement

No testimonials, no logos, no social proof — this is a cold outreach tool, not a portfolio.

### Section 3 — What We Build

Short section. Names the types of problems we take on, to act as a filter.

Use a sparse, technical grid — think less "feature cards" more "technical classification table" or "mission parameters."

Examples of domains (write these as terse technical descriptors, not marketing copy):

- Computer vision / autonomous inspection systems
- Industrial automation & control systems
- Embedded systems & hardware-software integration
- AI/ML systems for domain-specific inference
- Robotics & sensor fusion

Close with one line that cuts off the wrong audience:

> "If your idea fits a weekend hackathon, this isn't for you."

### Section 4 — Interest Capture (The CTA Form)

This is not a traditional contact form. The UX should feel like a **mission intake form** — sparse, precise, no unnecessary fields.

**Flow:**

**Step 1 — Signal interest**
A single question, displayed large:

> "Do you have an idea that fits?"

Two buttons: **"Yes, tell me more"** (proceeds to step 2) and a subtle "Not right now" (closes/hides the section gracefully).

**Step 2 — How should we reach you?**
Display four options as toggle buttons (select one):

- 📧 Email
- 💼 LinkedIn
- 📱 WhatsApp / Phone
- 🗓️ Schedule a call (opens Calendly link — leave as `[CALENDLY_LINK]` placeholder)

Selecting one reveals Step 3.

**Step 3 — Drop your detail**
A single text input, labelled dynamically based on their Step 2 choice:

- Email → "Your email address"
- LinkedIn → "Your LinkedIn profile URL"
- WhatsApp/Phone → "Your number (with country code)"
- Schedule a call → auto-redirect to `[CALENDLY_LINK]`, no input needed

Plus an optional one-line text field: **"One line about the idea (optional)"**

**Step 4 — Submit**
Button: **"Send it"**

On success: replace form with a short, confident confirmation message. No celebration, no confetti. Something like:

> "Got it. We'll be in touch."

On error: inline error message below the button.

Submit goes to Formspree endpoint. The payload should include: contact method, contact detail, and the optional idea description.

---

## Responsive Design

Must work perfectly at:

- **320px** — smallest mobile (someone checking on an old phone)
- **390px** — iPhone 15 viewport
- **768px** — tablet
- **1440px** — standard desktop
- **2560px+** — large display / 4K / 60" screen (use `max-width` container with generous padding so it doesn't stretch absurdly)

Use CSS custom properties for all spacing, font sizes, and colors. Use `clamp()` for fluid typography — headline font size should scale smoothly between mobile and large desktop without breakpoint jumps.

No horizontal scroll at any viewport width.

---

## Copy Tone

- **Direct, not warm** — no "we'd love to hear from you," no "let's connect," no exclamation marks
- **Confident, not arrogant** — state things as fact, not as bravado
- **Exclusive, not elitist** — it's okay if some people read this and think "not for me." That's the filter working.
- **Technical without jargon** — a non-technical founder should understand every word, but a CTO should feel like this was written for them

---

## What NOT to Do

- No hero background image or video — keep it CSS/typography-driven
- No testimonials, case studies, or social proof sections
- No footer with 20 links — just a minimal footer with team name and year
- No nav links to other pages (there are no other pages)
- No cookie banners, no tracking pixels, no analytics scripts (keep it clean)
- No loading spinners
- No modal popups
- No sticky nav bar
- No gradient text effects (overused)
- No purple, no orange, no rainbow
- Never center-align body text — left-align everything

---

## Build Instructions

```bash
# Install build dependency
npm install

# Build minified output
npm run build

# Check gzipped size (must be under 14336 bytes)
gzip -c dist/index.html | wc -c
# `npm run build` also prints raw/gzip -9 sizes for every page and fails if any is over 14336 B

# Deploy to Cloudflare Pages
# Connect GitHub repo to Cloudflare Pages
# Set build command: npm run build
# Set output directory: dist
```

`package.json` should include:

```json
{
  "name": "team-landing",
  "scripts": {
    "build": "html-minifier-terser src/index.html -o dist/index.html --collapse-whitespace --remove-comments --minify-css true --minify-js true"
  },
  "devDependencies": {
    "html-minifier-terser": "^7.2.0"
  }
}
```

---

## Placeholders to Replace Before Launch

| Placeholder       | What it is                          |
| ----------------- | ----------------------------------- |
| `[FORMSPREE_ID]`  | Formspree form ID from formspree.io |
| `[CALENDLY_LINK]` | Calendly scheduling link (optional) |
| `[CONTACT_EMAIL]` | Fallback email in footer            |

---

## Search Console

`./gsc-cli/gsc.py` (gitignored, separate repo) reads and writes Search Console for this site. Read `gsc-cli/README.md` before interpreting results — delta sign conventions and row limits cause silent misreadings.

```sh
export GSC_SITE='sc-domain:deltav.build'
export GSC_KEY_FILE="$HOME/.gsc/deltav.json"   # DeltaV-only service account. ~/.gsc/key.json belongs to another project — never use it here.
./gsc-cli/gsc.py sites
```

Data lags ~3 days. `sitemap-submit` and `sitemap-delete` change what Google sees — ask first.

---

## Insights (blog)

Posts live in `content/insights/<slug>.html` and publish to `/insights/<slug>/`. `scripts/insights.mjs` renders them and regenerates the `/insights/` index, `sitemap.xml` and the guide list in `llms.txt` (`{{guides}}` marker) — never hand-edit those. Topic queue: `content/BACKLOG.md`.

A post is a JSON front-matter block in a leading `<!-- -->` comment, then the body as HTML. Each `<h2>` starts a numbered section; layout, schema, FAQ grid and CTAs are added by the build. Copy an existing post as the template. Required keys: `title`, `seoTitle` (≤60 chars), `description` (≤155), `eyebrow`, `date`, `answer`, `card`, `cta`. Optional: `faq`, `updated`, `draft`.

Workflow — one post a day, generated locally, published on approval:

1. Write the next backlog topic with `"draft": true`. Answer-first, terse, tables and lists over paragraphs, 3 FAQs.
2. `npm run dev` → preview at http://127.0.0.1:8790/insights/ (drafts show, labelled "Draft").
3. On approval: remove `draft`, set `date` to publish day, update `BACKLOG.md`, commit, push (push to `main` deploys).
4. After the Cloudflare build: `./gsc-cli/gsc.py sitemap-submit https://deltav.build/sitemap.xml`.

Never state a number, price, client or result that isn't verified. Date-stamp third-party facts ("pricing page, September 2026").

---

## Problem pages (cold email)

Outreach flow: cold email → their problem → working demo → call. Links look like `https://deltav.build/<slug>/?c=Acme%20Co`.

- Data: `content/problems/<slug>.json` + screenshots `content/problems/<slug>/N.webp` (5 per demo, 1280×800 or 430×880 for `"device": "phone"`, < 60 KB, captured only from the de-branded `proto-*.vercel.app` prototypes). Fictional companies only; vendor product names may stay. Set `"enabled": false` to park one (its links 302 to `/`).
- `scripts/problems.mjs` (called from `build.mjs`) builds `/<slug>/` and `/<slug>/stack/` (the other problems as cards above) from `src/index.html`: problem block + demo frame before `#hero`, sticky book bar, "Try it yourself" overlay that iframes the prototype, CSS/JS from `scripts/problems/`. It also emits `demos/<slug>/N.<hash>.webp` (immutable in `_headers`) and all of `_redirects` (aliases, `/<slug>/solo`, `/p/<slug>`; both slash forms).
- Homepage hooks it relies on (the build fails if one goes missing): the `?p=` legacy shim at the top of `<body>` (the one inline script before content; `{{problems}}` is filled with live slugs), `<section id="hero">`, `#intake`, the hidden `field-subject` / `source_problem` / `source_variant` / `field-company` / `field-tried` inputs, and `window.DV_BOOK` in the Calendly handler (carries the UTM tags).
- `/work/` is the prototype gallery: `src/work/index.html` is a template (`{{prototype_count}}`, `{{prototypes}}`) that `problems.mjs` renders; the build skips the raw file. Cards link to `/<slug>/?demo=1&utm_…`; `?demo=1` opens the live prototype on arrival and incoming `utm_*` tags replace the cold-email defaults on the Calendly link.
- `src/lead-attribution.js` (deferred, every page) keeps the visit's first touch (entry page, channel, referrer, UTM) in sessionStorage, fills the matching hidden fields in the intake form, and exposes `DV_BOOK_FROM_SITE` for the Calendly link. Nothing is sent anywhere except with a form submission.
- `?c=` puts the company in the headline, form (`source_company`, subject) and Calendly `utm_term`; text only, 40 chars max.
- SEO: variants are `noindex`, canonical `/`, no FAQ schema, and stay out of `sitemap.xml` and `llms.txt`.
- Slugs and aliases must not match a real route (`services`, `faq`, `insights`, …) or each other; the build fails if they do. Add an industry: write the JSON + screens, `npm run build`, check the size table, `/<slug>/?c=Acme`, `/<slug>/stack/`, `/?p=<slug>`, and an alias.
