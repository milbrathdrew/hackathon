# Hackathon Project

Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Supabase starter template.

## Project Structure

```
hackathon/
├── src/
│   ├── app/            # App Router pages and layouts
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts   # Browser-side Supabase client
│   │       └── server.ts   # Server-side Supabase client
│   └── middleware.ts   # Auth session refresh middleware
├── .env.local          # Local env vars (gitignored)
├── .env.example        # Env var template
└── .claude/            # Claude Code settings
```

## Dev Commands

All commands run from the project root:

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-key>
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Language:** TypeScript 5
- **Backend/Auth/DB:** Supabase (`@supabase/ssr` + `@supabase/supabase-js`)
- **Linting:** ESLint 9

## Conventions

- Use App Router (`src/app/`) — no Pages Router
- Use `@/*` import alias for `src/`
- Server components by default; add `"use client"` only when needed
- Supabase server client (`src/lib/supabase/server.ts`) for Server Components and Route Handlers
- Supabase browser client (`src/lib/supabase/client.ts`) for Client Components
- Auth session is refreshed automatically via `middleware.ts`

## Design Context

### Users
General consumers — everyday people holding any type of insurance policy (health, auto, home, renters, life, etc.) who need help cutting through the legal language. The analyzer handles any insurance PDF — Claude infers the policy type from the document. Often mildly anxious, not financially sophisticated. They want plain answers fast, no condescension.

### Brand Personality
Trustworthy. Precise. Calm. Feels like a knowledgeable friend who read the whole document so you don't have to.

### Aesthetic Direction
Minimal & focused. Warm off-white background, near-black text, deep forest green accent (`oklch(38% 0.13 155)` light / `oklch(62% 0.14 155)` dark). Fraunces variable serif for headings, DM Sans for body. Clean editorial — well-designed reference material, not a SaaS dashboard. Light/dark system preference.

Anti-references: No cyan-on-dark AI aesthetic. No colored emoji cards. No glassmorphism. No modals.

### Design Principles
1. **Clarity first** — readable over visually interesting
2. **Trust through restraint** — fewer colors, less noise; confidence from precision
3. **Document-native** — appropriate for reading text, not filing support tickets
4. **Responsive without amputating** — chat stacks below on mobile, all functionality stays
5. **Purposeful motion** — one smooth entrance on results reveal; nothing decorative
6. **Accessible by default** — WCAG 2.1 AA: sufficient contrast, full keyboard nav, meaningful focus indicators, screen-reader-compatible markup

## Skills Available

This project has Claude Code skills installed in `.claude/skills/`:

- **remotion-best-practices** — Remotion video creation in React
- **impeccable suite** — `/adapt`, `/animate`, `/audit`, `/clarify`, `/colorize`, `/critique`, `/delight`, `/distill`, `/extract`, `/frontend-design`, `/harden`, `/normalize`, `/onboard`, `/optimize`, `/polish`, `/quieter`
