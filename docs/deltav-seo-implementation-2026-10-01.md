# deltaV SEO implementation — 1 October 2026

This note records the site changes and their pre-publication validation on 1 October 2026. The earlier live audit remains the baseline for measuring indexing, rankings and completed bookings.

## Changes

- Corrected the custom-software service's code-handover promise and the cost guide's weekly-demo wording. About, service pages and the existing agent-readable summaries now explain AWS hosting, the monthly maintenance retainer, client use and data ownership, and deltaV's retention of code, docs and methodology. The summaries describe the software, compute and AI scope.
- Expanded the CNC and crane pages with proposed workflows, approval and exception handling, preparation for a scoping call, and related guides. CNC captions no longer present sample timing figures as measured results. Stack variants link to the full workflow on the main page, keeping their existing noindex/canonical policy and the HTML size budget.
- Added worked examples and stronger internal links across About, the services index, all three service pages, and the cost, invoice processing, Procore–QuickBooks and company document search guides. Examples distinguish sample prototypes and proposed production requirements from completed client work.
- Updated the Procore–QuickBooks guide using current Procore product documentation, including the distinction between Online, Desktop and Intuit Enterprise Suite, company/site limits, and region and record-mapping checks. Added a proposed record-mapping table and duplicate/uncertain-transfer review example. Vendor sources are linked beside the claims.
- Updated the edited guides' modification dates, kept their original publication dates, and kept visible FAQs aligned with their generated structured data. Shortened the invoice automation search title to meet the title-length rule.
- Fixed booking attribution on industry pages: untagged search and direct visits carry the actual first-touch source and landing page instead of being labelled cold email. Explicit campaign tags and company personalization are retained. Service-page booking links also carry the first landing page.

## Validation

- `npm run build` passes: 42 HTML pages, all below the 14,336-byte gzip budget. Largest output: `cnc/stack/index.html`, 14,059 bytes.
- `node --test tests/lead-attribution.test.mjs` passes all six cases: organic, direct, explicit email campaign, internal navigation, company personalization and service-page attribution.
- Generated HTML checks pass for one H1 per page, unique IDs and metadata, internal links and assets, canonical/index policies, JSON-LD, edited FAQ text, guide modification dates and agent-readable output. All 33 sitemap URLs resolve to indexable local pages.
- Local HTTP preview: 18 routes return 200; a nonexistent route returns 404. `git diff --check` passes. These checks do not establish live indexing, Core Web Vitals or completed booking delivery.

## Follow-up

1. Monitor About, workflow automation and the cost guide in Search Console after Google has recrawled the published changes. Publication alone does not establish an improvement in indexing or rankings.
2. Connect Cal.com completed-booking events to an agreed reporting destination, and record qualified-call outcomes and country. This requires the relevant account access and a definition of a qualified call; calendar-link attribution does not prove completion.
3. Add approved engineer bios and real client evidence: named case studies, results, testimonials or permitted project screenshots. The current examples remain sample prototypes and illustrative workflows.
4. Earn relevant industry references and links through real relationships and useful material. No outreach has been sent or third-party placement claimed.

The implementation used CLI and local tooling.
