import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"

export async function GET(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  const { searchParams } = new URL(request.url)
  const sectionId = searchParams.get("section_id")
  const classId = searchParams.get("class_id")
  let query = supabase.from("routines").select("*, teachers(*), subjects(*)").order("day_of_week").order("period_number")
  if (sectionId) query = query.eq("section_id", sectionId)
  if (classId) {
    const { data: sections } = await supabase.from("sections").select("id").eq("class_id", classId)
    if (sections && sections.length > 0) {
      query = query.in("section_id", sections.map(s => s.id))
    }
  }
  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ routines: data || [] })
}

export async function POST(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  try {
    const body = await request.json()
    const { section_id, day_of_week, period_number, teacher_id } = body
    if (!section_id || day_of_week === undefined || !period_number || !teacher_id) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Auto-detect subject from teacher_subjects for this section's class
    const { data: sec } = await supabase.from("sections").select("class_id").eq("id", section_id).single()
    let subjectId = body.subject_id
    if (!subjectId && sec) {
      const { data: ts } = await supabase
        .from("teacher_subjects")
        .select("subject_id")
        .eq("teacher_id", teacher_id)
        .eq("class_id", sec.class_id)
        .limit(1)
      if (ts && ts.length > 0) subjectId = ts[0].subject_id
    }
    if (!subjectId) {
      return Response.json({ error: "Teacher has no subjects assigned for this class" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("routines")
      .insert({
        section_id,
        day_of_week,
        period_number,
        teacher_id,
        subject_id: subjectId,
        is_class_teacher_period: false,
      })
      .select("*, teachers(*), subjects(*)")
      .single()

    if (error) {
      if (error.code === "23505") {
        return Response.json({ error: "Slot already occupied" }, { status: 409 })
      }
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ routine: data }, { status: 201 })
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to create routine" }, { status: 500 })
  }
}
