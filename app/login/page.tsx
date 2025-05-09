import { AuthForm } from "@/components/auth/auth-form"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/")
  }

  return (
    <div className="container mx-auto max-w-screen-md py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Welcome to FlexOff</h1>
      <AuthForm />
    </div>
  )
}
