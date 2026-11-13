/**
 * src/services/groq.js — Client-side Groq AI service.
 * Calls either the Vercel /api/coach or Railway backend.
 * Falls back gracefully if unavailable.
 */

const FEATURE_AI = import.meta.env.VITE_FEATURE_AI !== 'false';
const RAILWAY_URL = import.meta.env.VITE_RAILWAY_API_URL || '';

// Use Railway URL if set, otherwise fall back to Vercel serverless
const API_ENDPOINT = RAILWAY_URL ? `${RAILWAY_URL}/api/coach` : '/api/coach';

// In-memory cache: hash → text
const cache = new Map();

function hashKey(kind, draft) {
  return `${kind}::${draft.substring(0, 100)}`;
}

/**
 * Ask the AI coach to reword text. Falls back to draft on any error.
 * @param {'control_reply'|'why_chain'} kind
 * @param {object} facts - Game facts (storm tier, flare class, etc.)
 * @param {string} draft - Rule-based text to reword.
 * @returns {Promise<string>} Reworded text, or draft if fallback.
 */
export async function askCoach(kind, facts, draft) {
  if (!FEATURE_AI) return draft;

  const key = hashKey(kind, draft);
  if (cache.has(key)) return cache.get(key);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, facts, draft }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return draft;
    const data = await res.json();

    // Validation: fallback flag, empty, too long, or numbers changed
    if (data.fallback || !data.text) return draft;
    if (data.text.length > 400) return draft;

    // Check all digit sequences in draft appear in returned text
    const draftNums = draft.match(/\d+/g) || [];
    const textNums  = data.text.match(/\d+/g) || [];
    for (const n of draftNums) {
      if (!textNums.includes(n)) return draft; // number was changed — reject
    }

    cache.set(key, data.text);
    return data.text;
  } catch {
    return draft;
  }
}

