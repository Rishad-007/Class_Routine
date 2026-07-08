import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"
import { validateEdit } from "@/lib/validator"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!isConfigured()) return notConfiguredResponse()
  const body = await request.json()
  const { teacher_id, subject_id } = body
  const { data: current } = await supabase.from("routines").select("*").eq("id", params.id).single()
  if (!current) return Response.json({ error: "Routine entry not found" }, { status: 404 })
  const warnings = await validateEdit(current, teacher_id, subject_id)
  const { data, error } = await supabase
    .from("routines").update({ teacher_id, subject_id, is_class_teacher_period: body.is_class_teacher_period || false, updated_at: new Date().toISOString() })
    .eq("id", params.id).select("*, teachers(*), subjects(*)").single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ routine: data, warnings })
}
