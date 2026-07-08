import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"

export async function GET(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  const { searchParams } = new URL(request.url)
  const classId = searchParams.get("class_id")
  let query = supabase.from("subjects").select("*").order("name")
  if (classId) {
    const { data: cls } = await supabase.from("classes").select("name").eq("id", classId).single()
    if (cls) {
      const classNames = ["Six", "Seven", "Eight", "Nine", "Ten"]
      const classNum = classNames.indexOf(cls.name) + 6
      if (classNum) query = query.or(`applicable_classes.is.null,applicable_classes.cs.{${classNum}}`)
    }
  }
  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
