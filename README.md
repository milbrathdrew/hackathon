# Hackathon Starter

Next.js + TypeScript + Tailwind CSS + Supabase starter template.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend / DB / Auth:** Supabase

## Getting Started

1. Copy the env example and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-key>
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
├── app/              # App Router pages and layouts
├── lib/
│   └── supabase/
│       ├── client.ts # Browser-side Supabase client
│       └── server.ts # Server-side Supabase client
└── middleware.ts     # Auth session refresh
```

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```
