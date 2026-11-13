/**
 * server/index.js — Railway Express backend for SOL SHIELD.
 *
 * This is an OPTIONAL backend for Railway deployment.
 * It proxies Groq API calls so the key stays server-side.
 *
 * The game works 100% WITHOUT this server (graceful fallback).
 * Only needed if you want the AI coach feature on Railway.
 */

import express from 'express';
import cors from 'cors';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '8kb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['POST', 'OPTIONS'],
}));

// ── Rate limiting (simple in-memory) ─────────────────────────────────────────
const ipHits = new Map();
const RATE_LIMIT  = 20;
const RATE_WINDOW = 10 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) { ipHits.set(ip, { count: 1, start: now }); return true; }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  ipHits.set(ip, entry);
  return true;
}

// Clean up old entries every 15 min
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW;
  for (const [ip, e] of ipHits) if (e.start < cutoff) ipHits.delete(ip);
}, 15 * 60 * 1000);

// ── Groq system prompt ────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You rewrite short messages for a game for kids aged 7 to 12 about running a Moon outpost. Rewrite the DRAFT in friendly, simple English at grade 4 level, with sentences of 12 words or fewer. Keep every number, date and recommendation exactly as in FACTS and DRAFT. Do not add new science facts. Do not mention being an AI. Do not use scary words. Output only the rewritten text, 2 to 4 sentences.`;

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, service: 'sol-shield-api' }));

// ── POST /api/coach ───────────────────────────────────────────────────────────
app.post('/api/coach', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ fallback: true, reason: 'rate_limit' });
  }

  const { kind, facts, draft } = req.body || {};
  const allowedKinds = ['control_reply', 'why_chain'];
  if (!kind || !allowedKinds.includes(kind)) return res.status(400).json({ error: 'Invalid kind' });
  if (!draft || typeof draft !== 'string') return res.status(400).json({ error: 'draft required' });

  const apiKey = process.env.GROQ_API_KEY;
  const model  = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  if (!apiKey) return res.json({ fallback: true, reason: 'no_key' });

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
    if (!upstream.ok) return res.json({ fallback: true });

    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text || text.length > 400) return res.json({ fallback: true });

    return res.json({ text });
  } catch {
    return res.json({ fallback: true });
  }
});

app.listen(PORT, () => {
  console.log(`SOL SHIELD API running on port ${PORT}`);
});

