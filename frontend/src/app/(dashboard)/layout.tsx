"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { DemoBar } from "@/components/dashboard/DemoBar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin pb-20">
        <div className="container mx-auto p-6 max-w-7xl">
          {children}
        </div>
      </main>
      <DemoBar />
    </div>
  )
}
