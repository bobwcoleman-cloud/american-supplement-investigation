# The American Supplement Investigation
### Project Overview for Reviewers and Contributors

**Site:** https://american-supplement-investigation.netlify.app
**Authors:** Joy Meier, Pharm.D. and Robert W. Coleman, MS Pharm.
**Publisher:** Coleman Publishing, an independent imprint
**Companion project:** brokenpromiseshealthcare.org

---

## What This Is

The American Supplement Investigation is a free, independent, evidence-based public reference resource for dietary supplements. It began as a three-book investigative nonfiction trilogy and has grown into something broader: a working tool that lets anyone look up a real supplement product and see how it actually holds up against the clinical evidence.

The guiding standard, stated plainly on the site itself:

> Follow the money. Follow the science. Follow the evidence.

The project's stance is investigative, not activist. It does not argue that supplements are categorically good or bad — several products in its own rankings carry genuinely strong evidence. Its argument is narrower and, we think, more useful: consumers deserve to know which claims have been tested and which haven't, and the site exists to make that distinction checkable rather than asserted.

**Author background:** Robert Coleman spent 40 years in clinical pharmacy, the last 16 as Director of Clinical Pharmacy Services at the VA Palo Alto Health Care System, with peer-reviewed research spanning infectious disease, pharmacokinetics, anticoagulation therapy, and medical informatics.

---

## What the Site Has

### The Trilogy (complete, all three books)
- **Book One — *What the Label Doesn't Tell You*** (~20,500 words, 7 chapters). Builds the evidence-literacy toolkit — the difference between anecdote and evidence, biological plausibility and demonstrated outcome — using the beta-carotene/ATBC/CARET lung cancer trials as a throughline case study.
- **Book Two — *The Hollow Aisle*** (~29,500 words, 14 chapters). Covers the regulatory gap under DSHEA (1994), how labels and structure/function claims work, documented safety risks and drug interactions, and the business models — subscriptions, affiliate marketing, multi-level marketing — built around supplement sales.
- **Book Three — *Prove It*** (~29,500 words, 11 chapters + appendix). Covers chronic-disease-adjacent claims, the misinformation economy, international regulatory alternatives, and a concrete proposed reform framework.

All three are readable in full on the site, illustrated with 47 original explanatory figures (evidence pyramids, regulatory-path comparisons, dose-response curves, and similar), and available as EPUB and Word downloads.

### Live Tools
- **Product Lookup** — searches the NIH's own Dietary Supplement Label Database (DSLD) in real time and retrieves a real product's actual label: ingredients, doses, brand, UPC. The site does not maintain its own product database by design; NIH remains the source of truth for label data.
- **Investigate the Evidence** — from any retrieved product, generates a standardized evidence-research prompt (evidence hierarchy, dose-vs-trial comparison, safety/interactions, strength-of-evidence rating, sourced citations) and opens it in the visitor's own Claude, ChatGPT, or Perplexity account with one click, or copies it for use with any other AI. The site pays nothing for this and never routes visitor queries through an API it controls.
- **Site-wide Search** — indexes the books, guides, FAQ, and bibliography in one place.

### Reference Content
- **Top 25: Sales vs. Evidence** — America's best-selling supplement categories, rated against the clinical trial evidence behind each one, in a tiered framework (Strong / Conditional on Deficiency / Moderate / Weak).
- **Five research guides** — *How to Read a Health Claim*, *The Regulatory Gap*, *When Natural Isn't Safe*, *Who Profits From Belief*, *What Other Countries Do* (Canada's licensing model, Australia's tiered evidence system, the EU's approved-ingredient list).
- **FAQ** — 23 questions people actually ask (grounded in a U.S. Pharmacopeia pharmacist survey), across safety, evidence, regulation, dosing, and value.
- **Annotated Bibliography** — 33+ sources, searchable and filterable by topic, linked to original studies and government data.
- **Appendix: What Should Change** — a proposed tiered evidence framework for U.S. supplement regulation, modeled on Australia and Canada, applied concretely to the Top 25 list as a worked example.

---

## What the Site Does

- **Pulls real, live government data** rather than static claims — Product Lookup queries the NIH DSLD API directly from the browser.
- **Applies one standardized evidence methodology everywhere** — the same "compare dose to trials, rate strength of evidence, cite sources with dates" standard runs through the books, the Top 25 ratings, and every AI-assisted product analysis.
- **Costs nothing to use and nothing to run** — no ads, no affiliate links, no supplements sold, no paid API calls billed to the site. The AI integration deliberately uses the visitor's own account rather than the site owner's.
- **Cites everything** — every factual claim traces to a peer-reviewed study, a federal regulatory document, or a government dataset.

---

## Editorial Standards

- No advertising, sponsorships, or affiliate revenue of any kind.
- Every source is disclosed; estimates and ranges are labeled as such rather than presented as precise figures.
- The site distinguishes explicitly, throughout: ingredient evidence vs. product evidence; the dose in a product vs. the dose actually studied; biological plausibility vs. demonstrated clinical outcome; and label information vs. proof of efficacy.
- Corrections are invited. If a citation misrepresents its source, the project wants to know.

---

## Technical Notes (for technical reviewers)

- Fully static site (HTML/CSS/vanilla JavaScript), hosted on Netlify.
- No backend server for any visitor-facing feature — search, Product Lookup, and the AI handoff all run client-side.
- Product Lookup calls the public NIH DSLD API directly from the browser; no API key or server-side proxy involved.
- The AI research-assistant integration is intentionally architected around zero ongoing cost: it opens the visitor's own Claude/ChatGPT/Perplexity session with a pre-built prompt rather than calling any AI API from the server.

---

## Where the Project Is Headed

Items already identified as in-progress or planned, in case they're relevant to a review or a contribution:
- Moving the site under a subdomain of brokenpromiseshealthcare.org, to inherit established domain trust.
- Building a dedicated Methodology page, a visible "last reviewed" date system, an independence/funding disclosure statement, and a public corrections log.
- Completing Joy Meier's author biography (currently a placeholder).
- Expanding the Top 25 and Product Lookup evidence coverage over time.

---

## For Potential Contributors

Areas where outside expertise would genuinely improve the project:
- **Clinical/scientific review** — checking evidence characterizations and citations for accuracy, especially in fast-moving areas of the literature.
- **Regulatory expertise** — particularly international comparisons (EU, Australia, Canada) and how they might inform the proposed U.S. framework in the appendix.
- **Editorial fact-checking** — verifying sourced claims against original studies.
- **Technical contributions** — the site's static, dependency-light architecture is intentionally simple to work with for anyone comfortable with HTML/CSS/JS.

---

## Contact

Inquiries, corrections, and contribution interest can be directed through the site's contact channel or via Broken Promises Healthcare's outreach address.
