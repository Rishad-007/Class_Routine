"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DAYS, DAYS_SHORT } from "@/lib/types"
import { FiEdit2, FiChevronDown, FiChevronUp } from "react-icons/fi"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Separator } from "@/components/ui/separator"

interface Props {
  section: any
  routines: any[]
  periodsCount: number
  allTeachers: any[]
  allRoutines: any[]
  allSections: any[]
  teacherSubjects: any[]
  conflicts: Record<string, string[]>
  selectedClassId: number
  onRoutineUpdated?: () => void
}

export function RoutineTable({ section, routines, periodsCount, allTeachers, allRoutines, allSections, teacherSubjects, conflicts, selectedClassId, onRoutineUpdated }: Props) {
  const [editingCell, setEditingCell] = useState<{ day: number; period: number } | null>(null)
  const [showTeachers, setShowTeachers] = useState(false)

  const getRoutine = (day: number, period: number) =>
    routines.find((r: any) => r.day_of_week === day && r.period_number === period)

  const handleEdit = async (day: number, period: number, teacherId: number) => {
    const current = getRoutine(day, period)
    setEditingCell(null)
    try {
      if (current) {
        const res = await fetch(`/api/routines/${current.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacher_id: teacherId, subject_id: current.subject_id }),
        })
        if (!res.ok) throw new Error("Failed to update")
        const data = await res.json()
        if (data.warnings?.length) data.warnings.forEach((w: string) => toast.warning(w))
        else toast.success("Updated")
      } else {
        const res = await fetch("/api/routines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section_id: section.id,
            day_of_week: day,
            period_number: period,
            teacher_id: teacherId,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to add")
        }
        toast.success("Added")
      }
      onRoutineUpdated?.()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Collect section-level comments per period row
  const periodComments = useMemo(() => {
    const result: Record<number, string[]> = {}
    const displayPeriods: (number | "tiffin")[] = []
    for (let p = 1; p <= periodsCount; p++) {
      if (p === 5) { displayPeriods.push("tiffin"); continue }
      displayPeriods.push(p > 5 ? p - 1 : p)
    }
    const toDbPeriod = (dp: number) => dp >= 5 ? dp + 1 : dp

    for (const dp of displayPeriods) {
      if (dp === "tiffin") continue
      const dbPeriod = toDbPeriod(dp)
      const msgs: string[] = []
      let allEmpty = true
      for (let dayIdx = 0; dayIdx < DAYS.length; dayIdx++) {
        const routine = getRoutine(dayIdx, dbPeriod)
        if (routine) allEmpty = false
        const cellKey = `${section.id}:${dayIdx}:${dbPeriod}`
        if (conflicts[cellKey]) {
          for (const msg of conflicts[cellKey]) {
            msgs.push(`${DAYS_SHORT[dayIdx]}: ${msg.replace("⚠ ", "")}`)
          }
        }
      }
      if (allEmpty) msgs.push("Empty slot — click + to assign")
      if (msgs.length > 0) result[dp] = msgs
    }
    return result
  }, [routines, conflicts, section.id, periodsCount])

  // Available teachers panel data
  const sectionsMap = useMemo(() => {
    const m: Record<number, string> = {}
    for (const s of allSections) m[s.id] = s.name
    return m
  }, [allSections])

  const teacherPanelData = useMemo(() => {
    // Total load per teacher for this class from teacher_subjects
    const totalLoad: Record<number, number> = {}
    for (const ts of teacherSubjects) {
      if (!totalLoad[ts.teacher_id]) totalLoad[ts.teacher_id] = 0
      totalLoad[ts.teacher_id] += ts.class_load || 0
    }

    return allTeachers.map((t: any) => {
      // Assignments across ALL sections
      const allAssignments = allRoutines.filter((r: any) => r.teacher_id === t.id)
      const assignedCount = allAssignments.length
      const availableSlots = (totalLoad[t.id] || 0) - assignedCount

      // Group assignments by section
      const sectionGroups: Record<string, string[]> = {}
      for (const r of allAssignments) {
        const secName = sectionsMap[r.section_id] || `Sec ${r.section_id}`
        if (!sectionGroups[secName]) sectionGroups[secName] = []
        sectionGroups[secName].push(`${DAYS_SHORT[r.day_of_week]} P${r.period_number}`)
      }
      const sectionSummary = Object.entries(sectionGroups)
        .map(([sec, slots]) => `${sec}: ${slots.join(", ")}`)
        .join(" | ")

      return {
        id: t.id,
        name: t.name,
        teacher_id: t.teacher_id,
        availableSlots: Math.max(0, availableSlots),
        sectionSummary,
      }
    })
  }, [allTeachers, allRoutines, teacherSubjects, sectionsMap])

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left text-sm font-semibold text-slate-500 border-b-2 border-slate-200 bg-slate-50/50 w-24">Period</th>
              {DAYS.map(day => <th key={day} className="p-3 text-left text-sm font-semibold text-slate-500 border-b-2 border-slate-200 bg-slate-50/50"><span className="hidden sm:inline">{day}</span><span className="sm:hidden">{DAYS_SHORT[DAYS.indexOf(day)]}</span></th>)}
              <th className="p-3 text-left text-sm font-semibold text-slate-500 border-b-2 border-slate-200 bg-slate-50/50 w-48">Comments</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const displayPeriods: (number | "tiffin")[] = []
              for (let p = 1; p <= periodsCount; p++) {
                if (p === 5) {
                  displayPeriods.push("tiffin")
                } else {
                  displayPeriods.push(p > 5 ? p - 1 : p)
                }
              }
              const toDbPeriod = (dp: number) => dp >= 5 ? dp + 1 : dp
              return displayPeriods.map(period => {
                if (period === "tiffin") {
                  return (
                    <tr key="tiffin">
                      <td className="p-3 text-sm font-bold text-orange-500 border-b border-slate-100 bg-orange-50/50">Tiffin Break</td>
                      {DAYS.map((_, dayIdx) => (
                        <td key={dayIdx} className="p-2 border-b border-slate-100 bg-orange-50/50">
                          <span className="text-xs text-orange-300 italic block text-center">—</span>
                        </td>
                      ))}
                      <td className="p-2 border-b border-slate-100 bg-orange-50/50"></td>
                    </tr>
                  )
                }
                const dbPeriod = toDbPeriod(period)
                const comments = periodComments[period]
                return (
                  <tr key={period}>
                    <td className="p-3 text-sm font-medium text-slate-600 border-b border-slate-100 bg-slate-50/30">
                      Period {period}
                    </td>
                    {DAYS.map((_, dayIdx) => {
                      const routine = getRoutine(dayIdx, dbPeriod)
                      const isEditing = editingCell?.day === dayIdx && editingCell?.period === dbPeriod
                      const cellConflicts = conflicts?.[`${section.id}:${dayIdx}:${dbPeriod}`] || []
                      const hasConflict = cellConflicts.length > 0
                      return (
                        <td key={dayIdx} className={`p-2 border-b border-slate-100 ${hasConflict ? "bg-red-50" : routine?.is_class_teacher_period ? "bg-blue-50/30" : ""}`}>
                          {isEditing ? (
                            <TeacherSelectPopover
                              teachers={allTeachers}
                              currentId={routine?.teacher_id || 0}
                              onSelect={tid => handleEdit(dayIdx, dbPeriod, tid)}
                              onCancel={() => setEditingCell(null)}
                            />
                          ) : routine ? (
                            <div className="group relative">
                              <button onClick={() => setEditingCell({ day: dayIdx, period: dbPeriod })} className="w-full text-left">
                                <div className={`text-sm font-medium ${hasConflict ? "text-red-800" : "text-slate-800"}`}>{routine.teachers?.name}</div>
                                <div className="text-xs text-slate-400 truncate">{routine.subjects?.name}</div>
                                {routine.is_class_teacher_period && <Badge className="mt-1 bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">CT</Badge>}
                              </button>
                              <button onClick={() => setEditingCell({ day: dayIdx, period: dbPeriod })} className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100"><FiEdit2 size={12} className="text-slate-400" /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingCell({ day: dayIdx, period: dbPeriod })}
                              className="w-full text-left text-xs text-slate-300 italic border border-dashed border-slate-200 rounded px-1 py-1 hover:border-blue-300 hover:text-blue-400 transition-colors"
                            >
                              + Add
                            </button>
                          )}
                        </td>
                      )
                    })}
                    <td className="p-2 border-b border-slate-100 align-top">
                      {comments ? (
                        <div className="text-[10px] leading-tight space-y-0.5">
                          {comments.map((msg, i) => (
                            <div key={i} className={msg.includes("Empty") ? "text-amber-600" : "text-red-600"}>{msg}</div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            })()}
          </tbody>
        </table>
      </div>

      <Separator className="my-4" />

      {/* Available Teachers */}
      <div>
        <button
          onClick={() => setShowTeachers(!showTeachers)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          {showTeachers ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          Available Teachers ({teacherPanelData.length})
        </button>
        {showTeachers && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left font-semibold text-slate-500 border-b border-slate-200 bg-slate-50/50">Teacher</th>
                  <th className="p-2 text-left font-semibold text-slate-500 border-b border-slate-200 bg-slate-50/50">Available Slots</th>
                  <th className="p-2 text-left font-semibold text-slate-500 border-b border-slate-200 bg-slate-50/50">Assigned In Sections</th>
                </tr>
              </thead>
              <tbody>
                {teacherPanelData.map((t: any) => (
                  <tr key={t.id}>
                    <td className="p-2 border-b border-slate-100">
                      <div className="font-medium text-slate-800">{t.name}</div>
                      <div className="text-slate-400">{t.teacher_id}</div>
                    </td>
                    <td className="p-2 border-b border-slate-100">
                      <span className={t.availableSlots > 0 ? "text-emerald-700 font-medium" : "text-slate-400"}>
                        {t.availableSlots}
                      </span>
                    </td>
                    <td className="p-2 border-b border-slate-100 text-slate-500 whitespace-pre-wrap">
                      {t.sectionSummary || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function TeacherSelectPopover({ teachers, currentId, onSelect, onCancel }: { teachers: any[]; currentId: number; onSelect: (id: number) => void; onCancel: () => void }) {
  const [open, setOpen] = useState(true)
  return (
    <Popover open={open} onOpenChange={o => { setOpen(o); if (!o) onCancel() }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">{teachers.find(t => t.id === currentId)?.name || "Select..."}</Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start">
        <Command>
          <CommandInput placeholder="Search teacher..." />
          <CommandList>
            <CommandEmpty>No teachers found.</CommandEmpty>
            <CommandGroup>
              {teachers.map(t => (
                <CommandItem key={t.id} value={`${t.name} ${t.teacher_id}`} onSelect={() => { onSelect(t.id); setOpen(false) }}>
                  <div className="text-sm">{t.name}<div className="text-xs text-slate-400">{t.teacher_id}</div></div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
