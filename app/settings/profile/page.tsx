import { redirect } from "next/navigation"
import { getSession, getProfile } from "@/lib/supabase/server"
import { ProfileEditor } from "@/components/profile-editor"

export default async function ProfileSettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const profile = await getProfile()

  if (!profile) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
      <ProfileEditor initialProfile={profile} />
    </div>
  )
}
