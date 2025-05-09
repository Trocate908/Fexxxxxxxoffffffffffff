"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getPosts() {
  const supabase = createServerSupabaseClient()

  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:user_id (id, username, full_name, avatar_url),
      likes (id, user_id),
      comments (id)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error fetching posts:", error)
    return []
  }

  return posts.map((post) => ({
    id: post.id,
    content: post.content,
    image_url: post.image_url,
    created_at: post.created_at,
    user: {
      id: post.profiles.id,
      name: post.profiles.full_name || post.profiles.username,
      username: post.profiles.username,
      avatar_url: post.profiles.avatar_url,
    },
    likes_count: post.likes.length,
    comments_count: post.comments.length,
    liked_by_user: false, // This will be updated client-side
  }))
}

export async function createPost(formData: FormData) {
  const content = formData.get("content") as string
  const imageUrl = formData.get("imageUrl") as string | null

  if (!content?.trim()) {
    return {
      error: "Post content cannot be empty",
    }
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      error: "You must be logged in to create a post",
    }
  }

  const { error } = await supabase.from("posts").insert({
    user_id: session.user.id,
    content,
    image_url: imageUrl,
  })

  if (error) {
    console.error("Error creating post:", error)
    return {
      error: "Failed to create post",
    }
  }

  revalidatePath("/")
  return { success: true }
}

export async function likePost(postId: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      error: "You must be logged in to like a post",
    }
  }

  const { error } = await supabase.from("likes").insert({
    post_id: postId,
    user_id: session.user.id,
  })

  if (error) {
    if (error.code === "23505") {
      // Unique violation
      // User already liked the post, so unlike it
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", session.user.id)
    } else {
      console.error("Error liking post:", error)
      return {
        error: "Failed to like post",
      }
    }
  }

  revalidatePath("/")
  return { success: true }
}

export async function commentOnPost(postId: string, content: string) {
  if (!content?.trim()) {
    return {
      error: "Comment cannot be empty",
    }
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      error: "You must be logged in to comment",
    }
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: session.user.id,
    content,
  })

  if (error) {
    console.error("Error commenting on post:", error)
    return {
      error: "Failed to add comment",
    }
  }

  revalidatePath("/")
  return { success: true }
}

// Add this function to post-actions.ts
export async function getTrendingTopics() {
  const supabase = createServerSupabaseClient()

  // Extract hashtags from post content using regex
  const { data: posts, error } = await supabase
    .from("posts")
    .select("content")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching posts for hashtags:", error)
    return { topics: [] }
  }

  // Extract hashtags and count occurrences
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g
  const hashtags: { [key: string]: number } = {}

  posts.forEach((post) => {
    const matches = post.content.match(hashtagRegex)
    if (matches) {
      matches.forEach((tag) => {
        hashtags[tag] = (hashtags[tag] || 0) + 1
      })
    }
  })

  // Convert to array and sort by count
  const topics = Object.entries(hashtags)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return { topics }
}
