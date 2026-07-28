# بيتك (Beitak) — Egyptian Multi-Vendor Marketplace

An Arabic-language multi-vendor marketplace platform for furniture, appliances, electronics, cars, and real estate. Built with React 19, TanStack Router/Start (SSR), Tailwind CSS v4, and Supabase.

## How to run

```
npm run dev
```

The dev server starts on **port 5000** (`0.0.0.0:5000`). The workflow "Start application" handles this automatically.

## Stack

- **Frontend**: React 19, TanStack Router (file-based), TanStack Start (SSR)
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI primitives)
- **Backend/DB**: Supabase (PostgreSQL + Auth). Falls back to a `localStorage`-based virtual DB when Supabase credentials are absent.
- **Build**: Vite 8 via `@lovable.dev/vite-tanstack-config`

## Environment variables

Non-secret values are set in the Replit shared environment:
- `SUPABASE_URL` / `VITE_SUPABASE_URL` — Supabase project URL
- `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` — project ID

To connect to the live Supabase database, add this secret:
- `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` — anon/publishable key from your Supabase project settings

Without the key the app runs in **virtual mock mode** (localStorage), which is functional for development and testing.

## Key directories

- `src/routes/` — file-based pages (index, admin, auth, products, checkout, …)
- `src/components/` — shared UI components
- `src/integrations/supabase/` — Supabase client with virtual-DB fallback
- `src/hooks/` — custom React hooks
- `supabase/migrations/` — SQL schema migrations

## User preferences

- Keep the project's existing Arabic RTL structure and file layout.
- Do not restructure or migrate away from TanStack Start/Router.
