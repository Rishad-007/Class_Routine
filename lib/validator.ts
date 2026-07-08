import { supabase } from "./supabase"
import type { Routine } from "./types"

/**
 * Validate an edit to a routine entry.
 * Returns a list of warning messages. If empty, edit is clean.
 */
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

  // 4. Check if teacher is a class teacher and this is period 1 (preferred)
  const { data: classTeacher } = await supabase
    .from("class_teachers")
    .select("*, sections!inner(*)")
    .eq("teacher_id", newTeacherId)
    .single()

  if (classTeacher && current.period_number === 1) {
    // Good - class teacher in period 1. No warning needed.
  }

  return warnings
}
