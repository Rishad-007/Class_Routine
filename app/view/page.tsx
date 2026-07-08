"use client"

import { useState, useEffect } from "react"
import { FiSearch } from "react-icons/fi"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DAYS, DAYS_SHORT } from "@/lib/types"

export default function ViewPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [allRoutines, setAllRoutines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any | null>(null)
  const [searching, setSearching] = useState(false)

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

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    if (selectedClassId) fetchAllRoutines(selectedClassId)
  }, [selectedClassId])

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/routines/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) setSearchResults(await res.json())
    } catch {}
    finally { setSearching(false) }
  }

  const classSections = selectedClassId
    ? sections.filter((s: any) => s.class_id === selectedClassId)
    : []

  const selectedClass = classes.find((c: any) => c.id === selectedClassId)
  const periodsCount = selectedClass?.periods_count || 7
  const currentSectionId = classSections[0]?.id

  const getRoutine = (routinesList: any[], day: number, period: number) =>
    routinesList.find((r: any) => r.day_of_week === day && r.period_number === period)

  const renderRoutineTable = (routineList: any[], highlightTeacherId?: number) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-3 text-left text-sm font-semibold text-slate-500 border-b-2 border-slate-200 bg-slate-50/50 w-24">Period</th>
            {DAYS.map(day => (
              <th key={day} className="p-3 text-left text-sm font-semibold text-slate-500 border-b-2 border-slate-200 bg-slate-50/50">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{DAYS_SHORT[DAYS.indexOf(day)]}</span>
              </th>
            ))}
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
                  const routine = getRoutine(routineList, dayIdx, period)
                  const highlighted = highlightTeacherId && routine?.teacher_id === highlightTeacherId
                  return (
                    <td key={dayIdx} className={`p-3 border-b border-slate-100 ${isTiffin ? "bg-orange-50/50" : highlighted ? "bg-yellow-50" : routine?.is_class_teacher_period ? "bg-purple-50/30" : ""}`}>
                      {isTiffin ? (
                        <span className="text-xs text-orange-400 italic block text-center">Break</span>
                      ) : routine ? (
                        <div>
                          <div className={`text-sm font-medium ${highlighted ? "text-yellow-800" : "text-slate-800"}`}>{routine.teachers?.name}</div>
                          <div className="text-xs text-slate-400">{routine.subjects?.name}</div>
                          {routine.is_class_teacher_period && (
                            <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-[10px] px-1.5 py-0.5 mt-1">CT</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">—</span>
                      )}
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">View Routine</h1>
        <p className="text-slate-500 mt-1">Browse class routines and search by teacher</p>
      </div>

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm mb-6">{error}</div>}

      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-purple-400"
              placeholder="Search by teacher name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {searching ? "Searching..." : "Search"}
          </button>
          {searchResults && (
            <button
              onClick={() => { setSearchResults(null); setSearchQuery("") }}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : searchResults ? (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Results for &ldquo;{searchQuery}&rdquo;
            {searchResults.teachers && (
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({searchResults.teachers.length} teacher{searchResults.teachers.length !== 1 ? "s" : ""} found)
              </span>
            )}
          </h2>
          {searchResults.routines?.length > 0 ? (
            <div className="space-y-6">
              {searchResults.teachers?.map((teacher: any) => {
                const teacherRoutines = searchResults.routines.filter((r: any) => r.teacher_id === teacher.id)
                if (teacherRoutines.length === 0) return null
                const sectionsByClass: Record<string, any[]> = {}
                teacherRoutines.forEach((r: any) => {
                  const key = `${r.sections?.classes?.display_name || "Unknown"} - Section ${r.sections?.name || "?"}`
                  if (!sectionsByClass[key]) sectionsByClass[key] = []
                  sectionsByClass[key].push(r)
                })
                return (
                  <div key={teacher.id} className="bg-white rounded-xl border overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4">
                      <h3 className="font-bold text-white">{teacher.name}</h3>
                      <p className="text-purple-200 text-sm">{teacher.teacher_id}</p>
                    </div>
                    <div className="p-4 space-y-6">
                      {Object.entries(sectionsByClass).map(([cls, routines]) => (
                        <div key={cls}>
                          <h4 className="text-sm font-semibold text-slate-600 mb-3">{cls}</h4>
                          {renderRoutineTable(routines, teacher.id)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-lg mb-2">No routines found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Class</label>
            <select
              value={selectedClassId || ""}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 bg-white"
            >
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.display_name}</option>
              ))}
            </select>
          </div>

          {classSections.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-lg mb-2">No sections found</p>
            </div>
          ) : (
            <Tabs defaultValue={String(currentSectionId)}>
              <TabsList className="mb-6">
                {classSections.map((sec: any) => (
                  <TabsTrigger key={sec.id} value={String(sec.id)}>Section {sec.name}</TabsTrigger>
                ))}
              </TabsList>
              {classSections.map((sec: any) => {
                const sectionRoutines = allRoutines.filter((r: any) => r.section_id === sec.id)
                return (
                  <TabsContent key={sec.id} value={String(sec.id)}>
                    <div className="bg-white rounded-xl border">
                      <div className="p-4 border-b">
                        <h3 className="font-semibold text-slate-800">{selectedClass?.display_name} - Section {sec.name}</h3>
                      </div>
                      <div className="p-4">
                        {sectionRoutines.length === 0 ? (
                          <div className="text-center py-8 text-slate-400">
                            <p>No routine generated yet for this section</p>
                          </div>
                        ) : (
                          renderRoutineTable(sectionRoutines)
                        )}
                      </div>
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          )}
        </>
      )}
    </div>
  )
}
