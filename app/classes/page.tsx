"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { FiPlus, FiTrash2, FiRefreshCw } from "react-icons/fi"

const CLASS_DEFS = [
  { name: "Six", display_name: "Class 6" },
  { name: "Seven", display_name: "Class 7" },
  { name: "Eight", display_name: "Class 8" },
  { name: "Nine", display_name: "Class 9" },
  { name: "Ten", display_name: "Class 10" },
]

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState("")
  const [addingForClassId, setAddingForClassId] = useState<number | null>(null)
  const [sectionName, setSectionName] = useState("")

  const fetchData = async () => {
    setLoading(true); setError("")
    try {
      const [c, s] = await Promise.all([fetch("/api/classes"), fetch("/api/sections")])
      let classesData = c.ok ? await c.json() : []
      const sectionsData = s.ok ? await s.json() : []

      if (classesData.length === 0) {
        setSeeding(true)
        let seedErr = ""
        for (const cls of CLASS_DEFS) {
          const res = await fetch("/api/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: cls.name,
              display_name: cls.display_name,
              periods_count: cls.name === "Nine" || cls.name === "Ten" ? 7 : 6,
              sort_order: CLASS_DEFS.indexOf(cls) + 1,
            }),
          })
          if (res.ok) {
            const newClass = await res.json()
            classesData.push(newClass)
          } else {
            const errData = await res.json().catch(() => ({}))
            seedErr = errData.error || res.statusText
          }
        }
        setSeeding(false)
        if (seedErr) {
          setError(`Database setup failed: ${seedErr}. Run database/schema.sql in your Supabase SQL Editor first.`)
        } else {
          const s2 = await fetch("/api/sections")
          setSections(s2.ok ? await s2.json() : [])
        }
      } else {
        setSections(sectionsData)
      }

      setClasses(classesData)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false); setSeeding(false) }
  }

  useEffect(() => { fetchData() }, [])

  const addSection = async () => {
    if (!sectionName.trim() || !addingForClassId) return
    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: addingForClassId, name: sectionName.trim().toUpperCase() }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed")
      }
      setSectionName("")
      setAddingForClassId(null)
      fetchData()
    } catch (err: any) { toast.error(err.message) }
  }

  const deleteSection = async (id: number) => {
    try {
      await fetch(`/api/sections?id=${id}`, { method: "DELETE" })
      fetchData()
    } catch (err: any) { toast.error(err.message) }
  }

  const getSectionsForClass = (classId: number) => sections.filter((s: any) => s.class_id === classId)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Classes &amp; Sections</h1>
        <p className="text-slate-500 mt-1">Manage classes and their sections</p>
      </div>

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm mb-6">{error}</div>}

      {loading || seeding ? (
        <div className="text-center py-12 text-slate-400">
          {seeding ? (
            <div className="flex items-center justify-center gap-2">
              <FiRefreshCw className="animate-spin" size={18} />
              <span>Setting up classes...</span>
            </div>
          ) : (
            "Loading..."
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((dbClass: any) => {
            const secs = getSectionsForClass(dbClass.id)
            const isAdding = addingForClassId === dbClass.id
            return (
              <div key={dbClass.id} className="rounded-xl border bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                  <h2 className="text-lg font-bold text-white">{dbClass.display_name}</h2>
                  <p className="text-blue-200 text-sm">{secs.length} section{secs.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="p-4">
                  {secs.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No sections added yet</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {secs.map((sec: any) => (
                        <div key={sec.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-slate-700">
                            Section <span className="font-bold">{sec.name}</span>
                          </span>
                          <button onClick={() => deleteSection(sec.id)} className="p-1 hover:bg-red-100 rounded transition-colors">
                            <FiTrash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isAdding ? (
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                        placeholder="e.g., A"
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSection()}
                        autoFocus
                      />
                      <button onClick={addSection} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors">Add</button>
                      <button onClick={() => { setAddingForClassId(null); setSectionName("") }} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingForClassId(dbClass.id); setSectionName("") }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all"
                    >
                      <FiPlus size={16} /> Add Section
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
