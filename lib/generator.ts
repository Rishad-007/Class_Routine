import { supabase } from "./supabase"
import type { Routine } from "./types"

type TeacherBusy = Record<number, Record<number, Record<number, boolean>>>
type TeacherRemaining = Record<number, Record<number, number>>
type RoutineGrid = Record<number, Record<number, Record<number, { teacher_id: number; subject_id: number; is_ct: boolean } | null>>>

const DAYS = [0, 1, 2, 3, 4] // Sun-Thu
const CLASS_NAMES = ["Six", "Seven", "Eight", "Nine", "Ten"]

export async function generateRoutine(classId: number) {
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .single()
  if (classError || !classData) throw new Error("Class not found")

  const periodsCount = classData.periods_count
  const className = classData.name
  const classNum = CLASS_NAMES.indexOf(className) + 6

  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .eq("class_id", classId)
    .order("name")
  if (!sections || sections.length === 0) throw new Error("No sections found for this class")

  const { data: allTeacherSubjects } = await supabase
    .from("teacher_subjects")
    .select("*, subjects!inner(*)")
    .eq("class_id", classId)

  const { data: classTeachers } = await supabase
    .from("class_teachers")
    .select("*, teachers(*)")
    .in("section_id", sections.map(s => s.id))

  const ctMap: Record<number, number> = {}
  if (classTeachers) {
    for (const ct of classTeachers) {
      ctMap[ct.section_id] = ct.teacher_id
    }
  }

  const teacherRemaining: TeacherRemaining = {}
  const subjectTeacherMap: Record<number, { teacher_id: number; load: number }[]> = {}

  if (allTeacherSubjects) {
    for (const ts of allTeacherSubjects) {
      if (!teacherRemaining[ts.teacher_id]) teacherRemaining[ts.teacher_id] = {}
      teacherRemaining[ts.teacher_id][ts.subject_id] = ts.class_load
      if (!subjectTeacherMap[ts.subject_id]) subjectTeacherMap[ts.subject_id] = []
      subjectTeacherMap[ts.subject_id].push({ teacher_id: ts.teacher_id, load: ts.class_load })
    }
  }

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .or(`applicable_classes.is.null,applicable_classes.cs.{${classNum}}`)

  const subjectIds = new Set((subjects || []).map(s => s.id))

  for (const tid of Object.keys(teacherRemaining)) {
    const tidNum = parseInt(tid)
    for (const sid of Object.keys(teacherRemaining[tidNum])) {
      const sidNum = parseInt(sid)
      if (!subjectIds.has(sidNum)) {
        delete teacherRemaining[tidNum][sidNum]
      }
    }
  }

  const teacherBusy: TeacherBusy = {}
  const routineGrid: RoutineGrid = {}
  const sectionDayTeachers: Record<number, Record<number, Set<number>>> = {}

  for (const section of sections) {
    routineGrid[section.id] = {}
    sectionDayTeachers[section.id] = {}
    for (const day of DAYS) {
      routineGrid[section.id][day] = {}
      sectionDayTeachers[section.id][day] = new Set()
      for (let period = 1; period <= periodsCount; period++) {
        routineGrid[section.id][day][period] = null
      }
    }
  }

  const activeTeacherIds = Object.entries(teacherRemaining)
    .filter(([_, subjects]) => Object.values(subjects).some(v => v > 0))
    .map(([id]) => parseInt(id))

  const { data: existingRoutines } = await supabase
    .from("routines")
    .select("teacher_id, day_of_week, period_number")
    .in("teacher_id", activeTeacherIds)

  const MAX_PERIODS = 8
  const BREAK_PERIOD = 5
  for (const tid of activeTeacherIds) {
    teacherBusy[tid] = {}
    for (const day of DAYS) {
      teacherBusy[tid][day] = {}
      for (let period = 1; period <= MAX_PERIODS; period++) {
        teacherBusy[tid][day][period] = false
      }
    }
  }

  if (existingRoutines) {
    for (const r of existingRoutines) {
      if (teacherBusy[r.teacher_id]?.[r.day_of_week]?.[r.period_number] !== undefined) {
        teacherBusy[r.teacher_id][r.day_of_week][r.period_number] = true
      }
    }
  }

  // Three-tier candidate search:
  // strict (no same-day in section, no consecutive)
  // relaxed (allow same-day but no consecutive)
  // fallback (allow both)
  function findCandidates(
    sectionId: number, day: number, period: number,
    avoidTeacherId?: number, allowSameDay?: boolean
  ) {
    const candidates: { teacher_id: number; subject_id: number; is_ct: boolean }[] = []
    const sectionClassTeacherId = ctMap[sectionId]
    const dayUsedTeachers = sectionDayTeachers[sectionId]?.[day]

    for (const tid of activeTeacherIds) {
      if (teacherBusy[tid]?.[day]?.[period]) continue

      if (!allowSameDay && dayUsedTeachers?.has(tid)) continue

      if (avoidTeacherId !== undefined && tid === avoidTeacherId) continue

      const remaining = teacherRemaining[tid]
      if (!remaining) continue

      const positiveSubjects = Object.entries(remaining).filter(([_, load]) => load > 0)
      if (positiveSubjects.length === 0) continue

      for (const [sidStr] of positiveSubjects) {
        const sid = parseInt(sidStr)
        candidates.push({
          teacher_id: tid,
          subject_id: sid,
          is_ct: tid === sectionClassTeacherId,
        })
      }
    }

    return candidates
  }

  function assignSlot(sectionId: number, day: number, period: number, assignment: { teacher_id: number; subject_id: number; is_ct: boolean }) {
    routineGrid[sectionId][day][period] = {
      teacher_id: assignment.teacher_id,
      subject_id: assignment.subject_id,
      is_ct: assignment.is_ct,
    }
    teacherBusy[assignment.teacher_id][day][period] = true
    sectionDayTeachers[sectionId][day].add(assignment.teacher_id)
    teacherRemaining[assignment.teacher_id][assignment.subject_id]--
    if (teacherRemaining[assignment.teacher_id][assignment.subject_id] <= 0) {
      delete teacherRemaining[assignment.teacher_id][assignment.subject_id]
    }
  }

  function pickBestCandidate(
    candidates: { teacher_id: number; subject_id: number; is_ct: boolean }[],
    period: number,
    sectionId: number
  ) {
    const scored = candidates.map((c) => {
      let score = 0
      if (period === 1 && c.is_ct) score += 100
      score += teacherRemaining[c.teacher_id]?.[c.subject_id] || 0
      const busyCount = Object.values(teacherBusy[c.teacher_id] || {}).reduce(
        (sum, day) => sum + Object.values(day).filter(Boolean).length,
        0
      )
      score -= busyCount * 0.1
      return { ...c, score }
    })
    scored.sort((a, b) => b.score - a.score)
    return scored[0]
  }

  // Phase 1: Place class teachers in period 1 (Sunday only, one slot per CT)
  for (const section of sections) {
    const ctId = ctMap[section.id]
    if (!ctId || !teacherRemaining[ctId]) continue
    const ctSubjects = Object.entries(teacherRemaining[ctId])
      .filter(([_, load]) => load > 0)
      .map(([sid]) => parseInt(sid))
    if (ctSubjects.length > 0) {
      const subjectId = ctSubjects[0]
      const day = 0
      if (!teacherBusy[ctId]?.[day]?.[1]) {
        routineGrid[section.id][day][1] = {
          teacher_id: ctId,
          subject_id: subjectId,
          is_ct: true,
        }
        teacherBusy[ctId][day][1] = true
        sectionDayTeachers[section.id][day].add(ctId)
        teacherRemaining[ctId][subjectId]--
        if (teacherRemaining[ctId][subjectId] <= 0) {
          delete teacherRemaining[ctId][subjectId]
        }
      }
    }
  }

  // Phase 2: Greedy fill with three-tier fallback
  for (const section of sections) {
    for (const day of DAYS) {
      for (let period = 1; period <= periodsCount; period++) {
        if (period === BREAK_PERIOD) continue
        if (routineGrid[section.id][day][period]) continue

        const prevTeacherId = period > 1 ? routineGrid[section.id][day][period - 1]?.teacher_id : undefined

        // Tier 1: strict (no same-day, no consecutive)
        let candidates = findCandidates(section.id, day, period, prevTeacherId)
        if (candidates.length > 0) {
          assignSlot(section.id, day, period, pickBestCandidate(candidates, period, section.id))
          continue
        }

        // Tier 2: allow same-day but still avoid consecutive
        candidates = findCandidates(section.id, day, period, prevTeacherId, true)
        if (candidates.length > 0) {
          assignSlot(section.id, day, period, pickBestCandidate(candidates, period, section.id))
          continue
        }

        // Tier 3: allow consecutive too (last resort)
        candidates = findCandidates(section.id, day, period, undefined, true)
        if (candidates.length > 0) {
          assignSlot(section.id, day, period, pickBestCandidate(candidates, period, section.id))
        }
      }
    }
  }

  // Phase 3: Optimize - resolve consecutive and same-day repeats by swapping within day
  for (const section of sections) {
    for (const day of DAYS) {
      for (let period = 1; period < periodsCount; period++) {
        if (period === BREAK_PERIOD || period + 1 === BREAK_PERIOD) continue
        const current = routineGrid[section.id][day][period]
        const next = routineGrid[section.id][day][period + 1]
        if (!current || !next) continue

        if (current.teacher_id === next.teacher_id) {
          for (let swapPeriod = period + 2; swapPeriod <= periodsCount; swapPeriod++) {
            const target = routineGrid[section.id][day][swapPeriod]
            if (!target) continue
            if (target.teacher_id === current.teacher_id) continue

            if (teacherBusy[current.teacher_id]?.[day]?.[swapPeriod]) continue
            if (teacherBusy[target.teacher_id]?.[day]?.[period + 1]) continue

            routineGrid[section.id][day][period + 1] = target
            routineGrid[section.id][day][swapPeriod] = next
            sectionDayTeachers[section.id][day].delete(current.teacher_id)
            sectionDayTeachers[section.id][day].add(target.teacher_id)
            break
          }
        }
      }
    }
  }

  // Phase 4: Move class teacher to period 1 where possible
  for (const section of sections) {
    const ctId = ctMap[section.id]
    if (!ctId) continue
    for (const day of DAYS) {
      const p1 = routineGrid[section.id][day][1]
      if (p1 && p1.teacher_id === ctId) continue
      for (let period = 2; period <= periodsCount; period++) {
        if (period === BREAK_PERIOD) continue
        const slot = routineGrid[section.id][day][period]
        if (slot && slot.teacher_id === ctId && p1) {
          if (!teacherBusy[p1.teacher_id]?.[day]?.[period] && !teacherBusy[ctId]?.[day]?.[1]) {
            routineGrid[section.id][day][1] = { ...slot, is_ct: true }
            routineGrid[section.id][day][period] = { ...p1, is_ct: false }
            break
          }
        }
      }
    }
  }

  // Calculate feasibility metrics
  let totalSlots = 0
  let filledSlots = 0
  for (const section of sections) {
    for (const day of DAYS) {
      for (let period = 1; period <= periodsCount; period++) {
        if (period === BREAK_PERIOD) continue
        totalSlots++
        if (routineGrid[section.id][day][period]) filledSlots++
      }
    }
  }
  const gapSlots = totalSlots - filledSlots

  const metrics = {
    totalSlots,
    filledSlots,
    gapSlots,
    teacherCount: activeTeacherIds.length,
    sectionsCount: sections.length,
    periodsPerDay: periodsCount,
    message: gapSlots > 0
      ? `Not enough teachers to fill ${gapSlots} slot(s). Assign more teachers or increase subject loads for ${className}.`
      : "All slots filled successfully.",
  }

  // Save to database
  const sectionIds = sections.map(s => s.id)
  await supabase.from("routines").delete().in("section_id", sectionIds)

  const routineInserts: any[] = []
  for (const section of sections) {
    for (const day of DAYS) {
      for (let period = 1; period <= periodsCount; period++) {
        if (period === BREAK_PERIOD) continue
        const slot = routineGrid[section.id][day][period]
        if (slot) {
          routineInserts.push({
            section_id: section.id,
            day_of_week: day,
            period_number: period,
            teacher_id: slot.teacher_id,
            subject_id: slot.subject_id,
            is_class_teacher_period: slot.is_ct,
          })
        }
      }
    }
  }

  if (routineInserts.length > 0) {
    const { error: insertError } = await supabase.from("routines").insert(routineInserts)
    if (insertError) throw new Error(`Failed to save routines: ${insertError.message}`)
  }

  const { data: savedRoutines } = await supabase
    .from("routines")
    .select("*, teachers(*), subjects(*)")
    .in("section_id", sectionIds)
    .order("section_id")
    .order("day_of_week")
    .order("period_number")

  return {
    sections: sections.map(s => ({
      id: s.id,
      name: s.name,
      class_id: s.class_id,
      class_name: classData.display_name,
    })),
    routines: savedRoutines || [],
    metrics,
  }
}
