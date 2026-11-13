<div align="center">

# 🛡️ SOL SHIELD

### *A Junior Astronaut Mission Trainer*

**2026 NASA Space Apps Challenge**

[![Tests](https://img.shields.io/badge/tests-60%20passing-brightgreen?style=flat-square&logo=vitest)](./tests)
[![NASA Data](https://img.shields.io/badge/NASA%20data-real%20DONKI%20events-blue?style=flat-square&logo=nasa)](https://kauai.ccmc.gsfc.nasa.gov/DONKI/)
[![License](https://img.shields.io/badge/license-MIT-orange?style=flat-square)](./LICENSE)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Age](https://img.shields.io/badge/ages-7--12-purple?style=flat-square)](#)

<br/>

> **Can you keep your crew alive through a solar particle storm?**
> Manage air, food, and radiation shielding over a 10-sol Mars mission.
> Every block you spend on one system is a block you cannot spend on another.

<br/>

---

</div>

## 🌟 What is Sol Shield?

**Sol Shield** is a browser-based strategy game where players aged **7–12** act as junior astronauts managing a 10-sol (10 Martian day) mission during a real solar particle storm.

Players must balance **three life-support systems** every sol:

| 🌬️ Air | 🍎 Food | ☢️ Shield |
|:---:|:---:|:---:|
| Keep oxygen flowing | Keep the crew fed | Block radiation from solar storms |

Spend your power blocks wisely — a solar storm is coming, and **Mission Control** is standing by.

---

## 🎮 Gameplay

```
Sol 1 ──► Sol 2 ──► Sol 3 (Watch ⚠️) ──► Sol 4 ──► Sol 5 (Warning 🚨)
──► Sol 6 (STORM ☀️💥) ──► Sol 7 ──► ... ──► Sol 10 → Debrief
```

Each sol you get **5 power blocks** to allocate:

- **Air block** → +10 oxygen
- **Food block** → +9 food supply
- **Shield block** → +8 radiation shielding
- **Mission Control** → costs 1 block, get expert advice

Watch for **storm alerts** — a particle storm is arriving. Build up your shields before it hits, but don't let your air or food crash in the process.

### Storm Tiers

| Tier | Class | Description |
|------|-------|-------------|
| 🟡 Tier 1 | M5–M9.9 | Minor storm — manageable with basic prep |
| 🟠 Tier 2 | X1–X4.9 | Major storm — requires smart shielding |
| 🔴 Tier 3 | X5+ | Extreme storm — 2 sol event, very dangerous |

---

## 🚀 Real NASA Data

Every storm in the game is a **real solar event** from NASA's DONKI database:

| Year | Event | Class | Tier |
|------|-------|-------|------|
| 2012 | March solar storm | X5.4 | 🔴 3 |
| 2014 | September flare | X1.6 | 🟠 2 |
| 2017 | September record | X9.3 | 🔴 3 |
| 2024 | May G5 storm | X8.7 | 🔴 3 |
| + 9 more | Various | M–X class | 🟡🟠🔴 |

**13 real events** (4 tier-1 · 5 tier-2 · 4 tier-3) fetched from the [NASA DONKI API](https://kauai.ccmc.gsfc.nasa.gov/DONKI/).

After each mission the **Why Chain** debrief shows you:
- The real NASA event card with a DONKI link
- Cause → Effect → Result explanation
- What would have happened with more shielding
- Honest notes about what the game simplifies

---

## 🏗️ Architecture

```
sol-shield/
├── 📂 src/
│   ├── 📂 game/          # Pure logic (no DOM)
│   │   ├── engine.js     # allocateBlock, endSol, applyStorm, checkOutcome
│   │   ├── storm.js      # Pick real NASA event, build timeline
│   │   ├── missionControl.js  # Rule-based expert replies
│   │   ├── whyChain.js   # Post-mission explanation generator
│   │   ├── rng.js        # Seeded Mulberry32 RNG (deterministic)
│   │   ├── state.js      # Initial state shape
│   │   └── config.js     # Loads balance.json
│   ├── 📂 ui/
│   │   ├── 📂 screens/   # title, briefing, play, debrief, about
│   │   └── 📂 components/ # meter, blockPicker, stormTimeline, chat, etc.
│   ├── 📂 services/      # groq.js, supabase.js, nicknames.js
│   └── main.js           # App shell & router
├── 📂 public/data/
│   ├── balance.json      # All tunable game numbers (never hardcoded)
│   ├── storms.json       # 13 real NASA DONKI events
│   ├── glossary.json     # Kid-friendly term definitions
│   └── facts.json        # Verified NASA facts with source URLs
├── 📂 api/
│   └── coach.js          # Vercel serverless — Groq AI proxy (optional)
├── 📂 scripts/
│   ├── build-storms.mjs  # Fetch & parse NASA DONKI API
│   ├── verify-data.mjs   # Validate storms.json (CI gate)
│   └── balance-sim.mjs   # 10,000-run strategy simulator
└── 📂 tests/             # 60 Vitest tests
```

**Tech stack:** Vite · Vanilla JS (ES modules) · Plain CSS · Vitest · No frameworks

---

## ✅ Test Results

```
Test Files  4 passed (4)
     Tests  60 passed (60)
  Duration  ~800ms

✓ tests/engine.test.js    — 33 tests  (allocation, drains, storms, outcomes)
✓ tests/storm.test.js     — 10 tests  (NASA event picking, timeline building)
✓ tests/whychain.test.js  — 10 tests  (debrief scenarios, NASA card, counterfactual)
✓ tests/data.test.js      —  7 tests  (storms.json structure & counts)
```

---

## ⚡ Quick Start

```bash
# Clone
git clone https://github.com/hasnainaliasghar/Sol-Shield.git
cd Sol-Shield/sol-shield

# Install
npm install

# Run (dev server at http://localhost:5173)
npm run dev

# Test
npm test

# Build for production
npm run build
```

### Optional: Fetch fresh NASA storm data

```bash
# Copy the example env file
cp .env.example .env
# Edit .env and add your NASA API key (or leave DEMO_KEY)

npm run data:build      # Fetch from DONKI API
npm run data:verify     # Validate the output
```

Get a free NASA API key at [api.nasa.gov](https://api.nasa.gov)

---

## 🌐 Deploy to Vercel

The game is **100% static** — no server required.

1. Push to GitHub (already done ✅)
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import `hasnainaliasghar/Sol-Shield`
4. Set **Root Directory** → `sol-shield`
5. Framework: **Vite** · Build: `npm run build` · Output: `dist`
6. Click **Deploy** 🎉

> The game works with **zero environment variables**. Everything is optional.

| Variable | Purpose | Required? |
|---|---|---|
| `GROQ_API_KEY` | AI coach hints | ❌ Optional |
| `VITE_FEATURE_AI` | Enable AI coach UI | ❌ Optional |
| `VITE_SUPABASE_URL` | Leaderboard | ❌ Optional |
| `VITE_SUPABASE_ANON_KEY` | Leaderboard | ❌ Optional |

---

## 🎓 Design Principles

| Principle | Implementation |
|---|---|
| **No fabricated data** | All storms are real NASA DONKI events with links |
| **Works offline** | 100% static — no network after first load |
| **Kid safe** | No accounts, no emails, no free-text names, no analytics |
| **Grade 3–5 reading** | All text ≤12 words per sentence |
| **Mobile first** | 360px minimum · 44px touch targets · WCAG AA contrast |
| **Honest** | Debrief shows what the game simplifies vs. real science |
| **Tunable** | All game numbers in `balance.json` — never hardcoded |

---

## 🔭 Balance Results

Simulated 10,000 runs per strategy per tier:

| Strategy | Tier 1 🟡 | Tier 2 🟠 | Tier 3 🔴 |
|---|---|---|---|
| AllShield | 0% | 0% | 0% |
| AllAir | 0% | 0% | 0% |
| AllFood | 0% | 0% | 0% |
| **Even** | 100% | 100% | 0% |
| **NeedBased** | 100% | 100% | 34% |
| **SmartEarly** ⭐ | 100% | 100% | **65%** |
| IgnoreStorm | 100% | 0% | 0% |
| AskEverySol | 100% | 0% | 0% |

*SmartEarly = reacts to Watch/Warning alerts by stacking shields before the storm.*
*No single system wins every time — every block counts.*

---

## 📡 Data Sources

| Source | Used for |
|---|---|
| [NASA DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) | Real solar flare events (13 fetched) |
| [NASA BVAD 2015](https://www.nasa.gov/wp-content/uploads/2016/10/bvad2015_revb_tagged_0.pdf) | Oxygen & food consumption rates |
| [NASA Radiation Health](https://www.nasa.gov/humans-in-space/astronaut-health/radiation/) | Astronaut dose limits |
| [NASA Apollo Radiation](https://www.nasa.gov/feature/goddard/2021/how-apollo-astronauts-survived-the-journey-to-the-moon) | Moon radiation context |

---

## 🤖 AI Use Disclosure

This project was built with **Google Antigravity (AI assistant)**:
- Wrote and debugged all source code
- Fetched and parsed NASA DONKI API responses
- Ran balance simulations and tuned parameters
- Generated all player-facing text (reviewed for grade level)

The **in-game AI coach** (optional, requires Groq API key) rewrites hint text in a friendlier tone. It is clearly labeled in-game and never makes up facts.

---

## 🏆 NASA Space Apps Challenge 2026

**Challenge:** Build a Junior Astronaut Mission Trainer
**Category:** Education / Games
**Target age:** 7–12 years

---

<div align="center">

Made with ☀️ and science by **Hasnain Ali**

*"Space is hard. Decisions matter. Keep your crew alive."*

</div>

