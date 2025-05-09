import { PostFeed } from "@/components/post-feed"
import { CreatePostForm } from "@/components/create-post-form"
import { getSession } from "@/lib/supabase/server"
import { getTrendingTopics } from "@/lib/actions/post-actions"
import { initializeStorage } from "@/lib/supabase/init-storage"

export default async function Home() {
  const session = await getSession()
  const { topics } = await getTrendingTopics()

  // Initialize storage buckets if needed
  await initializeStorage()

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Fitness Feed</h1>
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <PostFeed />
        </div>
        <div className="space-y-6">
          <CreatePostForm />
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium mb-2">Trending Topics</h3>
            <ul className="space-y-2">
              {topics.length > 0
                ? topics.map((topic) => (
                    <li key={topic.tag} className="text-sm">
                      <a href={`/tags/${topic.tag.replace("#", "")}`} className="text-blue-500 hover:underline">
                        {topic.tag} ({topic.count})
                      </a>
                    </li>
                  ))
                : ["#fitness", "#workout", "#gains", "#nutrition", "#progress"].map((topic) => (
                    <li key={topic} className="text-sm">
                      <a href="#" className="text-blue-500 hover:underline">
                        {topic}
                      </a>
                    </li>
                  ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
