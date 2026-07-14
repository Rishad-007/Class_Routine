"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DAYS, DAYS_SHORT } from "@/lib/types"
import { FiRepeat, FiAlertTriangle, FiCheckCircle } from "react-icons/fi"
import { toast } from "sonner"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  sections: any[]
  routines: any[]
  allTeachers: any[]
  classDisplayName: string
  onSwapComplete?: () => void
}

export function SwapDialog({ open, onOpenChange, sections, routines, allTeachers, classDisplayName, onSwapComplete }: Props) {
  const [slotA, setSlotA] = useState<{ section_id: number | null; day: number | null; period: number | null }>({ section_id: null, day: null, period: null })
  const [slotB, setSlotB] = useState<{ section_id: number | null; day: number | null; period: number | null }>({ section_id: null, day: null, period: null })
  const [warnings, setWarnings] = useState<string[]>([])
  const [executing, setExecuting] = useState(false)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    if (!open) {
      setSlotA({ section_id: null, day: null, period: null })
      setSlotB({ section_id: null, day: null, period: null })
      setWarnings([])
      setExecuting(false)
      setValidating(false)
    }
  }, [open])

  const periods = useMemo(() => {
    const ps: number[] = []
    const maxP = sections.length > 0 ? 8 : 0
    for (let p = 1; p <= maxP; p++) {
      if (p === 5) continue
      ps.push(p)
    }
    return ps
  }, [sections])

  const getEntry = (section_id: number, day: number, period: number) =>
    routines.find((r: any) => r.section_id === section_id && r.day_of_week === day && r.period_number === period) || null

  const entryA = slotA.section_id && slotA.day !== null && slotA.period !== null
    ? getEntry(slotA.section_id, slotA.day, slotA.period)
    : null

  const entryB = slotB.section_id && slotB.day !== null && slotB.period !== null
    ? getEntry(slotB.section_id, slotB.day, slotB.period)
    : null

  const bothResolved = !!entryA && !!entryB
  const sameSlot = bothResolved && entryA.id === entryB.id

  useEffect(() => {
    if (!bothResolved || sameSlot) {
      setWarnings([])
      return
    }
    let cancelled = false
    setValidating(true)
    fetch(`/api/routines/swap?e1=${entryA.id}&e2=${entryB.id}`)
      .then(async r => {
        const data = await r.json()
        if (!cancelled) {
          if (!r.ok) {
            setWarnings([data.error || "Validation request failed"])
          } else {
            setWarnings(data.warnings || [])
          }
          setValidating(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setWarnings([`Network error: ${err.message || "Unable to reach server"}`])
          setValidating(false)
        }
      })
    return () => { cancelled = true }
  }, [bothResolved, sameSlot, entryA?.id, entryB?.id])

  const handleExecute = async () => {
    if (!entryA || !entryB) return
    setExecuting(true)
    try {
      const res = await fetch("/api/routines/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry1_id: entryA.id, entry2_id: entryB.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Swap failed")
      if (data.warnings?.length) data.warnings.forEach((w: string) => toast.warning(w))
      else toast.success("Swap successful")
      onOpenChange(false)
      onSwapComplete?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setExecuting(false)
    }
  }

  const teacherName = (tid: number) => allTeachers.find(t => t.id === tid)?.name || "Unknown"
  const subjectName = (sid: number) => {
    const entry = routines.find(r => r.subject_id === sid)
    return entry?.subjects?.name || "Unknown"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiRepeat size={18} className="text-indigo-600" />
            Swap Teachers — {classDisplayName}
          </DialogTitle>
          <DialogDescription>
            Select two slots to swap their teachers and subjects. Only slots with assigned teachers are eligible.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Slot A */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">A</span>
              Slot A
            </h4>
            <SlotSelector
              label="Section"
              value={slotA.section_id}
              onChange={v => setSlotA(p => ({ ...p, section_id: v }))}
              options={sections.map(s => ({ value: s.id, label: `Section ${s.name}` }))}
              placeholder="Select section"
            />
            <SlotSelector
              label="Day"
              value={slotA.day}
              onChange={v => setSlotA(p => ({ ...p, day: v }))}
              options={DAYS.map((d, i) => ({ value: i, label: d }))}
              placeholder="Select day"
            />
            <SlotSelector
              label="Period"
              value={slotA.period}
              onChange={v => setSlotA(p => ({ ...p, period: v }))}
              options={periods.map(p => ({ value: p, label: `Period ${p}` }))}
              placeholder="Select period"
            />
            {entryA && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
                <div className="font-medium text-slate-800">{teacherName(entryA.teacher_id)}</div>
                <div className="text-slate-500">{subjectName(entryA.subject_id)}</div>
                {entryA.is_class_teacher_period && (
                  <span className="inline-block text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">CT</span>
                )}
              </div>
            )}
          </div>

          {/* Slot B */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">B</span>
              Slot B
            </h4>
            <SlotSelector
              label="Section"
              value={slotB.section_id}
              onChange={v => setSlotB(p => ({ ...p, section_id: v }))}
              options={sections.map(s => ({ value: s.id, label: `Section ${s.name}` }))}
              placeholder="Select section"
            />
            <SlotSelector
              label="Day"
              value={slotB.day}
              onChange={v => setSlotB(p => ({ ...p, day: v }))}
              options={DAYS.map((d, i) => ({ value: i, label: d }))}
              placeholder="Select day"
            />
            <SlotSelector
              label="Period"
              value={slotB.period}
              onChange={v => setSlotB(p => ({ ...p, period: v }))}
              options={periods.map(p => ({ value: p, label: `Period ${p}` }))}
              placeholder="Select period"
            />
            {entryB && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
                <div className="font-medium text-slate-800">{teacherName(entryB.teacher_id)}</div>
                <div className="text-slate-500">{subjectName(entryB.subject_id)}</div>
                {entryB.is_class_teacher_period && (
                  <span className="inline-block text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">CT</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Validation messages */}
        {validating && (
          <div className="flex items-center gap-2 text-sm text-slate-500 px-1">
            <span className="animate-pulse">Validating swap...</span>
          </div>
        )}
        {!validating && sameSlot && bothResolved && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <FiAlertTriangle className="mt-0.5 shrink-0" size={16} />
            <span>Select two different slots. Slot A and Slot B are the same.</span>
          </div>
        )}
        {!validating && warnings.length > 0 && !sameSlot && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm space-y-1">
            <div className="flex items-center gap-2 font-medium text-amber-800 mb-1">
              <FiAlertTriangle size={16} />
              Warnings
            </div>
            {warnings.map((w, i) => (
              <div key={i} className="text-amber-700 text-xs flex items-start gap-2">
                <span>•</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
        {!validating && bothResolved && warnings.length === 0 && !sameSlot && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <FiCheckCircle size={16} />
            <span>Swap looks good — no conflicts detected.</span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleExecute}
            disabled={!bothResolved || sameSlot || validating || executing}
            className="gap-2"
          >
            <FiRepeat size={14} />
            {executing ? "Swapping..." : "Execute Swap"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SlotSelector({ label, value, onChange, options, placeholder }: {
  label: string
  value: number | null
  onChange: (v: number) => void
  options: { value: number; label: string }[]
  placeholder: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <Select value={value !== null ? String(value) : ""} onValueChange={v => onChange(parseInt(v))}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
