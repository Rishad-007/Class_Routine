import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"

export async function GET() {
  if (!isConfigured()) return notConfiguredResponse()
  const { data, error } = await supabase.from("sections").select("*").order("name")
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  const body = await request.json()
  const { data, error } = await supabase.from("sections").insert(body).select().single()
  if (error && error.code === "23505") return Response.json({ error: "Section already exists" }, { status: 409 })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return Response.json({ error: "Section ID required" }, { status: 400 })
  const { error } = await supabase.from("sections").delete().eq("id", id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
