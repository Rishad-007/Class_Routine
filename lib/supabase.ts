import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
