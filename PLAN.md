# Plan — Class Routine Generator

## Goal

Build a class routine generation website for **Cantonment Public School and College, Rangpur** (classes 6–10) with teacher management, class/section setup, auto-generation with constraints, and routine viewing — deployed on Vercel with Supabase PostgreSQL.

---

## Instructions

- Build full-stack with **Next.js 14 App Router**
- Use **supabase-ssr** for database
- UI with **shadcn/ui** + **Tailwind CSS 3** + **Framer Motion** + **React Icons**
- Separate `database/schema.sql` file for Supabase SQL setup
- Generation algorithm: all sections at once, check teacher availability, prefer class teacher in period 1, avoid consecutive periods
- Edit validation checks teacher conflicts and warns on constraint violations
- Pages: Dashboard, Teachers (add/edit with subject assignments + class teacher), Classes & Sections, Generate (with editable table), View (browse by section + teacher search)

---

## Build Notes

- **Build hangs when `react-icons` or `framer-motion` is imported in a Server Component.** Only import these libraries in `"use client"` components.
- **Next.js 14.2.35** works with Node.js 20 (via nvm). Node 18 is incompatible.
- The full interactive pages (`/teachers`, `/classes`, `/generate`, `/view`) are `"use client"` components.

---

## Done

- [x] Migrated from Vite to Next.js 14.2.35 + TypeScript
- [x] Installed all dependencies (shadcn/ui, radix, framer-motion, react-icons, supabase-ssr, cmdk, sonner)
- [x] Created `database/schema.sql` (all tables: classes, sections, subjects, teachers, teacher_subjects, class_teachers, routines) with seed data
- [x] Created `SUPABASE_SETUP.md` guide
- [x] Created `.env.local` with Supabase credentials
- [x] Created utils/supabase/{server,client,middleware}.ts
- [x] Built lib/supabase.ts, lib/db.ts (isConfigured check), lib/types.ts (all types + subject data), lib/generator.ts (generation algorithm), lib/validator.ts (edit validation)
- [x] Built all 13 API routes (teachers, classes, sections, subjects, teacher-subjects, class-teachers, routines, routines/generate, routines/search, routines/[id])
- [x] Built layout with sidebar navigation
- [x] Built all shadcn/ui primitives (button, input, select, dialog, badge, card, table, tabs, popover, command, switch, separator, sonner)
- [x] Built Dashboard page (`/` — server component)
- [x] Built Teachers page (`/teachers` — "use client" with AddTeacherDialog + data table)
- [x] Built Classes & Sections page (`/classes` — "use client" with card grid + section management)
- [x] Built Generate page (`/generate` — "use client" with class selector, tabs per section, RoutineTable)
- [x] Built View page (`/view` — "use client" with section browser + teacher search)
- [x] Built AddTeacherDialog component (categorized subject dropdown, class toggle, section assignment)
- [x] Built RoutineTable component (editable cells with teacher combobox + edit validation)
- [x] Updated `/api/routines` GET to support `class_id` filter
- [x] Build and lint both pass cleanly (17 routes: 4 pages + 13 API routes)

---

## Project Structure

```
Routine/
├── app/
│   ├── layout.tsx              Root layout with sidebar + Toaster
│   ├── page.tsx                Dashboard (server component)
│   ├── globals.css             Tailwind + CSS variables
│   ├── teachers/page.tsx       Teachers manager
│   ├── classes/page.tsx        Classes & sections
│   ├── generate/page.tsx       Routine generation + editing
│   ├── view/page.tsx           Routine viewing + search
│   └── api/
│       ├── teachers/           GET, POST, PUT
│       ├── subjects/           GET
│       ├── classes/            GET, POST
│       ├── sections/           GET, POST, DELETE
│       ├── teacher-subjects/   GET, POST, DELETE
│       ├── class-teachers/     GET, POST
│       └── routines/           GET, POST(generate), search, [id]/PUT
├── components/
│   ├── layout/sidebar.tsx      Sidebar navigation
│   ├── teachers/add-teacher-dialog.tsx
│   ├── generate/routine-table.tsx
│   └── ui/                     shadcn/ui primitives (14 files)
├── lib/
│   ├── supabase.ts             Supabase client
│   ├── db.ts                   DB helpers (isConfigured, getClasses, etc.)
│   ├── types.ts                TypeScript types + subject data
│   ├── generator.ts            Generation algorithm (4 phases)
│   ├── validator.ts            Edit validation
│   └── utils.ts                cn() helper
├── utils/supabase/             SSR client helpers (server, client, middleware)
├── database/schema.sql         Full SQL schema + seed data
├── SUPABASE_SETUP.md           Step-by-step Supabase setup guide
├── PLAN.md                     This file
├── README.md                   Project README
├── .env.local                  Supabase credentials (URL + key)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Generation Algorithm (lib/generator.ts)

1. **Phase 1** — Place class teachers in period 1 (Sunday)
2. **Phase 2** — Greedy fill remaining slots across all sections simultaneously, checking teacher availability and avoiding consecutive periods
3. **Phase 3** — Optimize to reduce consecutive same-teacher periods within a section/day
4. **Phase 4** — Ensure class teachers are in period 1 where possible

## Edit Validation (lib/validator.ts)

- Teacher availability (no double-booking across sections)
- Subject assignment validity
- Consecutive period limits (3+ consecutive periods triggers warning)
- Class teacher preferences (period 1)

---

## Relevant Files

| File | Description |
|------|-------------|
| `app/layout.tsx` | Root layout with sidebar + Toaster |
| `app/page.tsx` | Dashboard (server component, builds fine) |
| `app/teachers/page.tsx` | Teachers page ("use client") |
| `app/classes/page.tsx` | Classes page ("use client") |
| `app/generate/page.tsx` | Generate page ("use client") |
| `app/view/page.tsx` | View page ("use client") |
| `app/api/` | All 13 API route handlers |
| `components/layout/sidebar.tsx` | Sidebar navigation ("use client", imports framer-motion + react-icons) |
| `components/teachers/add-teacher-dialog.tsx` | Teacher add/edit dialog |
| `components/generate/routine-table.tsx` | Editable routine table |
| `components/ui/` | shadcn/ui primitives |
| `lib/supabase.ts` | Supabase client (for API routes) |
| `lib/db.ts` | DB helpers (isConfigured check) |
| `lib/generator.ts` | Generation algorithm |
| `lib/validator.ts` | Edit validation |
| `lib/types.ts` | TypeScript types + subject data |
| `utils/supabase/` | SSR client helpers (server, client, middleware) |
| `database/schema.sql` | Full SQL schema + seed data |
| `SUPABASE_SETUP.md` | Step-by-step Supabase setup guide |
| `package.json` | All deps |
| `next.config.js` | Next.js config |
| `tailwind.config.ts` | Tailwind with shadcn theme |
| `tsconfig.json` | TypeScript config (paths: @/*) |
| `.env.local` | Supabase credentials |
