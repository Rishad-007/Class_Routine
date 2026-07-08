# Routine Generator

Class routine generation system for **Cantonment Public School and College, Rangpur** (Classes 6–10). Built with Next.js 14, Supabase, shadcn/ui, and TypeScript.

## Stack

| Tool | Purpose |
|------|---------|
| Next.js 14 | React framework (App Router) |
| TypeScript | Type safety |
| Supabase | PostgreSQL database + SSR auth |
| Tailwind CSS 3 | Utility-first styling |
| shadcn/ui | UI primitives (Radix-based) |
| Framer Motion | Animations |
| React Icons | Icon library |

## Getting Started

### Prerequisites

- Node.js 20+ (use `nvm use 20`)
- Supabase project (free tier)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase**
   Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

3. **Set up the database**
   Open your Supabase project's SQL Editor and run the contents of `database/schema.sql`.
   See `SUPABASE_SETUP.md` for detailed instructions.

4. **Run development server**
   ```bash
   nvm use 20 && npm run dev
   ```
   Opens at [http://localhost:3000](http://localhost:3000).

### Build

```bash
nvm use 20 && npm run build
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats and quick actions |
| `/teachers` | Add/edit teachers with subject assignments + class teacher |
| `/classes` | Manage classes (6–10) and their sections |
| `/generate` | Select class → generate routine → edit per-section |
| `/view` | Browse routines by section or search by teacher |

## API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/teachers` | GET, POST | List / create teachers |
| `/api/teachers/[id]` | PUT | Update teacher |
| `/api/subjects` | GET | List subjects |
| `/api/classes` | GET, POST | List / create classes |
| `/api/sections` | GET, POST, DELETE | Manage sections |
| `/api/teacher-subjects` | GET, POST | Teacher subject assignments |
| `/api/teacher-subjects/[id]` | DELETE | Remove assignment |
| `/api/class-teachers` | GET, POST | Class teacher assignments |
| `/api/routines` | GET (by section or class) | Fetch routines |
| `/api/routines/generate` | POST | Auto-generate routines for a class |
| `/api/routines/search` | GET | Search routines by teacher name/ID |
| `/api/routines/[id]` | PUT | Edit a routine slot (with validation) |

## Generation Algorithm

The generator (`lib/generator.ts`) works in phases:

1. **Phase 1** — Place class teachers in period 1 (Sunday)
2. **Phase 2** — Greedy fill remaining slots across all sections simultaneously, checking teacher availability and avoiding consecutive periods
3. **Phase 3** — Optimize to reduce consecutive same-teacher periods
4. **Phase 4** — Ensure class teachers are in period 1 where possible

Edit validation (`lib/validator.ts`) checks:
- Teacher availability (no double-booking)
- Subject assignment validity
- Consecutive period limits
- Class teacher preferences

## Project Structure

```
app/
  layout.tsx          Root layout with sidebar + Toaster
  page.tsx            Dashboard
  teachers/page.tsx   Teachers manager
  classes/page.tsx    Classes & sections
  generate/page.tsx   Routine generation + editing
  view/page.tsx       Routine viewing + search
  api/                All API route handlers
components/
  layout/sidebar.tsx  Sidebar navigation
  teachers/           Teacher dialog components
  generate/           Routine table component
  ui/                 shadcn/ui primitives
lib/
  supabase.ts         Supabase client
  db.ts               DB helpers
  types.ts            TypeScript types + subject data
  generator.ts        Generation algorithm
  validator.ts        Edit validation
database/
  schema.sql          Full SQL schema + seed data
```
