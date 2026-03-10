# Infinite Pokemon

An AI-powered creature battle game where every creature is unique. Describe a creature, pick its types, and Claude generates its stats, moves, and an original SVG sprite — then battle it against a friend.

## Features

- **AI Creature Generation** — Describe any creature and get a fully playable character with balanced stats, 4 themed moves, and an AI-generated SVG sprite
- **Turn-Based Battles** — 2-player battles with type effectiveness, STAB, status effects, and animated move visuals
- **21 Types** — 18 classic types plus Cosmic, Sound, and Digital, with a full effectiveness chart
- **Pokedex** — Save creatures, track win/loss records, and browse your collection
- **Evolution** — Creatures evolve after winning enough battles, generating upgraded forms with new stats and sprites
- **Sound Effects** — Synthesized retro sound effects for hits, victories, move selection, and more (Web Audio API, no files needed)

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Zustand, Framer Motion |
| Backend | FastAPI, Pydantic, Uvicorn |
| AI | Claude Sonnet 4 (creature data), Claude Opus 4 (SVG sprites) |
| Database | SQLite |

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Install

```bash
# Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Configure

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=your-key-here
```

### Run

Start both servers:

```bash
# Terminal 1 — Backend (port 8000)
uvicorn server.app:app --reload --port 8000

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to play.

## How It Works

### Creature Generation

Players provide a text description and select 1–2 types. Claude generates the creature data (stats, moves) and an SVG sprite in parallel. Stats are balanced to a budget of 600 points, and each move is constrained by a power budget to keep battles fair.

### Battle System

- Speed determines turn order
- Damage formula accounts for attack/defense, type effectiveness, and STAB (1.5x for same-type moves)
- Status effects: burn, paralyze, freeze, poison, sleep, confuse, scared (Ghost/Cosmic-type)
- Stat stage modifiers (-6 to +6) from status moves
- Move animations are type-specific with particle effects

### Evolution

After a creature wins enough battles, it becomes eligible to evolve. Claude generates an evolved form that keeps the creature's identity but upgrades its stats, moves, and sprite.

## Project Structure

```
├── server/          # FastAPI app, routes, database, models
├── core/            # Battle engine, type chart, stat/move validation
├── generation/      # Claude integration, prompts, response validation
├── frontend/        # React app
│   └── src/
│       ├── pages/       # Main menu, creation, battle, pokedex screens
│       ├── components/  # UI components (battle, creatures, shared)
│       ├── store/       # Zustand state management
│       ├── audio/       # Synthesized sound effects (Web Audio API)
│       └── api/         # Backend API client
├── data/            # SQLite database
└── config.py        # Game constants (stat budgets, type list, etc.)
```
