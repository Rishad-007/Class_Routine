"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FiUsers, FiLayers, FiCalendar, FiBookOpen, FiChevronRight, FiClock, FiCheckCircle, FiAlertTriangle, FiBarChart2 } from "react-icons/fi"

const quickLinks = [
  { label: "Manage Teachers", href: "/teachers", desc: "Add, edit, and assign subjects to teachers", icon: FiUsers, color: "bg-blue-500" },
  { label: "Setup Classes", href: "/classes", desc: "Configure classes and add sections", icon: FiLayers, color: "bg-indigo-500" },
  { label: "Generate Routine", href: "/generate", desc: "Auto-generate and edit class routines", icon: FiCalendar, color: "bg-emerald-500" },
  { label: "View Routines", href: "/view", desc: "Browse routines by section or search teacher", icon: FiBookOpen, color: "bg-amber-500" },
]

export default function Dashboard() {
  const [stats, setStats] = useState({ teachers: "—", classes: "—", sections: "—", routines: "—", filled: "—", total: "—" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const [tRes, cRes, sRes, rRes] = await Promise.all([
          fetch("/api/teachers"),
          fetch("/api/classes"),
          fetch("/api/sections"),
          fetch("/api/routines"),
        ])
        const teachers = tRes.ok ? (await tRes.json()).length : "—"
        const classes = cRes.ok ? (await cRes.json()) : []
        const sections = sRes.ok ? (await sRes.json()).length : "—"
        const routines = rRes.ok ? (await rRes.json()).routines || [] : []

        const classCount = Array.isArray(classes) ? classes.length : "—"
        const filledCount = routines.length

        setStats({
          teachers: String(teachers),
          classes: String(classCount),
          sections: String(sections),
          routines: String(routines.length > 0 ? "Generated" : "None"),
          filled: String(filledCount),
          total: String(Array.isArray(classes) ? classes.reduce((sum: number, c: any) => sum + (c.periods_count || 0) * (c.sections?.length || 0) * 5, 0) : 0),
        })
        setLoading(false)
      } catch {
        setError("Could not load data")
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = [
    { label: "Teachers", value: stats.teachers, icon: FiUsers, href: "/teachers", color: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-700" },
    { label: "Classes", value: stats.classes, icon: FiBarChart2, href: "/classes", color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50", text: "text-indigo-700" },
    { label: "Sections", value: stats.sections, icon: FiLayers, href: "/classes", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-700" },
    { label: "Routines", value: stats.routines, icon: FiCalendar, href: "/generate", color: "from-amber-500 to-amber-600", bg: "bg-amber-50", text: "text-amber-700" },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 mb-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-500/10 rounded-full -mb-16" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-300 text-sm font-medium mb-2">
            <FiClock size={14} />
            <span>{new Date().toLocaleDateString("en-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Routine Generator</h1>
          <p className="text-slate-300 max-w-xl">
            Cantonment Public School and College, Rangpur — Class VI to X
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm mb-6 flex items-center gap-2">
          <FiAlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <div className="relative group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden">
                <div className={`absolute inset-0 ${stat.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className={`inline-flex p-2.5 rounded-lg ${stat.bg} mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className={stat.text} />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{loading ? (
                    <span className="inline-block w-12 h-6 bg-slate-200 rounded animate-pulse" />
                  ) : stat.value}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions + Status */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href}>
                  <div className="group relative bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 p-2.5 rounded-lg ${link.color} text-white shadow-sm`}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{link.label}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{link.desc}</p>
                      </div>
                      <FiChevronRight size={16} className="shrink-0 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-1" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* System Status */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">System Status</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Configuration</span>
              <span className="text-sm font-medium text-emerald-700 flex items-center gap-1">
                <FiCheckCircle size={14} />
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Routines Generated</span>
              <span className="text-sm font-medium text-slate-900">
                {loading ? "—" : stats.routines !== "None" ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Classes</span>
              <span className="text-sm font-medium text-slate-900">{stats.classes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Sections</span>
              <span className="text-sm font-medium text-slate-900">{stats.sections}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Teachers</span>
              <span className="text-sm font-medium text-slate-900">{stats.teachers}</span>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <Link href="/generate" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Generate routines <FiChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
