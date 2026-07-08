import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Routine Generator - Cantonment Public School & College, Rangpur",
  description: "Class routine generation system for Cantonment Public School and College, Rangpur",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Sidebar />
        <main className="lg:pl-64 min-h-screen bg-slate-50">
          <div className="p-6 lg:p-8 pt-16 lg:pt-8">
            {children}
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  )
}
