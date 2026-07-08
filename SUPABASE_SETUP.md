# Supabase Setup Guide

Follow these steps to set up the database for the Routine Generation System.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New project**.
3. Fill in:
   - **Name**: `routine-generator` (or any name you prefer)
   - **Database Password**: Create a strong password and save it.
   - **Region**: Choose the closest region (e.g., Singapore for Bangladesh).
4. Click **Create new project** and wait for the database to provision (~1-2 minutes).

## Step 2: Run the Schema

1. In your Supabase project dashboard, go to the **SQL Editor** tab (left sidebar).
2. Click **New query**.
3. Open the file `database/schema.sql` from this project.
4. Copy the entire contents and paste into the SQL Editor.
5. Click **Run** (or press Cmd+Enter).
6. Verify all tables are created by going to the **Table Editor** tab — you should see:
   - `classes`
   - `sections`
   - `subjects`
   - `teachers`
   - `teacher_subjects`
   - `class_teachers`
   - `routines`

## Step 3: Get Connection Credentials

1. Go to **Project Settings** → **API** (in the left sidebar).
2. Under **Project URL**, copy the **URL**.
3. Under **Project API keys**, copy the **anon public** key.

## Step 4: Configure the App

1. In the project root directory, create a file called `.env.local`:

```bash
touch .env.local
```

2. Add the following to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

Replace `your-project-id` and `your-anon-key-here` with the values from Step 3.

## Step 5: Verify Connection

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If the app loads without errors, the database connection is working.

## Step 6: Add Initial Data

You can add data through the app's UI:
1. Go to **Teachers** page → add teachers.
2. Go to **Classes** page → add sections to each class.
3. Go to **Teachers** page → assign subjects and class loads to each teacher.

Or you can run additional SQL in the Supabase SQL Editor if you have bulk data.

## Troubleshooting

- **"relation does not exist" error**: Make sure you ran the entire `schema.sql` file.
- **CORS errors**: In Supabase dashboard, go to **Project Settings** → **API** → check that your app URL is in the allowed domains (add `http://localhost:3000` for development).
- **Row Level Security (RLS)**: This app uses the anon key. By default, Supabase enables RLS. If you get permission errors, go to the **SQL Editor** and run:

```sql
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (since auth is skipped)
CREATE POLICY "Allow all" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON teacher_subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON class_teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON routines FOR ALL USING (true) WITH CHECK (true);
```
