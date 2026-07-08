import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"

export async function GET(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  const { searchParams } = new URL(request.url)
  const teacherId = searchParams.get("teacher_id")
  let query = supabase.from("teacher_subjects").select("*, subjects(*), teachers(*), classes(*)")
  if (teacherId) query = query.eq("teacher_id", teacherId)
  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  const body = await request.json()
  const { data, error } = await supabase.from("teacher_subjects").insert(body).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
