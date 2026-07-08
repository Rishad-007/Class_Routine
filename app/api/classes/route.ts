import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"

export async function GET() {
  if (!isConfigured()) return notConfiguredResponse()
  const { data, error } = await supabase.from("classes").select("*").order("sort_order")
  if (error) return Response.json({ error: error.message }, { status: 500 })
  const classesWithSections = await Promise.all(
    data.map(async (cls: any) => {
      const { data: sections } = await supabase.from("sections").select("*").eq("class_id", cls.id).order("name")
      return { ...cls, sections: sections || [] }
    })
  )
  return Response.json(classesWithSections)
}

export async function POST(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  const body = await request.json()
  const { data, error } = await supabase.from("classes").insert(body).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
