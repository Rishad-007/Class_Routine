import { supabase } from "@/lib/supabase"

export function isConfigured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
}

export function notConfiguredResponse() {
  return Response.json(
    { error: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local" },
    { status: 500 }
  )
}

export async function getClasses() {
  const { data, error } = await supabase.from("classes").select("*").order("sort_order", { ascending: true })
  if (error) throw error
  return data
}

export async function getSections(classId?: number) {
  let query = supabase.from("sections").select("*").order("name")
  if (classId) query = query.eq("class_id", classId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getSubjects(classId?: number) {
  let query = supabase.from("subjects").select("*").order("name")
  if (classId) {
    const { data: classData } = await supabase.from("classes").select("*").eq("id", classId).single()
    const className = classData?.name
    const classNum = className ? ["Six", "Seven", "Eight", "Nine", "Ten"].indexOf(className) + 6 : null
    if (classNum) {
      query = query.or(`applicable_classes.is.null,applicable_classes.cs.{${classNum}}`)
    }
  }
  const { data, error } = await query
  if (error) throw error
  return data
}
