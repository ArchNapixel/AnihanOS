# AnihanOS

Sugarcane farm management platform for Filipino smallholder farmers — crop cycles, inputs, and land in one system.

## Structure

- `client/` — React + TypeScript + Vite frontend
- `server/` — Express + TypeScript backend
- `shared/types/` — Supabase-generated TypeScript types, shared by client and server
- `supabase/migrations/` — SQL migrations (source of truth for schema, applied manually via the Supabase SQL Editor)

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase project credentials.
2. Install dependencies from the repo root: `npm install` (workspaces cover `client` and `server`).
3. Run the frontend: `npm run dev:client`
4. Run the backend: `npm run dev:server`

## Database

Schema changes are proposed as SQL, reviewed, and run manually in the Supabase SQL Editor — nothing in this repo executes DDL automatically. Once a migration is applied, regenerate types:

```
supabase gen types typescript --project-id <your-project-id> --schema public > shared/types/database.types.ts
```
