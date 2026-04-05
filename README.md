# Steganography Web App

A modern full-stack steganography application that lets you hide and extract secret messages inside images using **LSB (Least Significant Bit)** encoding.

## Features

- **Hide messages** — Embed text into any image. Visually identical output.
- **Extract messages** — Decode hidden text from steganographic images.
- **Password protection** — Optional AES-256 encryption via a password.
- **History** — All operations are saved per user.
- **AI analysis** — Optional Claude AI image analysis when decoding.
- **Modern UI** — Minimal, warm-toned design inspired by Claude.ai / ChatGPT.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (CSS variables design system) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Image Processing | Sharp |
| Steganography | Custom LSB implementation |
| Auth | JWT + bcrypt |
| AI | Anthropic Claude API (optional) |

## Project Structure

```
Steganography/
├── frontend/          # React + Vite app
│   └── src/
│       ├── pages/     # Route components
│       ├── components/# Reusable UI
│       ├── hooks/     # useAuth, useLocalStorage
│       ├── utils/     # api.ts, formatters, constants
│       └── types/     # TypeScript interfaces
└── backend/           # Express API
    ├── src/
    │   ├── controllers/
    │   ├── services/  # steganography.ts, authService.ts, llmService.ts
    │   ├── routes/
    │   └── middleware/
    └── prisma/        # schema.prisma
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or use a cloud DB)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

npm install

# Push schema to DB and generate client
npx prisma db push

# Start dev server (port 5000)
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start dev server (port 5173)
npm run dev
```

Visit `http://localhost:5173`

### Environment Variables (backend/.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/stego_db
JWT_SECRET=your-strong-secret-at-least-32-chars
PORT=5000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development

# Optional: for AI image analysis
ANTHROPIC_API_KEY=sk-ant-...
```

## How Steganography Works

The app uses **LSB (Least Significant Bit)** steganography:

1. Each pixel has R, G, B channels — each is a byte (0–255)
2. The least significant bit of each channel byte is replaced with 1 bit of the message
3. A 1-bit change per channel is imperceptible to the human eye
4. A 1000×1000 pixel image can hold `1000 × 1000 × 3 / 8 = ~375,000` characters

For **password-protected** messages, AES-256-CBC encryption is applied before embedding.

## API Endpoints

```
POST   /api/auth/signup      Register
POST   /api/auth/signin      Login
GET    /api/auth/me          Get current user

POST   /api/encode           Hide message in image
POST   /api/decode           Extract message from image
POST   /api/analyze-image    AI image analysis (requires Anthropic key)

GET    /api/prompts          Get history
DELETE /api/prompts/:id      Delete entry
```

## Deploying on Vercel (backend + frontend, two projects)

Use **two Vercel projects** with **Root Directory** `backend` and `frontend` respectively.

### Backend (`backend/`)

1. **New Project** → same Git repo → **Root Directory**: `backend`.
2. **Environment variables** (see `backend/.env.example`):
   - `DATABASE_URL` — hosted Postgres (Neon, Supabase, Vercel Postgres, etc.). Use a **pooling** URL if the provider recommends it for serverless.
   - `JWT_SECRET` — strong random string.
   - `NODE_ENV` — `production`.
   - `CORS_ORIGIN` — your frontend URL(s), comma-separated, e.g. `https://my-app.vercel.app`. If omitted, CORS reflects the request origin (fine for quick tests).
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — **strongly recommended** (Vercel has no persistent local disk for uploads).
   - `ANTHROPIC_API_KEY` — optional.
3. Vercel sets `VERCEL=1`; the app writes uploads only under **`/tmp`**, and request body limit is **4 MB** on the API route.
4. `vercel.json` sets **10s** `maxDuration` (Hobby). For large images, use **Vercel Pro** and increase `functions.api/index.ts.maxDuration` (e.g. 60).
5. Smoke test: `https://<backend>.vercel.app/api/health`.

Entry point: `api/index.ts` wraps Express with `serverless-http`; all routes stay under `/api/...`.

### Frontend (`frontend/`)

1. **Root Directory**: `frontend`.
2. **Environment variable**: `VITE_API_URL` = backend origin **without** `/api`, e.g. `https://<backend>.vercel.app`.
3. **`VITE_API_URL` is only read in production builds** (`npm run build` / Vercel). `npm run dev` always proxies `/api` to your local backend—no need to unset anything for local work.

### Why two projects?

The API runs as a **serverless function**; the UI is a **static Vite build**. Splitting avoids mixing build outputs and keeps caching correct.
