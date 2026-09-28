/* ============================================================
   Product Lookup — live NIH Dietary Supplement Label Database (DSLD) search
   ------------------------------------------------------------
   This is the SAME lookup logic that has always powered
   product-lookup.html. It has been moved into this shared file
   so the identical, unmodified search can also run on the
   homepage hero search box — not a demo or a mockup of search,
   the real thing, wired to the real element IDs:
     #lookup-input   (text input)
     #lookup-status  (status / loading / error messages)
     #lookup-results (search result list)
     #lookup-detail  (selected product's label + AI analysis buttons)
   Any page that includes this script and has those four elements
   gets full Product Lookup functionality automatically.
   ============================================================ */
(function(){
  const input = document.getElementById('lookup-input');
  if (!input) return; // this page doesn't have the lookup UI — nothing to wire up

  const statusEl = document.getElementById('lookup-status');
  const resultsEl = document.getElementById('lookup-results');
  const detailEl = document.getElementById('lookup-detail');
  const API_BASE = 'https://api.ods.od.nih.gov/dsld/v9';
  let debounceTimer = null;
  let corsConfirmedBroken = false;

  function setStatus(html){
    statusEl.innerHTML = html;
    statusEl.style.display = 'block';
  }
  function clearStatus(){
    statusEl.style.display = 'none';
  }

  function showCorsFailure(){
    corsConfirmedBroken = true;
    resultsEl.innerHTML = '';
    detailEl.innerHTML = '';
    setStatus(
      '<div class="lookup-error-box">' +
      '<p><strong>Live lookup isn\'t available from this browser right now.</strong> This may be a temporary network issue, or the NIH database may not allow direct in-browser requests from this site.</p>' +
      '<a class="btn btn-primary" href="https://dsld.od.nih.gov/" target="_blank" rel="noopener">Search the NIH database directly →</a>' +
      '</div>'
    );
  }

  async function searchProducts(query){
    if (corsConfirmedBroken) return;
    setStatus('<p>Searching…</p>');
    resultsEl.innerHTML = '';
    detailEl.innerHTML = '';
    try {
      const url = API_BASE + '/browse-products?method=by_keyword&q=' + encodeURIComponent(query) + '&size=12';
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      console.log('DSLD search response:', data);
      const hits = (data.hits || []).map(function(h){
        let src = h._source !== undefined ? h._source : h;
        if (typeof src === 'string') {
          try { src = JSON.parse(src); } catch(e) { /* leave as-is */ }
        }
        // Carry over the ES-level _id in case the source object itself has no id field
        if (src && !src.id && !src.dsldId && h._id) {
          src._fallbackId = h._id;
        }
        return src;
      });
      if (hits.length === 0) {
        setStatus('<p>No products found matching "' + query + '." Try a shorter or more general term.</p>');
        return;
      }

      // The NIH database tracks individual label submissions, not deduplicated
      // products — a popular product resubmitted over time (label updates,
      // different manufacturing runs) can have several entries that display
      // identically. Collapse those down to one per unique name+brand so the
      // list doesn't look like it's showing broken duplicates.
      const seen = new Set();
      const dedupedHits = hits.filter(function(item){
        const name = (item.fullName || item.name || '').trim().toLowerCase();
        const brand = (item.brandName || '').trim().toLowerCase();
        const key = name + '|' + brand;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      clearStatus();
      resultsEl.innerHTML = dedupedHits.map(function(item, idx){
        const name = item.fullName || item.name || 'Unknown product';
        const brand = item.brandName || '';
        const id = item.id || item.dsldId || item._fallbackId || '';
        return '<div class="lookup-result-item" data-id="' + id + '" data-idx="' + idx + '">' +
          '<div class="info"><h4>' + name + '</h4><span>' + brand + '</span></div>' +
          '<div class="arrow">View label →</div>' +
        '</div>';
      }).join('');

      document.querySelectorAll('.lookup-result-item').forEach(function(el){
        el.addEventListener('click', function(){
          const id = el.getAttribute('data-id');
          console.log('Clicked result, resolved id:', id);
          if (!id) {
            detailEl.innerHTML = '<div class="lookup-error-box"><p>This result didn\'t include an ID the database can look up directly. Check the browser console (F12) for the raw record — the field name may differ from what this page expects.</p></div>';
            return;
          }
          loadLabel(id);
        });
      });
    } catch (e) {
      console.error('DSLD search failed:', e);
      showCorsFailure();
    }
  }

  async function loadLabel(id){
    detailEl.innerHTML = '<p class="lookup-status">Loading label…</p>';
    try {
      const labelUrl = API_BASE + '/label/' + encodeURIComponent(id);
      console.log('Fetching label:', labelUrl);
      const res = await fetch(labelUrl);
      if (!res.ok) {
        const bodyText = await res.text().catch(function(){ return ''; });
        console.error('Label fetch failed:', res.status, bodyText);
        throw new Error('HTTP ' + res.status);
      }
      const label = await res.json();
      console.log('Label response:', label);
      // Build the full standardized evidence-methodology prompt (used identically
      // across every AI provider, so the analysis stays consistent no matter which
      // tool the visitor chooses).
      const ingredientLines = (label.ingredientRows || []).map(function(row){
        const amount = (row.quantity && row.quantity[0]) ? (row.quantity[0].quantity + ' ' + (row.quantity[0].unit || '')) : '—';
        return '- ' + (row.name || 'Unnamed ingredient') + ': ' + amount;
      }).join('\n');

      const productBlock =
        'PRODUCT\n' +
        'Name: ' + (label.fullName || 'Unknown product') + '\n' +
        'Brand: ' + (label.brandName || 'Unknown') + '\n' +
        (label.upcSku ? 'UPC: ' + label.upcSku + '\n' : '') +
        '\nIngredients (as declared on the NIH label):\n' + ingredientLines;

      const methodology =
        'You are acting as a research assistant for an evidence-based supplement investigation. ' +
        'Analyze the specific product and formulation below. Do not give a generic answer about the ingredient category in the abstract — evaluate THIS exact product at THIS exact dose.\n\n' +
        'Start with your Overall Verdict: a short, direct assessment of this specific product and formulation as a whole — not just its ingredients in isolation. Give the reader your conclusion first, then support it with the detailed analysis below.\n\n' +
        'Then, for each active ingredient in this product, do the following:\n\n' +
        '1. Identify the principal health claims the ingredient is commonly used or marketed for.\n' +
        '2. Prioritize high-quality evidence: systematic reviews and meta-analyses first, then randomized controlled trials, then major evidence-based clinical guidelines where relevant. Prioritize clinically meaningful outcomes over surrogate lab endpoints.\n' +
        '3. Compare the dose in THIS product with the doses actually used in the relevant clinical trials. State plainly whether this product\'s dose: matches studied doses, falls below studied doses, exceeds studied doses, or cannot meaningfully be compared.\n' +
        '4. Identify established adverse effects, clinically significant drug interactions, and important contraindications.\n' +
        '5. If relevant, distinguish evidence for correcting a documented nutritional deficiency from evidence for supplementation in people who are not deficient.\n' +
        '6. Distinguish the type of evidence explicitly: biological plausibility, animal/mechanistic evidence, observational evidence, and randomized clinical evidence. Do not treat anecdotes or testimonials as evidence of efficacy.\n' +
        '7. Rate the strength of evidence for each major use as one of: Strong, Moderate, Limited/Insufficient, Evidence of No Benefit, or Evidence of Harm — and explain WHY it earns that rating rather than just stating the label.\n' +
        '8. Note any conflicting evidence or important uncertainty.\n' +
        '9. Check product quality, not just ingredient science: say whether the brand publishes third-party contaminant testing (for example, heavy metals such as lead, cadmium, and arsenic) or a certificate of analysis, and note any recalls, warnings, or regulatory actions involving this product or brand. If you find no public information, say so plainly rather than guessing.\n' +
        '10. Cite the principal sources with publication dates. Prefer primary, peer-reviewed, and authoritative government sources.\n\n' +
        'Throughout, keep these distinctions clear: ingredient evidence vs. product evidence; the dose in this product vs. the dose actually studied; biological plausibility vs. demonstrated clinical outcome; and label information vs. proof of efficacy or purity.\n\n---\n\n';

      const promptText = methodology + productBlock;

      // A condensed version of the same methodology, used only for the one-click
      // ChatGPT/Perplexity links — keeps what actually lands in the visible chat
      // turn short, rather than the full detailed instructions used when someone
      // copies the prompt manually.
      const compactMethodology =
        'Evaluate this exact supplement product and dose — not just the ingredient category in the abstract. ' +
        'For each ingredient: prioritize systematic reviews and RCTs over observational data or anecdote; compare this product\'s dose to the doses actually used in trials (matches / below / exceeds / not comparable); note key safety risks, drug interactions, and contraindications; rate evidence strength (Strong / Moderate / Limited / No Benefit / Harm) with a brief reason; cite sources with dates; check whether the brand publishes third-party contaminant (heavy-metal) test results and note any recalls or warnings, saying so plainly if none are public. Start with your Overall Verdict on the product as a whole, then support it.\n\n---\n\n';
      const compactPromptText = compactMethodology + productBlock;

      // Providers with a currently-working (though unofficial) one-click prefill.
      // Neither is guaranteed by its vendor, so both fall back to copy+open if the
      // final URL is too long (matching the ~7500-char server limit seen in
      // production ChatGPT integrations), or if anything else goes wrong. The
      // fallback copies the FULL prompt, since at that point the visitor is
      // pasting manually anyway.
      const MAX_PREFILL_URL_LENGTH = 7000;

      function openWithPrefill(baseUrl, paramName, fallbackUrl, btnLabel, btn){
        const url = baseUrl + '?' + paramName + '=' + encodeURIComponent(compactPromptText);
        if (url.length <= MAX_PREFILL_URL_LENGTH) {
          window.open(url, '_blank', 'noopener');
        } else {
          navigator.clipboard.writeText(promptText).then(function(){
            window.open(fallbackUrl, '_blank', 'noopener');
            showToast(btn, btnLabel + ' opened — this product has a long ingredient list, so we copied the full prompt to your clipboard. Paste it in with Ctrl+V / Cmd+V.');
          }).catch(function(){
            window.open(fallbackUrl, '_blank', 'noopener');
          });
        }
      }

      function showToast(btn, message){
        const toast = document.getElementById('lookup-toast');
        toast.textContent = message;
        toast.style.display = 'block';
      }

      const ingredients = (label.ingredientRows || []).map(function(row){
        const amount = (row.quantity && row.quantity[0]) ? (row.quantity[0].quantity + ' ' + (row.quantity[0].unit || '')) : '—';
        return '<tr><td>' + (row.name || 'Unnamed ingredient') + '</td><td>' + amount + '</td></tr>';
      }).join('');

      const statements = (label.statements || []).map(function(s){
        return '<li>' + (s.notes || s.type || '') + '</li>';
      }).join('');

      detailEl.innerHTML =
        '<div class="lookup-detail">' +
        '<div class="nih-retrieved">NIH label retrieved ✓</div>' +
        '<h3>' + (label.fullName || 'Product') + '</h3>' +
        '<div class="brand-line">' + (label.brandName || '') + (label.upcSku ? ' · UPC ' + label.upcSku : '') + '</div>' +
        (ingredients ? '<h5>Ingredients (as declared on label)</h5><table class="lookup-ing-table">' + ingredients + '</table>' : '<p>No itemized ingredient data available for this product.</p>') +
        (statements ? '<h5>Label Statements</h5><ul>' + statements + '</ul>' : '') +
        '<p class="lookup-label-note"><strong>Note:</strong> The NIH label lists only what the manufacturer declares. It does not include contaminant testing (such as heavy metals), and it cannot show whether a given bottle matches its label.</p>' +
        '<h5>Investigate the Evidence</h5>' +
        '<p class="lookup-methodology-note">Compares this exact formulation and dose with published clinical evidence — trial size, dose match, safety, interactions, and published contaminant testing — using an AI research assistant of your choice and your own account. This site pays nothing for your analysis, and you should verify important conclusions using the cited sources.</p>' +
        '<div class="cta-row" style="margin-top:0;">' +
        '<button type="button" class="btn btn-primary" id="btn-claude">Analyze with Claude</button>' +
        '<button type="button" class="btn btn-primary" id="btn-chatgpt">Analyze with ChatGPT</button>' +
        '<button type="button" class="btn btn-primary" id="btn-perplexity">Analyze with Perplexity</button>' +
        '<button type="button" class="btn btn-secondary" id="copy-prompt-btn">Copy Full Research Prompt</button>' +
        '</div>' +
        '<p class="lookup-run-note">Perplexity runs automatically. ChatGPT opens with your prompt ready — press Enter to run it. Claude opens a blank chat — paste with Ctrl+V / Cmd+V, then press Enter.</p>' +
        '<p id="lookup-toast" class="lookup-toast" style="display:none;"></p>' +
        '</div>';

      // Claude: no prefill mechanism exists today (Anthropic removed the old one in
      // Oct 2025), so this is copy-to-clipboard + open, same as the generic fallback.
      document.getElementById('btn-claude').addEventListener('click', function(){
        const btn = this;
        navigator.clipboard.writeText(promptText).then(function(){
          window.open('https://claude.ai/new', '_blank', 'noopener');
          showToast(btn, 'Prompt copied — paste it in with Ctrl+V / Cmd+V and press Enter.');
        }).catch(function(){
          window.open('https://claude.ai/new', '_blank', 'noopener');
        });
      });

      // ChatGPT: currently supports a working (unofficial) ?q= prefill.
      document.getElementById('btn-chatgpt').addEventListener('click', function(){
        openWithPrefill('https://chatgpt.com/', 'q', 'https://chatgpt.com/', 'ChatGPT', this);
      });

      // Perplexity: currently supports a working (unofficial) ?q= prefill.
      document.getElementById('btn-perplexity').addEventListener('click', function(){
        openWithPrefill('https://www.perplexity.ai/search', 'q', 'https://www.perplexity.ai/', 'Perplexity', this);
      });

      const copyBtn = document.getElementById('copy-prompt-btn');
      copyBtn.addEventListener('click', function(){
        navigator.clipboard.writeText(promptText).then(function(){
          copyBtn.textContent = 'Copied ✓';
          showToast(copyBtn, 'Copied! Paste it into Claude, ChatGPT, Perplexity, Gemini, or any AI research assistant.');
          setTimeout(function(){ copyBtn.textContent = 'Copy Full Research Prompt'; }, 2000);
        }).catch(function(err){
          console.error('Clipboard copy failed:', err);
          alert('Could not copy automatically. Prompt:\n\n' + promptText);
        });
      });

      window.scrollTo({top: detailEl.offsetTop - 100, behavior: 'smooth'});
    } catch (e) {
      console.error('loadLabel failed:', e);
      detailEl.innerHTML = '<div class="lookup-error-box"><p>Couldn\'t load this label\'s full details (' + e.message + '). Check the browser console (F12) for details, or <a href="https://dsld.od.nih.gov/" target="_blank" rel="noopener">search the NIH database directly</a>.</p></div>';
    }
  }

  function runSearchNow(){
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    if (query.length < 3) {
      resultsEl.innerHTML = '';
      detailEl.innerHTML = '';
      setStatus('<p>Type at least 3 characters to search.</p>');
      return;
    }
    searchProducts(query);
  }

  input.addEventListener('input', function(){
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    if (query.length < 3) {
      resultsEl.innerHTML = '';
      detailEl.innerHTML = '';
      setStatus('<p>Type at least 3 characters to search.</p>');
      return;
    }
    debounceTimer = setTimeout(function(){ searchProducts(query); }, 500);
  });

  // Pressing Enter runs the search immediately instead of waiting for the debounce.
  input.addEventListener('keydown', function(e){
    if (e.key === 'Enter') {
      e.preventDefault();
      runSearchNow();
    }
  });

  // Optional explicit "Search" button — present on the homepage hero and
  // available to any page that adds one with this id. Same real search,
  // just triggered immediately instead of waiting for the typing pause.
  const searchBtn = document.getElementById('lookup-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', function(){
      runSearchNow();
      input.focus();
    });
  }

  // Optional quick-search chips, e.g. <button class="quick-chip" data-q="Magnesium">Magnesium</button>
  // Used on the homepage hero ("Try a search: Magnesium, Turmeric, ..."). Clicking
  // one fills the box and runs the exact same live search — not a separate demo path.
  document.querySelectorAll('.quick-chip[data-q]').forEach(function(chip){
    chip.addEventListener('click', function(){
      input.value = chip.getAttribute('data-q');
      runSearchNow();
      input.scrollIntoView({behavior:'smooth', block:'center'});
    });
  });

  // If this page was opened with ?q=... (e.g. a link from another page), run
  // that search automatically on load.
  try {
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get('q');
    if (initialQ && initialQ.trim().length >= 3) {
      input.value = initialQ.trim();
      runSearchNow();
    }
  } catch (e) { /* URLSearchParams unsupported — ignore, manual search still works */ }
})();
