"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DAYS, DAYS_SHORT } from "@/lib/types"
import { FiCalendar, FiX } from "react-icons/fi"

interface Props {
  teacher: any
  open: boolean
  onClose: () => void
}

export function TeacherRoutineDialog({ teacher, open, onClose }: Props) {
  const [routines, setRoutines] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !teacher) return
    setLoading(true)
    fetch(`/api/routines?teacher_id=${teacher.id}`)
      .then(r => r.json())
      .then(data => setRoutines(data.routines || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, teacher])

  if (!teacher) return null

  // Determine max period number
  const maxPeriod = routines.length > 0
    ? Math.max(...routines.map(r => r.period_number))
    : 7

  const getSlot = (day: number, period: number) =>
    routines.find((r: any) => r.day_of_week === day && r.period_number === period)

  // Group by day for summary
  const totalSlots = routines.length

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {teacher.name.charAt(0)}
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">{teacher.name}</div>
                <div className="text-sm text-slate-400 font-mono">{teacher.teacher_id} · {totalSlots} period{totalSlots !== 1 ? "s" : ""}</div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">Loading routine...</div>
        ) : routines.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <FiCalendar size={32} className="mx-auto mb-3 text-slate-300" />
            <p>No routine assigned yet</p>
            <p className="text-sm mt-1">Generate routines in the Generate page first</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2.5 text-left font-semibold text-slate-500 border-b-2 border-slate-200 bg-slate-50/50 w-20">Period</th>
                  {DAYS.map(day => (
                    <th key={day} className="p-2.5 text-left font-semibold text-slate-500 border-b-2 border-slate-200 bg-slate-50/50">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{DAYS_SHORT[DAYS.indexOf(day)]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxPeriod }, (_, i) => i + 1).map(period => (
                  <tr key={period}>
                    <td className="p-2.5 text-sm font-medium text-slate-600 border-b border-slate-100 bg-slate-50/30">
                      {period === 5 ? (
                        <span className="text-orange-500 font-bold">Break</span>
                      ) : (
                        <>Period {period > 5 ? period - 1 : period}</>
                      )}
                    </td>
                    {DAYS.map((_, dayIdx) => {
                      const slot = getSlot(dayIdx, period)
                      return (
                        <td key={dayIdx} className={`p-2 border-b border-slate-100 ${period === 5 ? "bg-orange-50/50" : slot ? "" : ""}`}>
                          {period === 5 ? (
                            <span className="text-xs text-orange-300 italic">—</span>
                          ) : slot ? (
                            <div>
                              <div className="text-sm font-medium text-slate-800">{slot.subjects?.name}</div>
                              <div className="text-[11px] text-slate-400">
                                {slot.sections?.classes?.display_name} — Sec {slot.sections?.name}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 italic">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
