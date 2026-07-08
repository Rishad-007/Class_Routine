import Link from "next/link"

const stats = [
  { label: "Teachers", value: "—", href: "/teachers", color: "from-purple-500 to-purple-600" },
  { label: "Classes", value: "5", href: "/classes", color: "from-pink-500 to-rose-600" },
  { label: "Sections", value: "—", href: "/classes", color: "from-orange-500 to-amber-600" },
  { label: "Periods/Day", value: "6-7", href: "/generate", color: "from-sky-500 to-cyan-600" },
]

const quickLinks = [
  { label: "Manage Teachers", href: "/teachers", desc: "Add, edit, and assign subjects to teachers" },
  { label: "Setup Classes", href: "/classes", desc: "Configure classes and add sections" },
  { label: "Generate Routine", href: "/generate", desc: "Auto-generate class routines" },
  { label: "View Routines", href: "/view", desc: "View and search generated routines" },
]

export default function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Cantonment Public School and College, Rangpur</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-5 hover:shadow-md transition-shadow group cursor-pointer">
              <div className={`absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <svg className="text-slate-400 mb-3 group-hover:text-purple-600 transition-colors" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="rounded-xl bg-white border border-slate-200 p-5 hover:border-purple-300 hover:shadow-md transition-all group">
                <h3 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">{link.label}</h3>
                <p className="text-sm text-slate-500 mt-1">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
