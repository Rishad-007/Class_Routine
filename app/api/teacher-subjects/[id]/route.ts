import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!isConfigured()) return notConfiguredResponse()
  const { error } = await supabase.from("teacher_subjects").delete().eq("id", params.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
