import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"
import { generateRoutine } from "@/lib/generator"

export async function POST(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  try {
    const body = await request.json()

    if (body.generate_all) {
      const { data: allClasses } = await supabase
        .from("classes")
        .select("*")
        .order("sort_order")

      if (!allClasses || allClasses.length === 0) {
        return Response.json({ error: "No classes found" }, { status: 400 })
      }

      const shuffled = [...allClasses].sort(() => Math.random() - 0.5)

      const results = []
      for (const cls of shuffled) {
        const result = await generateRoutine(cls.id)
        results.push(result)
      }

      return Response.json({ results, generate_all: true })
    }

    const { class_id } = body
    if (!class_id) return Response.json({ error: "class_id is required" }, { status: 400 })
    const result = await generateRoutine(class_id)
    return Response.json(result)
  } catch (error: any) {
    return Response.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}
