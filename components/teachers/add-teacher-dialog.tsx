"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { FiPlus, FiTrash2 } from "react-icons/fi"
import { toast } from "sonner"
import { SUBJECT_CATEGORIES } from "@/lib/types"

interface Props {
  onTeacherAdded?: () => void
  classes: any[]
  subjects: any[]
  sections: any[]
  editingTeacher?: any | null
  teacherSubjects?: any[]
  classTeachers?: any[]
  onClose?: () => void
}

export function AddTeacherDialog({ onTeacherAdded, classes, subjects, sections, editingTeacher, teacherSubjects, classTeachers, onClose }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [isCT, setIsCT] = useState(false)
  const [ctSectionId, setCtSectionId] = useState("")
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editingTeacher) {
      setName(editingTeacher.name)
      setTeacherId(editingTeacher.teacher_id)
      setPhotoUrl(editingTeacher.photo_url || "")

      const mySubjects = teacherSubjects?.filter((ts: any) => ts.teacher_id === editingTeacher.id) || []
      const grouped: Record<string, { subject_id: number; class_load: number; class_ids: number[] }> = {}
      for (const ts of mySubjects) {
        const key = `${ts.subject_id}-${ts.class_load}`
        if (!grouped[key]) {
          grouped[key] = { subject_id: ts.subject_id, class_load: ts.class_load, class_ids: [] }
        }
        grouped[key].class_ids.push(ts.class_id)
      }
      setAssignments(Object.values(grouped))

      const myCT = classTeachers?.find((ct: any) => ct.teacher_id === editingTeacher.id)
      if (myCT) {
        setIsCT(true)
        setCtSectionId(String(myCT.section_id))
      } else {
        setIsCT(false)
        setCtSectionId("")
      }

      setOpen(true)
    }
  }, [editingTeacher, teacherSubjects, classTeachers])

  useEffect(() => {
    if (!open) {
      resetForm()
      onClose?.()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setName("")
    setTeacherId("")
    setPhotoUrl("")
    setIsCT(false)
    setCtSectionId("")
    setAssignments([])
  }

  const catSubjects = subjects.reduce((acc: any, s: any) => {
    const cat = SUBJECT_CATEGORIES[s.category] || s.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const addAssignment = () => setAssignments([...assignments, { subject_id: 0, class_ids: [], class_load: 0 }])

  const toggleClass = (idx: number, classId: number) => {
    const u = [...assignments]
    const ids = u[idx].class_ids
    u[idx] = { ...u[idx], class_ids: ids.includes(classId) ? ids.filter((id: number) => id !== classId) : [...ids, classId] }
    setAssignments(u)
  }

  const saveRows = async (teacherId: number) => {
    for (const a of assignments) {
      if (a.subject_id && a.class_ids.length > 0 && a.class_load > 0) {
        for (const classId of a.class_ids) {
          const res = await fetch("/api/teacher-subjects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teacher_id: teacherId, subject_id: a.subject_id, class_id: classId, class_load: a.class_load }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            console.warn(`Failed to save subject ${a.subject_id} for class ${classId}:`, err.error || res.statusText)
          }
        }
      }
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !teacherId.trim()) { toast.error("Name and Teacher ID are required"); return }
    setLoading(true)
    try {
      if (editingTeacher) {
        const res = await fetch(`/api/teachers/${editingTeacher.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), teacher_id: teacherId.trim(), photo_url: photoUrl || null }),
        })
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update teacher")

        const existingSubjects = teacherSubjects?.filter((ts: any) => ts.teacher_id === editingTeacher.id) || []
        for (const ts of existingSubjects) {
          await fetch(`/api/teacher-subjects/${ts.id}`, { method: "DELETE" })
        }
        await saveRows(editingTeacher.id)

        const existingCT = classTeachers?.find((ct: any) => ct.teacher_id === editingTeacher.id)
        if (existingCT) {
          await fetch(`/api/class-teachers?id=${existingCT.id}`, { method: "DELETE" })
        }
        if (isCT && ctSectionId) {
          await fetch("/api/class-teachers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teacher_id: editingTeacher.id, section_id: parseInt(ctSectionId) }),
          })
        }

        toast.success("Teacher updated")
      } else {
        const res = await fetch("/api/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), teacher_id: teacherId.trim(), photo_url: photoUrl || null }),
        })
        if (!res.ok) throw new Error((await res.json()).error || "Failed")
        const teacher = await res.json()
        await saveRows(teacher.id)
        if (isCT && ctSectionId) {
          await fetch("/api/class-teachers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teacher_id: teacher.id, section_id: parseInt(ctSectionId) }),
          })
        }
        toast.success("Teacher added")
      }

      setOpen(false)
      onTeacherAdded?.()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!editingTeacher && (
        <DialogTrigger asChild><Button><FiPlus className="mr-2" size={16} /> Add Teacher</Button></DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
          <DialogDescription>{editingTeacher ? "Update teacher details below." : "Fill in the teacher details below."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
          <div><Label>Teacher ID *</Label><Input value={teacherId} onChange={e => setTeacherId(e.target.value)} placeholder="e.g., T001" /></div>
          <div><Label>Photo URL (optional)</Label><Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Subject Assignments</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAssignment}><FiPlus className="mr-1" size={14} /> Add Subject</Button>
            </div>
            {assignments.map((a, i) => (
              <div key={i} className="border rounded-lg p-3 mb-3 space-y-3 bg-slate-50">
                <div className="flex justify-between"><span className="text-sm font-medium">Assignment #{i + 1}</span>
                  <button onClick={() => setAssignments(assignments.filter((_, j) => j !== i))}><FiTrash2 className="text-red-500" size={14} /></button>
                </div>
                <div><Label>Subject</Label>
                  <Select value={String(a.subject_id || "")} onValueChange={v => { const u = [...assignments]; u[i] = { ...u[i], subject_id: parseInt(v) }; setAssignments(u) }}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{Object.entries(catSubjects).map(([cat, subjs]: any) => (
                      <SelectGroup key={cat}><SelectLabel className="text-xs text-purple-600">{cat}</SelectLabel>
                        {subjs.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectGroup>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Classes</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {classes.map((c: any) => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={a.class_ids.includes(c.id)}
                          onChange={() => toggleClass(i, c.id)}
                          className="accent-purple-600 w-4 h-4"
                        />
                        {c.display_name}
                      </label>
                    ))}
                  </div>
                </div>
                <div><Label>Class Load (periods/week)</Label>
                  <Input type="number" min={0} max={30} value={a.class_load || ""} onChange={e => { const u = [...assignments]; u[i] = { ...u[i], class_load: parseInt(e.target.value) || 0 }; setAssignments(u) }} placeholder="e.g., 4" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Class Teacher</Label>
              <Switch checked={isCT} onCheckedChange={setIsCT} />
            </div>
            {isCT && (
              <div><Label>Section</Label>
                <Select value={ctSectionId} onValueChange={setCtSectionId}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>{classes.map((cls: any) => (
                    <SelectGroup key={cls.id}><SelectLabel className="text-xs text-purple-600">{cls.display_name}</SelectLabel>
                      {sections.filter((s: any) => s.class_id === cls.id).map((sec: any) => (
                        <SelectItem key={sec.id} value={String(sec.id)}>{cls.display_name} - Section {sec.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}</SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : editingTeacher ? "Save Changes" : "Add Teacher"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
