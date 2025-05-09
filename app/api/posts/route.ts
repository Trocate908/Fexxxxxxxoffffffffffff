import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get current user to check if they liked each post
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id

  const formattedPosts = posts.map((post) => ({
    id: post.id,
    content: post.content,
    image_url: post.image_url,
    image_expires_at: post.image_expires_at,
    created_at: post.created_at,
    user: {
      id: post.profiles.id,
      name: post.profiles.full_name || post.profiles.username,
      username: post.profiles.username,
      avatar_url: post.profiles.avatar_url,
    },
    likes_count: post.likes.length,
    comments_count: post.comments.length,
    liked_by_user: userId ? post.likes.some((like) => like.user_id === userId) : false,
  }))

  return NextResponse.json(formattedPosts)
}
