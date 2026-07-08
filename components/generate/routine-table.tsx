"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DAYS, DAYS_SHORT } from "@/lib/types"
import { FiEdit2 } from "react-icons/fi"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface Props {
  section: any
  routines: any[]
  periodsCount: number
  allTeachers: any[]
  onRoutineUpdated?: () => void
}

export function RoutineTable({ section, routines, periodsCount, allTeachers, onRoutineUpdated }: Props) {
  const [editingCell, setEditingCell] = useState<{ day: number; period: number } | null>(null)

  const getRoutine = (day: number, period: number) => routines.find((r: any) => r.day_of_week === day && r.period_number === period)

  const handleEdit = async (day: number, period: number, teacherId: number) => {
    const current = getRoutine(day, period)
    if (!current) return
    setEditingCell(null)
    try {
      const subjRes = await fetch(`/api/teacher-subjects?teacher_id=${teacherId}`)
      const subjects = await subjRes.json()
      const subjectId = subjects.length > 0 ? subjects[0].subject_id : current.subject_id
      const res = await fetch(`/api/routines/${current.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacher_id: teacherId, subject_id: subjectId }) })
      if (!res.ok) throw new Error("Failed to update")
      const data = await res.json()
      if (data.warnings?.length) data.warnings.forEach((w: string) => toast.warning(w))
      else toast.success("Updated")
      onRoutineUpdated?.()
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-3 text-left text-sm font-semibold text-slate-500 border-b-2 border-slate-200 bg-slate-50/50 w-24">Period</th>
            {DAYS.map(day => <th key={day} className="p-3 text-left text-sm font-semibold text-slate-500 border-b-2 border-slate-200 bg-slate-50/50"><span className="hidden sm:inline">{day}</span><span className="sm:hidden">{DAYS_SHORT[DAYS.indexOf(day)]}</span></th>)}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: periodsCount }, (_, i) => i + 1).map(period => {
            const isTiffin = period === 5 && periodsCount >= 5
            return (
              <tr key={period}>
                <td className={`p-3 text-sm font-medium border-b border-slate-100 bg-slate-50/30 ${isTiffin ? "text-orange-500 font-bold" : "text-slate-600"}`}>
                  {isTiffin ? "Tiffin" : `Period ${period}`}
                </td>
                {DAYS.map((_, dayIdx) => {
                  const routine = getRoutine(dayIdx, period)
                  const isEditing = editingCell?.day === dayIdx && editingCell?.period === period
                  return (
                    <td key={dayIdx} className={`p-2 border-b border-slate-100 ${isTiffin ? "bg-orange-50/50" : routine?.is_class_teacher_period ? "bg-purple-50/30" : ""}`}>
                      {isTiffin ? <span className="text-xs text-orange-400 italic block text-center">Break</span>
                      : isEditing ? <TeacherSelectPopover teachers={allTeachers} currentId={routine?.teacher_id || 0} onSelect={tid => handleEdit(dayIdx, period, tid)} onCancel={() => setEditingCell(null)} />
                      : routine ? (
                        <div className="group relative">
                          <button onClick={() => setEditingCell({ day: dayIdx, period })} className="w-full text-left">
                            <div className="text-sm font-medium text-slate-800">{routine.teachers?.name}</div>
                            <div className="text-xs text-slate-400 truncate">{routine.subjects?.name}</div>
                            {routine.is_class_teacher_period && <Badge className="mt-1 bg-purple-100 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0">CT</Badge>}
                          </button>
                          <button onClick={() => setEditingCell({ day: dayIdx, period })} className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100"><FiEdit2 size={12} className="text-slate-400" /></button>
                        </div>
                      ) : <span className="text-xs text-slate-300 italic">—</span>}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
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
