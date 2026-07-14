"use client"

import { useState, useEffect, useMemo } from "react"
import { FiEdit2, FiSearch, FiBookOpen, FiUsers, FiStar, FiCalendar, FiAlertTriangle } from "react-icons/fi"
import { AddTeacherDialog } from "@/components/teachers/add-teacher-dialog"
import { TeacherRoutineDialog } from "@/components/teachers/teacher-routine-dialog"
import { getCategoryColor } from "@/lib/types"

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([])
  const [classTeachers, setClassTeachers] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null)
  const [routineTeacher, setRoutineTeacher] = useState<any | null>(null)
  const [search, setSearch] = useState("")

  const fetchData = async () => {
    setLoading(true); setError("")
    try {
      const [t, s, c, sec, ts, ct] = await Promise.all([
        fetch("/api/teachers"), fetch("/api/subjects"), fetch("/api/classes"),
        fetch("/api/sections"), fetch("/api/teacher-subjects"), fetch("/api/class-teachers"),
      ])
      if (!t.ok || !s.ok) throw new Error("Database not configured")
      setTeachers(await t.json()); setSubjects(await s.json()); setClasses(await c.json())
      setSections(await sec.json()); setTeacherSubjects(await ts.json()); setClassTeachers(await ct.json())
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachers
    const q = search.toLowerCase()
    return teachers.filter((t: any) =>
      t.name.toLowerCase().includes(q) || t.teacher_id.toLowerCase().includes(q)
    )
  }, [teachers, search])

  const totalSubjectAssignments = teacherSubjects.length
  const activeTeachers = teachers.length

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 mb-6 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-purple-500/10 rounded-full -mb-16" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium mb-2">
              <FiUsers size={14} />
              <span>{activeTeachers} teacher{activeTeachers !== 1 ? "s" : ""}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Teachers</h1>
            <p className="text-indigo-200 text-sm">Manage teachers, subject assignments, and class teachers</p>
          </div>
          <AddTeacherDialog
            onTeacherAdded={fetchData}
            classes={classes}
            subjects={subjects}
            sections={sections}
            editingTeacher={editingTeacher}
            teacherSubjects={teacherSubjects}
            classTeachers={classTeachers}
            onClose={() => setEditingTeacher(null)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm mb-6 flex items-center gap-2">
          <FiAlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <FiUsers size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{activeTeachers}</div>
              <div className="text-xs text-slate-500">Teachers</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <FiBookOpen size={18} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{totalSubjectAssignments}</div>
              <div className="text-xs text-slate-500">Subject Assignments</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <FiStar size={18} className="text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{classTeachers.length}</div>
              <div className="text-xs text-slate-500">Class Teachers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-slate-200" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-28 mb-1.5" />
                  <div className="h-3 bg-slate-100 rounded w-16" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="h-5 bg-slate-100 rounded w-16" />
                <div className="h-5 bg-slate-100 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <FiUsers size={40} className="mx-auto mb-4 text-slate-300" />
          <p className="text-lg mb-1">{search ? "No teachers match your search" : "No teachers added yet"}</p>
          <p className="text-sm">{search ? "Try a different name or ID" : 'Click "Add Teacher" to get started'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher: any) => {
            const subs = teacherSubjects.filter((ts: any) => ts.teacher_id === teacher.id)
            const ct = classTeachers.find((ct: any) => ct.teacher_id === teacher.id)

            // Group subjects by class
            const byClass: Record<string, { name: string; load: number; color: string }[]> = {}
            for (const ts of subs) {
              const className = ts.classes?.display_name || `Class ${ts.class_id}`
              if (!byClass[className]) byClass[className] = []
              byClass[className].push({
                name: ts.subjects?.name || "?",
                load: ts.class_load || 0,
                color: getCategoryColor(ts.subjects?.category),
              })
            }
            const classEntries = Object.entries(byClass)

            return (
              <div
                key={teacher.id}
                className="group relative bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-200 transition-all cursor-pointer"
                onClick={() => setRoutineTeacher(teacher)}
              >
                {/* Edit button top-right */}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingTeacher(teacher) }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all"
                  title="Edit teacher"
                >
                  <FiEdit2 size={13} className="text-slate-400" />
                </button>

                {/* Avatar + Name row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {teacher.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{teacher.name}</h3>
                      {ct && <FiStar size={11} className="shrink-0 text-amber-400 fill-amber-400" />}
                      <FiCalendar size={12} className="shrink-0 text-indigo-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">{teacher.teacher_id} · max {teacher.max_per_day ?? 5}/day</div>
                  </div>
                </div>

                {/* Subjects by class */}
                {classEntries.length > 0 ? (
                  <div className="space-y-1.5">
                    {classEntries.slice(0, 3).map(([className, subjects]) => (
                      <div key={className}>
                        <div className="text-[10px] font-semibold text-slate-500 mb-0.5">{className}</div>
                        <div className="flex flex-wrap gap-1">
                          {subjects.map((s, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${s.color}`}
                            >
                              {s.name.length > 10 ? s.name.slice(0, 8) + "…" : s.name}
                              <span className="opacity-70">{s.load}pw</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {classEntries.length > 3 && (
                      <div className="text-[10px] text-slate-400">+{classEntries.length - 3} more classes</div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">No subjects</div>
                )}

                {/* CT badge */}
                {ct && (
                  <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 inline-flex items-center gap-1">
                    <FiStar size={10} />
                    CT — {ct.sections?.classes?.display_name} Sec {ct.sections?.name}
                  </div>
                )}

                {/* Routine hint */}
                <div className="mt-2 text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <FiCalendar size={11} />
                  Click to view routine
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TeacherRoutineDialog
        teacher={routineTeacher}
        open={!!routineTeacher}
        onClose={() => setRoutineTeacher(null)}
      />
    </div>
  )
}
