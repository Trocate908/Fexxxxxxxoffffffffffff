import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"
import { ScheduledTasks } from "@/components/scheduled-tasks"
import "@/app/globals.css"

export const metadata = {
  title: "FlexOff",
  description: "Share your fitness journey and achievements",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-4">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} FlexOff. All rights reserved.
              </div>
            </footer>
          </div>
          <Toaster />
          <ScheduledTasks />
        </ThemeProvider>
      </body>
    </html>
  )
}
