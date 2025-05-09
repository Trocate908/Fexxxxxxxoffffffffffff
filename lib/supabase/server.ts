import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"
import type { Database } from "@/lib/supabase/database.types"

export const createServerSupabaseClient = cache(() => {
  const cookieStore = cookies()

  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: { path: string; maxAge: number; sameSite: string; httpOnly: boolean }) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: { path: string }) {
        cookieStore.set({ name, value: "", ...options, maxAge: -1 })
      },
    },
  })
})

export async function getSession() {
  const supabase = createServerSupabaseClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function getProfile() {
  const session = await getSession()
  if (!session) return null

  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  return data
}
