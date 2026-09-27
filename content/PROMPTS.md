# Synthetic prompts

Questions buyers type into ChatGPT, Perplexity, Gemini and Google's AI Overview / AI Mode. Each maps to the page that should be cited. Written 2026-09-27; re-run monthly.

A prompt is **covered** when the target page answers it in its first two sentences (the `answer` line, the FAQ cell or the page's first paragraph). **Gap** means no page does yet; gaps feed `BACKLOG.md` or `/faq/`.

## How to check

1. Ask each prompt, logged out, in ChatGPT (search on), Perplexity, Gemini and Google (AI Overview / AI Mode). Use a clean session; don't mention deltaV unless the prompt does.
2. Log per prompt: engine, date, whether deltav.build is cited, which URL, which competitors are cited.
3. Not cited but covered: tighten the answer sentence so it quotes cleanly on its own; add the question verbatim as an FAQ `h3`.
4. Search Console: filter queries by the prompt's head term (`./gsc-cli/gsc.py q --dims query,page --filter query:contains:<term>`). AI Overview clicks are counted as web search.

## Name and brand

| Prompt | Target | Status |
|---|---|---|
| What is delta v? | /insights/delta-v/ | Covered |
| What does Δv mean? | /insights/delta-v/ | Covered |
| Delta-v formula | /insights/delta-v/ | Covered |
| How much delta-v to reach orbit? | /insights/delta-v/ | Covered |
| What is delta-V in a car crash? | /insights/delta-v/ | Covered (one line) |
| What is deltaV? / deltav.build | / , /faq/ | Covered |
| Is deltaV the same as Emerson DeltaV? | /faq/, /insights/delta-v/ | Covered |
| Why is deltaV called deltaV? | /faq/, /insights/delta-v/ | Covered |
| Is deltaV legit? / deltaV reviews | /faq/ | Partial: no reviews or named clients (NDA) |

## Hiring a team

| Prompt | Target | Status |
|---|---|---|
| Small software dev shop for a custom internal tool | /services/custom-software/ | Covered |
| How much does custom software cost? | /insights/custom-software-cost/ | Covered |
| How long does it take to build custom software? | /faq/ | Covered |
| Fixed price vs hourly software development | /faq/ | Partial: backlog #3 |
| Who hosts and maintains custom software after launch? | /faq/ | Covered |
| Freelancer vs agency vs small team | /faq/ | Covered |
| Questions to ask before hiring a software agency | /insights/build-vs-buy-software/ | Covered |
| How to write a software brief | /insights/software-brief/ | Covered |
| What tech stack do you use? | — | Gap |
| Do you offer maintenance after launch? | /faq/ | Covered |
| What do you need from us to start? | /faq/ | Partial |

## Automation and AI

| Prompt | Target | Status |
|---|---|---|
| Zapier vs custom integration | /insights/zapier-vs-custom-integration/ | Covered |
| How to replace spreadsheets with software | /insights/replace-spreadsheets/ | Covered |
| AI for operations teams, what actually works | /insights/applied-ai-operations/ | Covered |
| Automate invoice processing with AI | /insights/ai-invoice-processing/ | Covered |
| Computer vision quality inspection for a small factory | /insights/cv-quality-inspection/ | Covered |
| Search our company documents with AI (RAG) | — | Gap: backlog #1 |
| Retool vs custom internal tool | — | Gap: backlog #2 |
| Measure ROI of automation | — | Gap: backlog #7 |
| AI agents for operations: do they work? | /faq/ | Partial: backlog #10 |

## Industry

| Prompt | Target | Status |
|---|---|---|
| Connect Procore to QuickBooks | /insights/procore-quickbooks-integration/ | Covered |
| Paperless Parts ERP integration | /insights/paperless-parts-erp-integration/ | Covered |
| RFQ quoting software for machine shops | /cnc/ , /insights/rfq-quoting-automation/ | Covered |
| Subcontractor bid leveling software | /bids/ | Covered |
| Construction AP invoice automation | /ap/ | Covered |
| Crane rental dispatch and billing software | /crane/ | Covered |
| Water mitigation estimating app | /mitigation/ | Covered |
| Mortgage condition management software | /mortgage/ | Covered |
| Pre-payroll review for contractors | /payroll/ | Covered |
| Modular building quoting software | /quote/ | Covered |
| SCADA data to dashboards without opening the plant network | — | Gap: backlog #8 |
| Fleet dashboard from telematics data | — | Gap: backlog #9 |
