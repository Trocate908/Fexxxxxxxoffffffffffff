"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      error: "Not authenticated",
    }
  }

  const username = formData.get("username") as string
  const fullName = formData.get("full_name") as string
  const bio = formData.get("bio") as string

  if (!username?.trim()) {
    return {
      error: "Username is required",
    }
  }

  // Check if username is already taken (except by current user)
  const { data: existingUser, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", session.user.id)
    .maybeSingle()

  if (checkError) {
    console.error("Error checking username:", checkError)
    return {
      error: "Failed to update profile",
    }
  }

  if (existingUser) {
    return {
      error: "Username is already taken",
    }
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      full_name: fullName || null,
      bio: bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.user.id)

  if (error) {
    console.error("Error updating profile:", error)
    return {
      error: "Failed to update profile",
    }
  }

  revalidatePath("/settings/profile")
  revalidatePath(`/profile/${username}`)

  return { success: true }
}

export async function uploadAvatar(file: File) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      error: "Not authenticated",
    }
  }

  try {
    // Check if avatars bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === "avatars")

    if (!bucketExists) {
      // Create the bucket with public access
      await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 2097152, // 2MB
      })
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`

    // Upload file
    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true })

    if (uploadError) throw uploadError

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName)

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id)

    if (updateError) throw updateError

    revalidatePath("/settings/profile")

    return { url: publicUrl }
  } catch (error: any) {
    console.error("Error uploading avatar:", error)
    return {
      error: error.message || "Failed to upload avatar",
    }
  }
}
