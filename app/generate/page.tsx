"use client"

import { useState, useEffect } from "react"
import { FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiUsers, FiLayers } from "react-icons/fi"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RoutineTable } from "@/components/generate/routine-table"
import { toast } from "sonner"

const CLASS_NAMES = ["Six", "Seven", "Eight", "Nine", "Ten"]

export default function GeneratePage() {
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [routines, setRoutines] = useState<any[]>([])
  const [conflicts, setConflicts] = useState<Record<string, string[]>>({})
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [metrics, setMetrics] = useState<any>(null)
  const [generationMessages, setGenerationMessages] = useState<{ type: "error" | "warning" | "info"; message: string }[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [c, s, t] = await Promise.all([fetch("/api/classes"), fetch("/api/sections"), fetch("/api/teachers")])
      if (!c.ok) throw new Error("Database not configured")
      const classesData = await c.json()
      setClasses(classesData)
      setSections(await s.json())
      setTeachers(await t.json())
      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].id)
      }
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRoutines = async (classId: number) => {
    try {
      const [res, valRes, tsRes] = await Promise.all([
        fetch(`/api/routines?class_id=${classId}`),
        fetch(`/api/routines/validate?class_id=${classId}`),
        fetch(`/api/subjects?class_id=${classId}`).then(() =>
          fetch(`/api/teacher-subjects`).then(r => r.json())
        ).catch(() => []),
      ])
      if (res.ok) {
        const data = await res.json()
        setRoutines(data.routines || [])
      }
      if (valRes.ok) {
        const valData = await valRes.json()
        setConflicts(valData.conflicts || {})
      }
      if (Array.isArray(tsRes)) {
        setTeacherSubjects(tsRes)
      }
    } catch {}
  }

  useEffect(() => {
    if (selectedClassId) {
      setMetrics(null)
      setGenerationMessages([])
      setError("")
      fetchRoutines(selectedClassId)
    }
  }, [selectedClassId])

  const handleGenerate = async () => {
    if (!selectedClassId) return
    setGenerating(true)
    setError("")
    setMetrics(null)
    setGenerationMessages([])
    try {
      const res = await fetch("/api/routines/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: selectedClassId }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Generation failed")
      const data = await res.json()
      setMetrics(data.metrics || null)
      const msgs: { type: "error" | "warning" | "info"; message: string }[] = []
      if (data.metrics?.gapSlots > 0) {
        msgs.push({ type: "warning", message: data.metrics.message })
      }
      if (data.metrics?.message && data.metrics.gapSlots === 0) {
        msgs.push({ type: "info", message: data.metrics.message })
      }
      setGenerationMessages(msgs)
      await fetchRoutines(selectedClassId)
    } catch (err: any) { setError(err.message) }
    finally { setGenerating(false) }
  }

  const handleGenerateAll = async () => {
    if (!classes.length) return
    setGenerating(true)
    setError("")
    setMetrics(null)
    setGenerationMessages([])
    try {
      const res = await fetch("/api/routines/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generate_all: true }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Generation failed")
      const data = await res.json()
      const totalFilled = data.results.reduce((sum: number, r: any) => sum + r.metrics.filledSlots, 0)
      const totalSlots = data.results.reduce((sum: number, r: any) => sum + r.metrics.totalSlots, 0)
      setGenerationMessages([{ type: "info", message: `All classes generated — ${totalFilled}/${totalSlots} slots filled` }])
      data.results.forEach((r: any) => {
        if (r.metrics?.gapSlots > 0) {
          setGenerationMessages(prev => [...prev, { type: "warning", message: `${r.class_name}: ${r.metrics.message}` }])
        }
      })
      if (selectedClassId) await fetchRoutines(selectedClassId)
    } catch (err: any) { setError(err.message) }
    finally { setGenerating(false) }
  }

  const getClassSections = () => {
    if (!selectedClassId) return []
    return sections.filter((s: any) => s.class_id === selectedClassId)
  }

  const classSections = getClassSections()
  const selectedClass = classes.find((c: any) => c.id === selectedClassId)
  const periodsCount = selectedClass?.periods_count || 8

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Generate Routine</h1>
          <p className="text-slate-500 mt-1">Generate and edit class routines</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedClassId}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition-all disabled:opacity-50"
          >
            <FiRefreshCw className={generating ? "animate-spin" : ""} size={16} />
            {generating ? "Generating..." : "Generate Routine"}
          </button>
          <button
            onClick={handleGenerateAll}
            disabled={generating || classes.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 hover:shadow-md transition-all disabled:opacity-50"
          >
            <FiLayers size={16} />
            Generate All
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm mb-6">{error}</div>}

      {metrics && (
        <div className={`rounded-xl border p-4 mb-4 text-sm ${metrics.gapSlots > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              {metrics.gapSlots > 0
                ? <FiAlertTriangle className="text-amber-600" size={18} />
                : <FiCheckCircle className="text-emerald-600" size={18} />}
              <span className={metrics.gapSlots > 0 ? "text-amber-800" : "text-emerald-800"}>
                <strong>{metrics.filledSlots}</strong> of <strong>{metrics.totalSlots}</strong> slots filled
                <span className="text-slate-500 ml-1">({Math.round(metrics.filledSlots / metrics.totalSlots * 100)}%)</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <FiUsers size={16} />
              <span><strong>{metrics.teacherCount}</strong> teachers · <strong>{metrics.sectionsCount}</strong> sections</span>
            </div>
          </div>
          <div className="mt-2 w-full bg-white/60 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${metrics.gapSlots > 0 ? "bg-amber-400" : "bg-emerald-400"}`}
              style={{ width: `${Math.round(metrics.filledSlots / metrics.totalSlots * 100)}%` }}
            />
          </div>
        </div>
      )}

      {generationMessages.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6 text-sm shadow-sm">
          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <FiAlertTriangle size={14} className="text-amber-500" />
            Generation Messages
          </h4>
          <div className="space-y-1">
            {generationMessages.map((m, i) => (
              <div key={i} className={`text-xs ${m.type === "error" ? "text-red-600" : m.type === "warning" ? "text-amber-700" : "text-emerald-700"}`}>
                {m.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Class</label>
            <select
              value={selectedClassId || ""}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white"
            >
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.display_name}</option>
              ))}
            </select>
          </div>

          {!selectedClassId ? (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-lg mb-2">Select a class to get started</p>
            </div>
          ) : classSections.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-lg mb-2">No sections found for this class</p>
              <p className="text-sm">Add sections in the Classes page first</p>
            </div>
          ) : routines.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-lg mb-2">No routine generated yet</p>
              <p className="text-sm">Click &ldquo;Generate Routine&rdquo; to auto-generate</p>
            </div>
          ) : (
            <Tabs defaultValue={String(classSections[0]?.id)}>
              <TabsList className="mb-6">
                {classSections.map((sec: any) => (
                  <TabsTrigger key={sec.id} value={String(sec.id)}>Section {sec.name}</TabsTrigger>
                ))}
              </TabsList>
              {classSections.map((sec: any) => (
                <TabsContent key={sec.id} value={String(sec.id)}>
                  <div className="bg-white rounded-xl border">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-slate-800">{selectedClass?.display_name} - Section {sec.name}</h3>
                    </div>
                    <div className="p-4">
                      <RoutineTable
                        section={sec}
                        routines={routines.filter((r: any) => r.section_id === sec.id)}
                        periodsCount={periodsCount}
                        allTeachers={teachers}
                        allRoutines={routines}
                        allSections={classSections}
                        teacherSubjects={teacherSubjects}
                        conflicts={conflicts}
                        selectedClassId={selectedClassId!}
                        onRoutineUpdated={() => fetchRoutines(selectedClassId!)}
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </>
      )}
    </div>
  )
}
