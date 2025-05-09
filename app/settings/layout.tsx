import type React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/supabase/server"
import { SettingsSidebar } from "@/components/settings-sidebar"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        <SettingsSidebar />
        <div>{children}</div>
      </div>
    </div>
  )
}
