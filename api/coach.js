/**
 * api/coach.js — Vercel Serverless Function: Groq AI proxy.
 * Rewrites game text in a kid-friendly voice. Never decides game outcomes.
 * Env vars (set in Vercel dashboard): GROQ_API_KEY, GROQ_MODEL
 */

// Simple in-memory rate limiter (resets per cold start — good enough for free tier)
const ipHits = new Map();
const RATE_LIMIT   = 20;
const RATE_WINDOW  = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) {
    ipHits.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  ipHits.set(ip, entry);
  return true;
}

const SYSTEM_PROMPT = `You rewrite short messages for a game for kids aged 7 to 12 about running a Moon outpost. Rewrite the DRAFT in friendly, simple English at grade 4 level, with sentences of 12 words or fewer. Keep every number, date and recommendation exactly as in FACTS and DRAFT. Do not add new science facts. Do not mention being an AI. Do not use scary words. Output only the rewritten text, 2 to 4 sentences.`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ fallback: true, reason: 'rate_limit' });
  }

  // Parse and validate body
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { kind, facts, draft } = body || {};
  const allowedKinds = ['control_reply', 'why_chain'];
  if (!kind || !allowedKinds.includes(kind)) return res.status(400).json({ error: 'Invalid kind' });
  if (!draft || typeof draft !== 'string') return res.status(400).json({ error: 'draft required' });

  // Size guard (~4KB)
  const bodyStr = JSON.stringify(body);
  if (bodyStr.length > 4096) return res.status(400).json({ error: 'Request too large' });

  const apiKey = process.env.GROQ_API_KEY;
  const model  = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  if (!apiKey) return res.status(200).json({ fallback: true, reason: 'no_key' });

  const userContent = `FACTS: ${JSON.stringify(facts || {})}\nDRAFT: ${draft.substring(0, 800)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 200,
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!upstream.ok) return res.status(200).json({ fallback: true });

    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text || text.length > 400) return res.status(200).json({ fallback: true });

    return res.status(200).json({ text });
  } catch {
    return res.status(200).json({ fallback: true });
  }
}

