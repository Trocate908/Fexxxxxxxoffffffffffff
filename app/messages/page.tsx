import { redirect } from "next/navigation"
import { getSession } from "@/lib/supabase/server"
import { MessagingInterface } from "@/components/messaging-interface"

export default async function MessagesPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Messages</h1>
      <MessagingInterface userId={session.user.id} />
    </div>
  )
}
