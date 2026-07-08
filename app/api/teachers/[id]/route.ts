import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!isConfigured()) return notConfiguredResponse()
  const body = await request.json()
  const { data, error } = await supabase.from("teachers").update(body).eq("id", params.id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!isConfigured()) return notConfiguredResponse()
  const { error } = await supabase.from("teachers").delete().eq("id", params.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
