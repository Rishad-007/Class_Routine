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
