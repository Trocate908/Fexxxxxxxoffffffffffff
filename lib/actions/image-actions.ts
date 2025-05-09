"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function checkAndDeleteExpiredImages() {
  const supabase = createServerSupabaseClient()

  try {
    // Get current time
    const now = new Date().toISOString()

    // Find posts with expired images
    const { data: expiredPosts, error: queryError } = await supabase
      .from("posts")
      .select("id, image_url, image_expires_at")
      .not("image_url", "is", null)
      .not("image_expires_at", "is", null)
      .lt("image_expires_at", now)

    if (queryError) {
      console.error("Error querying expired images:", queryError)
      return { error: "Failed to query expired images" }
    }

    if (!expiredPosts || expiredPosts.length === 0) {
      return { message: "No expired images found" }
    }

    // Process each expired post
    for (const post of expiredPosts) {
      try {
        // Extract file path from URL
        if (!post.image_url) continue

        const urlParts = post.image_url.split("/")
        const bucketName = "post-images"
        const filePath = urlParts.slice(-2).join("/") // Get userId/filename.ext format

        // Delete the file from storage
        const { error: deleteStorageError } = await supabase.storage.from(bucketName).remove([filePath])

        if (deleteStorageError) {
          console.error(`Error deleting file ${filePath} from storage:`, deleteStorageError)
        }

        // Update post to remove image URL and expiration
        const { error: updateError } = await supabase
          .from("posts")
          .update({
            image_url: null,
            image_expires_at: null,
          })
          .eq("id", post.id)

        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError)
        }
      } catch (error) {
        console.error(`Error processing expired post ${post.id}:`, error)
      }
    }

    // Revalidate paths to update UI
    revalidatePath("/")
    revalidatePath("/profile")

    return {
      success: true,
      message: `Deleted ${expiredPosts.length} expired image(s)`,
    }
  } catch (error) {
    console.error("Error checking and deleting expired images:", error)
    return { error: "Failed to process expired images" }
  }
}
