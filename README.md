# The American Supplement Investigation

Source files for the live site: https://american-supplement-investigation.netlify.app

A free, independent, evidence-based public reference resource for dietary supplements — a three-book investigation, a live NIH-connected product lookup, an evidence-rated Top 25 ranking, research guides, an FAQ, and a searchable bibliography.

## Structure

This is a fully static site — plain HTML, CSS, and vanilla JavaScript. No build step, no framework, no backend server.

- All pages live flat in the repo root (Netlify's deploy expects this — no subfolders for HTML or images).
- `style.css` is the single shared stylesheet for every page except the three book readers (`read-book-two.html` and `read-book-three.html` carry their own separate inline stylesheet; `read-book-one.html` uses the shared one).
- Book figures are embedded directly in the reader pages as base64-encoded images — intentionally self-contained, so the site can't break from a missing image folder.
- `product-lookup.html` calls the NIH Dietary Supplement Label Database (DSLD) API directly from the browser — no API key, no backend, no cost to run.
- `search.html` indexes the site's own content (Top 25, FAQ, guides, bibliography, books) entirely client-side.

## Deployment

This repo is connected to Netlify for continuous deployment: every push to the main branch triggers a new deploy automatically. No manual file upload required.

## Key pages

| Page | Purpose |
|---|---|
| `index.html` | Homepage |
| `product-lookup.html` | Live NIH product label lookup + AI evidence research handoff |
| `about-product-lookup.html` | How Product Lookup works |
| `top-25-supplements.html` | Best-selling supplements rated against clinical evidence |
| `faq.html` | 23 common questions, sourced |
| `search.html` | Site-wide search |
| `annotated-bibliography.html` | Full source list |
| `appendix-what-should-change.html` | Proposed regulatory framework |
| `read-book-one.html` / `read-book-two.html` / `read-book-three.html` | Full text of the trilogy |

## Editorial standards

No ads, no affiliate links, no supplements sold. Every factual claim is sourced to peer-reviewed research, federal regulatory documents, or government data.
