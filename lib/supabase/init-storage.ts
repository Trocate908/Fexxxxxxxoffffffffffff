"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function initializeStorage() {
  try {
    const supabase = createServerSupabaseClient()

    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === "post-images")

    if (!bucketExists) {
      // Create the bucket with public access
      await supabase.storage.createBucket("post-images", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })
      console.log("Created post-images bucket")
    }

    return { success: true }
  } catch (error) {
    console.error("Error initializing storage:", error)
    return { error: "Failed to initialize storage" }
  }
}
