import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"

export async function GET() {
  if (!isConfigured()) return notConfiguredResponse()
  const { data, error } = await supabase.from("class_teachers").select("*, teachers(*), sections(*, classes(*))")
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  const body = await request.json()
  const { data, error } = await supabase.from("class_teachers").insert(body).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return Response.json({ error: "ID required" }, { status: 400 })
  const { error } = await supabase.from("class_teachers").delete().eq("id", id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
