// netlify/functions/ai-summary.js
// Powers the "Generate summary" button in SuppleFacts on the live site.
//
// The page sends ONLY structured label data (brand, product, ingredients and their
// NIH monograph notes). The prompt is built here, on the server, so this endpoint
// can't be used as a general-purpose chatbot. The API key never reaches the browser.
//
// Setup (Netlify > Site configuration > Environment variables):
//   ANTHROPIC_API_KEY = your key from console.anthropic.com
// Optional: ALLOWED_ORIGINS = comma-separated list (defaults to the supplements site)

const MODEL = 'claude-haiku-4-5';
const MAX_INGREDIENTS = 40;
const DEFAULT_ORIGINS = ['https://supplements.brokenpromiseshealthcare.org'];

const json = (statusCode, obj) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj)
});
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(503, { error: 'not_configured' });

  // Basic origin check: only our own site may call this
  const allowed = (process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : DEFAULT_ORIGINS);
  const origin = event.headers.origin || event.headers.Origin || '';
  if (!allowed.includes(origin)) return json(403, { error: 'forbidden_origin' });

  let b;
  try { b = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad_json' }); }
  const ings = Array.isArray(b.ingredients) ? b.ingredients.slice(0, MAX_INGREDIENTS) : [];
  if (!ings.length) return json(400, { error: 'no_ingredients' });

  const lines = [];
  lines.push('Product label: ' + clip(b.brand, 120) + ' — ' + clip(b.name, 200) +
    ' (' + clip(b.form, 120) + ', serving size ' + clip(b.serving, 80) + ').');
  lines.push('Use ONLY the NIH-sourced material given for each ingredient below. Do not add outside claims or invented statistics.');
  ings.forEach((i) => {
    lines.push('\n' + clip(i.name, 160) + (i.amount ? ' (' + clip(i.amount, 60) + ' per serving)' : '') + ':');
    if (i.notes && typeof i.notes === 'object') {
      lines.push('What it is: ' + clip(i.notes.what, 600));
      lines.push('What the evidence shows: ' + clip(i.notes.evidence, 600));
      lines.push('Safety & interactions: ' + clip(i.notes.safety, 600));
    } else {
      lines.push('(No NIH monograph on file for this ingredient — note that plainly rather than guessing.)');
    }
  });
  lines.push('\nWrite one consumer-friendly summary, ' + (ings.length > 3 ? '180–260' : '120–180') +
    ' words, covering what this product’s active ingredient(s) are for and what the evidence actually supports. ' +
    'Stay neutral; do not overstate benefit. End with one short sentence noting this is general information ' +
    'drawn from NIH source material, not medical advice.');

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: 'You write short, neutral, evidence-based ingredient summaries for an independent, pharmacist-run dietary-supplement education site. Plain language, no marketing tone, no claims beyond what the source material actually supports. Output only the summary.',
        messages: [{ role: 'user', content: lines.join('\n') }]
      })
    });
    if (r.status === 429) return json(429, { error: 'rate_limited' });
    const data = await r.json();
    if (!r.ok) {
      console.error('Anthropic API error', r.status, JSON.stringify(data).slice(0, 500));
      return json(502, { error: 'upstream_error' });
    }
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
    if (!text) return json(502, { error: 'empty_response' });
    return json(200, { text });
  } catch (e) {
    console.error('ai-summary failed', e);
    return json(500, { error: 'server_error' });
  }
};
