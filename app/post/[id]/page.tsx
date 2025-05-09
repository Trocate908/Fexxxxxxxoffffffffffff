import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CommentsSection } from "@/components/comments-section"
import { PostDetail } from "@/components/post-detail"

export default async function PostPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = createServerSupabaseClient()

  // Get post data
  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:user_id (id, username, full_name, avatar_url),
      likes (id, user_id),
      comments (id)
    `)
    .eq("id", id)
    .single()

  if (error || !post) {
    redirect("/") // Redirect to home if post not found
  }

  // Get current user to check if they liked the post
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id

  const formattedPost = {
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
    liked_by_user: userId ? post.likes.some((like: any) => like.user_id === userId) : false,
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <PostDetail post={formattedPost} />
        <div className="mt-8">
          <CommentsSection postId={post.id} />
        </div>
      </div>
    </div>
  )
}
