import { supabase } from "./supabase"
import type { Routine } from "./types"

export async function validateEdit(
  current: Routine,
  newTeacherId: number,
  newSubjectId: number
): Promise<string[]> {
  const warnings: string[] = []

  // 1. Check if teacher is busy at this day/period in another section
  const { data: conflictingRoutines } = await supabase
    .from("routines")
    .select("*, sections!inner(*, classes!inner(*))")
    .eq("teacher_id", newTeacherId)
    .eq("day_of_week", current.day_of_week)
    .eq("period_number", current.period_number)
    .neq("id", current.id)

  if (conflictingRoutines && conflictingRoutines.length > 0) {
    const conflict = conflictingRoutines[0] as any
    const sectionName = conflict.sections?.name || "Unknown"
    const className = conflict.sections?.classes?.display_name || "Unknown"
    warnings.push(
      `Teacher is already assigned to ${className} - Section ${sectionName} on this day and period.`
    )
  }

  // 2. Check if teacher is assigned to teach this subject for this class
  const { data: teacherSubjects } = await supabase
    .from("teacher_subjects")
    .select("*")
    .eq("teacher_id", newTeacherId)
    .eq("subject_id", newSubjectId)

  if (!teacherSubjects || teacherSubjects.length === 0) {
    warnings.push(
      "Teacher is not assigned to teach this subject. The subject will be changed."
    )
  }

  // 3. Check if this creates 2+ consecutive classes for the teacher on the same day
  const { data: sameDayRoutines } = await supabase
    .from("routines")
    .select("*")
    .eq("teacher_id", newTeacherId)
    .eq("day_of_week", current.day_of_week)
    .neq("id", current.id)
    .order("period_number")

  if (sameDayRoutines) {
    const periods = sameDayRoutines.map(r => r.period_number).concat([current.period_number]).sort((a, b) => a - b)

    let consecutiveCount = 1
    for (let i = 1; i < periods.length; i++) {
      if (periods[i] === periods[i - 1] + 1) {
        consecutiveCount++
        if (consecutiveCount >= 2) {
          warnings.push("Warning: This creates 3 consecutive periods for the teacher on the same day.")
          break
        }
      } else {
        consecutiveCount = 1
      }
    }
  }

  // 4. Check if teacher exceeds max_per_day
  const { data: teacher } = await supabase
    .from("teachers")
    .select("max_per_day")
    .eq("id", newTeacherId)
    .single()

  if (teacher) {
    const maxDay = teacher.max_per_day ?? 5
    // Count periods already assigned on this day (excluding current entry if it's being reassigned)
    const dayCount = (sameDayRoutines?.length || 0) + 1
    if (dayCount > maxDay) {
      warnings.push(
        `Warning: This assigns ${dayCount} periods on this day, exceeding the max of ${maxDay}.`
      )
    }
  }

  return warnings
}

export async function validateSwap(
  entry1: Routine,
  entry2: Routine
): Promise<string[]> {
  const warnings: string[] = []

  const t1Id = entry1.teacher_id
  const t2Id = entry2.teacher_id

  if (t1Id === t2Id) {
    warnings.push("Both slots belong to the same teacher. Nothing to swap.")
    return warnings
  }

  // Check if teacher1 is busy at entry2's slot (excluding entry2 itself)
  const { data: t1Conflict } = await supabase
    .from("routines")
    .select("id")
    .eq("teacher_id", t1Id)
    .eq("day_of_week", entry2.day_of_week)
    .eq("period_number", entry2.period_number)
    .neq("id", entry2.id)
    .limit(1)

  if (t1Conflict && t1Conflict.length > 0) {
    warnings.push(`${entry1.teachers?.name || "Teacher"} is already assigned to another section at ${entry2.day_of_week === 0 ? "Sunday" : entry2.day_of_week === 1 ? "Monday" : entry2.day_of_week === 2 ? "Tuesday" : entry2.day_of_week === 3 ? "Wednesday" : "Thursday"} Period ${entry2.period_number}.`)
  }

  // Check if teacher2 is busy at entry1's slot (excluding entry1 itself)
  const { data: t2Conflict } = await supabase
    .from("routines")
    .select("id")
    .eq("teacher_id", t2Id)
    .eq("day_of_week", entry1.day_of_week)
    .eq("period_number", entry1.period_number)
    .neq("id", entry1.id)
    .limit(1)

  if (t2Conflict && t2Conflict.length > 0) {
    warnings.push(`${entry2.teachers?.name || "Teacher"} is already assigned to another section at ${entry1.day_of_week === 0 ? "Sunday" : entry1.day_of_week === 1 ? "Monday" : entry1.day_of_week === 2 ? "Tuesday" : entry1.day_of_week === 3 ? "Wednesday" : "Thursday"} Period ${entry1.period_number}.`)
  }

  // Check max_per_day for both teachers after swap
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name, max_per_day")
    .in("id", [t1Id, t2Id])

  const teacherMap: Record<number, { name: string; max_per_day: number }> = {}
  if (teachers) {
    for (const t of teachers) {
      teacherMap[t.id] = { name: t.name, max_per_day: t.max_per_day ?? 5 }
    }
  }

  // For each teacher, check count on each day after swap
  // Teacher 1 loses entry1's day/period and gains entry2's day/period
  // Teacher 2 loses entry2's day/period and gains entry1's day/period
  const { data: t1Routines } = await supabase
    .from("routines")
    .select("day_of_week")
    .eq("teacher_id", t1Id)
    .neq("id", entry1.id)

  const { data: t2Routines } = await supabase
    .from("routines")
    .select("day_of_week")
    .eq("teacher_id", t2Id)
    .neq("id", entry2.id)

  const countDays = (routines: { day_of_week: number }[] | null, addDay: number, removeDay: number) => {
    const counts: Record<number, number> = {}
    if (routines) {
      for (const r of routines) {
        counts[r.day_of_week] = (counts[r.day_of_week] || 0) + 1
      }
    }
    counts[addDay] = (counts[addDay] || 0) + 1
    counts[removeDay] = Math.max(0, (counts[removeDay] || 0) - 1)
    return counts
  }

  const t1DayCounts = countDays(t1Routines, entry2.day_of_week, entry1.day_of_week)
  const t2DayCounts = countDays(t2Routines, entry1.day_of_week, entry2.day_of_week)

  const t1Max = teacherMap[t1Id]?.max_per_day ?? 5
  const t2Max = teacherMap[t2Id]?.max_per_day ?? 5

  for (const [day, count] of Object.entries(t1DayCounts)) {
    if (count > t1Max) {
      warnings.push(`${teacherMap[t1Id]?.name || "Teacher"} would have ${count} periods on ${day === "0" ? "Sunday" : day === "1" ? "Monday" : day === "2" ? "Tuesday" : day === "3" ? "Wednesday" : "Thursday"} after swap, exceeding max of ${t1Max}.`)
    }
  }

  for (const [day, count] of Object.entries(t2DayCounts)) {
    if (count > t2Max) {
      warnings.push(`${teacherMap[t2Id]?.name || "Teacher"} would have ${count} periods on ${day === "0" ? "Sunday" : day === "1" ? "Monday" : day === "2" ? "Tuesday" : day === "3" ? "Wednesday" : "Thursday"} after swap, exceeding max of ${t2Max}.`)
    }
  }

  return warnings
}
