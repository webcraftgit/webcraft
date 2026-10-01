# Weturn

Premium marketing site. Next.js App Router · TypeScript · Tailwind · GSAP · Framer Motion · React Three Fiber · Lenis · Supabase.

**Live preview:** [webcraft-git-main-listyfi.vercel.app](https://webcraft-git-main-listyfi.vercel.app)

## Status

Built and live: the marketing site (PL/EN), the contact form with a Supabase backend, the /admin dashboard, consent-based analytics and the client portal (questionnaire and uploads). Portal phase 2 (clock, checkpoints, revision rounds, email) is built; see `docs/PORTAL_PLAN.md` for how to switch it on.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Node 18.18+ required.

The Supabase backend, consent tracking and /admin dashboard shipped in CP6 — see `docs/SETUP.md` for the runbook and `.env.example` for the required vars. The marketing pages render without them; the contact form falls back to mailto.

## Assets

`/public/models` (Draco GLB) + `/public/textures` (WebP) belong to the Blackwood
showcase demo. `/public/draco` is the self-hosted decoder — required, see
`docs/BLACKWOOD_ASSETS.md`. Source `.blend` files are NOT in the repo.

## Project map

See `PROJECT_STATE.md` for all design/architecture decisions and checkpoint status.
