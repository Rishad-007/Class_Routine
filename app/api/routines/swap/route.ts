import { supabase } from "@/lib/supabase"
import { isConfigured, notConfiguredResponse } from "@/lib/db"
import { validateSwap } from "@/lib/validator"

export async function GET(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  try {
    const { searchParams } = new URL(request.url)
    const e1 = searchParams.get("e1")
    const e2 = searchParams.get("e2")
    if (!e1 || !e2) {
      return Response.json({ error: "Both e1 and e2 query params are required" }, { status: 400 })
    }
    const { data: entry1 } = await supabase
      .from("routines")
      .select("*, teachers(*), subjects(*)")
      .eq("id", e1)
      .single()
    const { data: entry2 } = await supabase
      .from("routines")
      .select("*, teachers(*), subjects(*)")
      .eq("id", e2)
      .single()
    if (!entry1 || !entry2) {
      return Response.json({ error: "One or both routine entries not found" }, { status: 404 })
    }
    const warnings = await validateSwap(entry1, entry2)
    return Response.json({ valid: warnings.length === 0, warnings })
  } catch (error: any) {
    return Response.json({ error: error.message || "Validation failed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isConfigured()) return notConfiguredResponse()
  try {
    const body = await request.json()
    const { entry1_id, entry2_id } = body

    if (!entry1_id || !entry2_id) {
      return Response.json({ error: "Both entry1_id and entry2_id are required" }, { status: 400 })
    }

    if (entry1_id === entry2_id) {
      return Response.json({ error: "Cannot swap an entry with itself" }, { status: 400 })
    }

    const { data: entry1 } = await supabase
      .from("routines")
      .select("*, teachers(*), subjects(*)")
      .eq("id", entry1_id)
      .single()

    const { data: entry2 } = await supabase
      .from("routines")
      .select("*, teachers(*), subjects(*)")
      .eq("id", entry2_id)
      .single()

    if (!entry1 || !entry2) {
      return Response.json({ error: "One or both routine entries not found" }, { status: 404 })
    }

    const warnings = await validateSwap(entry1, entry2)

    if (warnings.some(w => w.includes("Nothing to swap"))) {
      return Response.json({ error: warnings[0] }, { status: 400 })
    }

    // Perform swap
    const now = new Date().toISOString()

    const { error: err1 } = await supabase
      .from("routines")
      .update({
        teacher_id: entry2.teacher_id,
        subject_id: entry2.subject_id,
        is_class_teacher_period: entry2.is_class_teacher_period,
        updated_at: now,
      })
      .eq("id", entry1_id)

    if (err1) {
      return Response.json({ error: `Swap failed: ${err1.message}` }, { status: 500 })
    }

    const { error: err2 } = await supabase
      .from("routines")
      .update({
        teacher_id: entry1.teacher_id,
        subject_id: entry1.subject_id,
        is_class_teacher_period: entry1.is_class_teacher_period,
        updated_at: now,
      })
      .eq("id", entry2_id)

    if (err2) {
      // Rollback first update
      await supabase
        .from("routines")
        .update({
          teacher_id: entry1.teacher_id,
          subject_id: entry1.subject_id,
          is_class_teacher_period: entry1.is_class_teacher_period,
          updated_at: now,
        })
        .eq("id", entry1_id)
      return Response.json({ error: `Swap failed on second entry: ${err2.message}` }, { status: 500 })
    }

    const { data: updated1 } = await supabase
      .from("routines")
      .select("*, teachers(*), subjects(*)")
      .eq("id", entry1_id)
      .single()

    const { data: updated2 } = await supabase
      .from("routines")
      .select("*, teachers(*), subjects(*)")
      .eq("id", entry2_id)
      .single()

    return Response.json({
      entry1: updated1,
      entry2: updated2,
      warnings: warnings.filter(w => !w.includes("Nothing to swap")),
    })
  } catch (error: any) {
    return Response.json({ error: error.message || "Swap failed" }, { status: 500 })
  }
}
