"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { FiSearch, FiX, FiUsers, FiCalendar, FiDownload } from "react-icons/fi"
import { DAYS, DAYS_SHORT, PERIOD_START_TIMES, getCategoryColor } from "@/lib/types"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function ViewPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [allRoutines, setAllRoutines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [highlightTeacherIds, setHighlightTeacherIds] = useState<Set<number>>(new Set())
  const [matchCount, setMatchCount] = useState(0)
  const [matchTeacherNames, setMatchTeacherNames] = useState<string[]>([])
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([fetch("/api/classes"), fetch("/api/sections")])
      if (!c.ok) throw new Error("Database not configured")
      const classesData = await c.json()
      setClasses(classesData)
      setSections(await s.json())
      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].id)
      }
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const fetchAllRoutines = async (classId: number) => {
    try {
      const res = await fetch(`/api/routines?class_id=${classId}`)
      if (res.ok) {
        const data = await res.json()
        setAllRoutines(data.routines || [])
      } else {
        setAllRoutines([])
      }
    } catch { setAllRoutines([]) }
  }

  useEffect(() => {
    if (selectedClassId) {
      fetchAllRoutines(selectedClassId)
      clearSearch()
    }
  }, [selectedClassId])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      clearSearch()
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/routines/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        const ids = new Set<number>((data.teachers || []).map((t: any) => t.id))
        setHighlightTeacherIds(ids)
        setMatchCount((data.routines || []).length)
        setMatchTeacherNames((data.teachers || []).map((t: any) => t.name))
      }
    } catch {}
    finally { setSearching(false) }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setHighlightTeacherIds(new Set())
    setMatchCount(0)
    setMatchTeacherNames([])
  }

  const classSections = selectedClassId
    ? sections.filter((s: any) => s.class_id === selectedClassId)
    : []

  const selectedClass = classes.find((c: any) => c.id === selectedClassId)
  const periodsCount = selectedClass?.periods_count || 7

  useEffect(() => {
    if (classSections.length > 0 && !activeTab) {
      setActiveTab(String(classSections[0].id))
    }
  }, [classSections, activeTab])

  const sectionStats = useMemo(() => {
    const stats: Record<number, { teacherCount: number; filledCount: number; totalSlots: number }> = {}
    for (const sec of classSections) {
      const secRoutines = allRoutines.filter((r: any) => r.section_id === sec.id)
      const uniqueTeachers = new Set(secRoutines.map((r: any) => r.teacher_id))
      stats[sec.id] = {
        teacherCount: uniqueTeachers.size,
        filledCount: secRoutines.length,
        totalSlots: DAYS.length * (periodsCount - (periodsCount >= 5 ? 1 : 0)),
      }
    }
    return stats
  }, [classSections, allRoutines, periodsCount])

  const hasSearchResults = highlightTeacherIds.size > 0
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadPDF = async () => {
    setIsDownloading(true)
    const activeSec = classSections.find((s: any) => activeTab === String(s.id))
    const className = selectedClass?.display_name || ""
    const secName = activeSec ? `Section ${activeSec.name}` : ""
    try {
      const tableEl = document.querySelector<HTMLElement>(`[data-pdf-table="${activeTab}"]`)
      if (!tableEl) { toast.error("No routine table found"); return }

      const container = document.createElement("div")
      container.style.cssText = "position:absolute;left:-9999px;top:0;width:1100px;background:white;padding:24px 24px 12px;font-family: Inter, system-ui, sans-serif;"

      container.innerHTML = `
        <div style="text-align:center;margin-bottom:16px;">
          <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#1e293b;margin:0 0 2px;">Cantonment Public School &amp; College, Rangpur</h2>
          <p style="font-size:11px;color:#64748b;margin:0;">Class Routine &mdash; ${className} &mdash; ${secName}</p>
        </div>
      `

      const clone = tableEl.cloneNode(true) as HTMLElement
      clone.style.cssText = "width:100%;border-collapse:collapse;"
      clone.querySelectorAll('[data-ct-badge]').forEach(el => el.remove())
      container.appendChild(clone)
      document.body.appendChild(container)

      // Wait for fonts/layout
      await new Promise(r => setTimeout(r, 200))

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      })

      document.body.removeChild(container)
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("l", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${className}_${secName}_Routine.pdf`.replace(/\s+/g, "_"))
    } catch {
      toast.error("Failed to generate PDF")
    } finally {
      setIsDownloading(false)
    }
  }

  function getRoutine(routinesList: any[], day: number, period: number) {
    return routinesList.find((r: any) => r.day_of_week === day && r.period_number === period)
  }

  function renderRoutineTable(routineList: any[]) {
    return (
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-16 sm:w-20 p-2 text-center text-[11px] font-semibold text-slate-500 border border-slate-200 bg-slate-50">
                Period
              </th>
              <th className="w-14 sm:w-16 p-2 text-center text-[11px] font-semibold text-slate-500 border border-slate-200 bg-slate-50">
                Time
              </th>
              {DAYS.map((day, i) => (
                <th key={day} className="p-2 text-center text-[11px] font-semibold text-slate-600 border border-slate-200 bg-slate-50 min-w-[110px]">
                  {DAYS_SHORT[i]}
                </th>
              ))}
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
                      <td colSpan={7} className="p-0 border border-slate-200">
                        <div className="flex items-center justify-center gap-2 py-2.5 bg-slate-50/50">
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Tiffin Break</span>
                          <span className="text-[10px] text-slate-300">10:45 - 11:00</span>
                        </div>
                      </td>
                    </tr>
                  )
                }
                const dbPeriod = toDbPeriod(period)
                return (
                  <tr key={period}>
                    <td className="sticky left-0 z-10 p-2 text-center border border-slate-200 bg-white">
                      <span className="text-xs font-semibold text-slate-500 font-mono">{period}</span>
                    </td>
                    <td className="p-2 text-center border border-slate-200 bg-white">
                      <span className="text-[10px] text-slate-400 font-mono">{PERIOD_START_TIMES[dbPeriod] || ""}</span>
                    </td>
                    {DAYS.map((_, dayIdx) => {
                      const routine = getRoutine(routineList, dayIdx, dbPeriod)
                      const highlighted = hasSearchResults && routine && highlightTeacherIds.has(routine.teacher_id)
                      const catColor = getCategoryColor(routine?.subjects?.category)

                      return (
                        <td
                          key={dayIdx}
                          className={`p-1 border border-slate-200 align-top ${
                            highlighted ? "bg-blue-50" : routine?.is_class_teacher_period ? "bg-amber-50/60" : "bg-white"
                          }`}
                        >
                          {routine ? (
                            <div className="flex flex-col min-h-[48px]">
                              <div className={`h-1 rounded-t mb-1 ${catColor} ${routine.is_class_teacher_period ? "bg-amber-400" : catColor}`} />
                              <span className={`text-[12px] font-bold leading-tight px-1 ${
                                highlighted ? "text-blue-900" : "text-slate-800"
                              }`}>
                                {routine.teachers?.name}
                              </span>
                              <span className="text-[10px] text-slate-400 leading-tight px-1 mt-0.5">
                                {routine.subjects?.name}
                              </span>
                              {routine.is_class_teacher_period && (
                                <span data-ct-badge className="text-[9px] font-semibold text-white bg-blue-600 rounded-full px-2 py-0.5 leading-none self-start mt-1 ml-1">
                                  Class Teacher
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center min-h-[48px]">
                              <span className="text-xs text-slate-200">—</span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            })()}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">View Routine</h1>
        <p className="text-slate-500 text-sm mt-1">Browse class routines and search by teacher</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm mb-6">{error}</div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-5">
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              placeholder="Search by teacher name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
          >
            {searching ? "..." : "Search"}
          </button>
        </div>
        {hasSearchResults && (
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-700 text-xs font-bold">{matchCount}</span>
              <span className="text-slate-600">
                match{matchCount !== 1 ? "es" : ""} for <strong className="text-slate-800">&ldquo;{searchQuery}&rdquo;</strong>
              </span>
              {matchTeacherNames.length > 0 && (
                <span className="hidden sm:inline text-slate-400 text-xs">
                  ({matchTeacherNames.join(", ")})
                </span>
              )}
            </div>
            <button
              onClick={clearSearch}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <FiX size={14} /> Clear
            </button>
          </div>
        )}
        {!hasSearchResults && searchQuery && !searching && matchCount === 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-sm text-slate-400">
            No matches found for &ldquo;{searchQuery}&rdquo;
            <button onClick={clearSearch} className="ml-2 text-blue-600 hover:text-blue-800">Clear</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="animate-pulse">Loading...</div>
        </div>
      ) : (
        <>
          {/* Class pills */}
          <div className="flex gap-2 flex-wrap mb-5">
            {classes.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedClassId === c.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {c.display_name}
              </button>
            ))}
          </div>

          {classSections.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <FiCalendar size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-lg mb-1">No sections found</p>
              <p className="text-sm">Add sections in the Classes page first</p>
            </div>
          ) : (
            /* Section tabs */
            <div>
              <div className="flex gap-1 mb-5 border-b border-slate-200 overflow-x-auto">
                {classSections.map((sec: any) => {
                  const isActive = activeTab === String(sec.id)
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveTab(String(sec.id))}
                      className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive ? "text-blue-700" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Section {sec.name}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>

              {classSections.map((sec: any) => {
                if (activeTab !== String(sec.id)) return null
                const secRoutines = allRoutines.filter((r: any) => r.section_id === sec.id)
                const stats = sectionStats[sec.id]

                return (
                  <div key={sec.id} className="bg-white rounded-xl border border-slate-200">
                    {/* Card header */}
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
                          {selectedClass?.display_name} — Section {sec.name}
                        </h3>
                        <div className="flex items-center gap-3">
                          {stats && (
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <FiUsers size={13} />
                                {stats.teacherCount} teachers
                              </span>
                              <span className="flex items-center gap-1">
                                <FiCalendar size={13} />
                                {stats.filledCount}/{stats.totalSlots} filled
                              </span>
                            </div>
                          )}
                          <button
                            onClick={downloadPDF}
                            disabled={isDownloading}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-50"
                          >
                            <FiDownload size={13} />
                            {isDownloading ? "..." : "PDF"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Grid */}
                    <div>
                      {secRoutines.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <p className="text-sm">No routine generated yet for this section</p>
                        </div>
                      ) : (
                        <div data-pdf-table={sec.id}>
                          {renderRoutineTable(secRoutines)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
