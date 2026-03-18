# Legible

Insurance policy analyzer. Upload any insurance PDF — Claude reads it and returns a plain-English summary with a Q&A chat interface.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`)

## Getting Started

1. Copy the env example and fill in your Anthropic API key:

```bash
cp .env.example .env.local
```

```env
ANTHROPIC_API_KEY=<your-api-key>
```

2. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
└── app/
    ├── api/
    │   ├── analyze/route.ts   # PDF → Claude → structured summary
    │   └── chat/route.ts      # Context-grounded Q&A
    ├── globals.css
    ├── layout.tsx
    └── page.tsx               # Single-page client component
```

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```
