import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"

export async function GET(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  if (!q) return Response.json({ error: "Search query required" }, { status: 400 })
  const { data: teachers } = await supabase.from("teachers").select("*").or(`name.ilike.%${q}%,teacher_id.ilike.%${q}%`).limit(10)
  if (!teachers || teachers.length === 0) return Response.json({ routines: [], teachers: [] })
  const teacherIds = teachers.map((t: any) => t.id)
  const { data: routines } = await supabase
    .from("routines").select("*, teachers(*), subjects(*), sections!inner(*, classes!inner(*))")
    .in("teacher_id", teacherIds).order("teacher_id").order("day_of_week").order("period_number")
  return Response.json({ routines: routines || [], teachers })
}
