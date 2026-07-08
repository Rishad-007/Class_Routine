import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"
import { generateRoutine } from "@/lib/generator"

export async function POST(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  try {
    const { class_id } = await request.json()
    if (!class_id) return Response.json({ error: "class_id is required" }, { status: 400 })
    const result = await generateRoutine(class_id)
    return Response.json(result)
  } catch (error: any) {
    return Response.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}
