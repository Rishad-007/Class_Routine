"use client"

import { useState, useEffect } from "react"
import { FiEdit2 } from "react-icons/fi"
import { AddTeacherDialog } from "@/components/teachers/add-teacher-dialog"

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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teachers</h1>
          <p className="text-slate-500 mt-1">Manage teachers and their subject assignments</p>
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

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm mb-6">{error}</div>}

      {loading ? <div className="text-center py-12 text-slate-400">Loading...</div>
      : teachers.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-lg mb-2">No teachers added yet</p>
          <p className="text-sm">Click &ldquo;Add Teacher&rdquo; to get started</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/50">
                <th className="text-left p-4 font-medium text-slate-500">Name</th>
                <th className="text-left p-4 font-medium text-slate-500">ID</th>
                <th className="text-left p-4 font-medium text-slate-500">Subjects & Load</th>
                <th className="text-left p-4 font-medium text-slate-500">Class Teacher</th>
                <th className="text-right p-4 font-medium text-slate-500 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher: any) => {
                const subs = teacherSubjects.filter((ts: any) => ts.teacher_id === teacher.id)
                const ct = classTeachers.find((ct: any) => ct.teacher_id === teacher.id)
                return (
                  <tr key={teacher.id} className="border-b border-slate-100">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                          {teacher.name.charAt(0)}
                        </div>
                        <span className="font-medium">{teacher.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-sm">{teacher.teacher_id}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {subs.map((ts: any) => (
                          <span key={ts.id} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                            {ts.subjects?.name} <span className="text-muted-foreground mx-0.5">&middot;</span> {ts.classes?.display_name || `Class ${ts.class_id}`} ({ts.class_load}p/w)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      {ct ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 border-purple-200">
                          {ct.sections?.classes?.display_name} - Sec {ct.sections?.name}
                        </span>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setEditingTeacher(teacher)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit teacher"
                      >
                        <FiEdit2 size={16} className="text-slate-400" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
