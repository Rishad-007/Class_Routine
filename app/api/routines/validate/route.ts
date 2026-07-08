import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"

export async function GET(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  const { searchParams } = new URL(request.url)
  const classId = searchParams.get("class_id")
  if (!classId) return Response.json({ error: "class_id is required" }, { status: 400 })

  const { data: sections } = await supabase
    .from("sections")
    .select("id, name")
    .eq("class_id", classId)
  if (!sections || sections.length === 0) return Response.json({ conflicts: {} })

  const sectionIds = sections.map(s => s.id)

  const { data: routines } = await supabase
    .from("routines")
    .select("*, teachers!inner(*), subjects!inner(*), sections!inner(*)")
    .in("section_id", sectionIds)

  if (!routines) return Response.json({ conflicts: {} })

  const conflicts: Record<string, string[]> = {}
  const sectionsMap: Record<number, string> = {}
  for (const s of sections) sectionsMap[s.id] = s.name

  for (const r of routines) {
    const key = `${r.section_id}:${r.day_of_week}:${r.period_number}`

    // Check 1: Same teacher at same day/period in different sections
    const sameSlotOthers = routines.filter(
      (o: any) =>
        o.id !== r.id &&
        o.teacher_id === r.teacher_id &&
        o.day_of_week === r.day_of_week &&
        o.period_number === r.period_number
    )

    if (sameSlotOthers.length > 0) {
      const otherNames = sameSlotOthers
        .map((o: any) => `Section ${sectionsMap[o.section_id] || "?"}`)
        .join(", ")
      if (!conflicts[key]) conflicts[key] = []
      conflicts[key].push(
        `⚠ ${r.teachers?.name} also in ${otherNames}`
      )
    }

    // Check 2: Same teacher on consecutive periods in same section
    const nextPeriod = routines.find(
      (o: any) =>
        o.id !== r.id &&
        o.section_id === r.section_id &&
        o.teacher_id === r.teacher_id &&
        o.day_of_week === r.day_of_week &&
        o.period_number === r.period_number + 1
    )

    if (nextPeriod) {
      if (!conflicts[key]) conflicts[key] = []
      conflicts[key].push(
        `⚠ ${r.teachers?.name} has consecutive periods ${r.period_number}-${r.period_number + 1}`
      )
    }
  }

  return Response.json({ conflicts })
}
