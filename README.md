# Code Port

Code Port is a modern resume builder that turns a guided AI interview into:

- a live-updating resume preview
- a downloadable server-generated PDF
- an animated 3D portfolio website

## Stack

- Next.js App Router
- Framer Motion
- React Three Fiber
- GROQ API
- Supabase
- React PDF

## Environment

Copy `.env.example` into `.env.local` and set:

```bash
GROQ_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`GROQ_API_KEY` powers the AI interview. If it is missing, Code Port falls back to a deterministic local interview flow for development.

## Supabase

Run `supabase/schema.sql` in your Supabase SQL editor.

## Development

```bash
npm install
npm run dev
```
