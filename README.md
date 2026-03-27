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
