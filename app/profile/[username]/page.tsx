import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfilePosts } from "@/components/profile-posts"
import { FollowButton } from "@/components/follow-button"

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params
  const supabase = createServerSupabaseClient()

  // Get user profile
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("username", username).single()

  if (error || !profile) {
    redirect("/") // Redirect to home if profile not found
  }

  // Get follower and following counts
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id)

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id)

  // Check if current user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const isCurrentUser = session?.user.id === profile.id

  // Check if current user is following this profile
  let isFollowing = false

  if (session && !isCurrentUser) {
    const { data } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", session.user.id)
      .eq("following_id", profile.id)
      .maybeSingle()

    isFollowing = !!data
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="relative">
          <div className="h-48 w-full rounded-xl bg-gradient-to-r from-green-400 to-emerald-600"></div>
          <div className="absolute -bottom-16 left-8">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage
                src={profile.avatar_url || `/placeholder.svg?height=128&width=128&text=${profile.username.charAt(0)}`}
                alt={profile.username}
              />
              <AvatarFallback className="text-4xl">{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="mt-2">{profile.bio}</p>}
            <div className="flex gap-4 mt-2">
              <div>
                <span className="font-bold">{followingCount}</span>{" "}
                <span className="text-muted-foreground">Following</span>
              </div>
              <div>
                <span className="font-bold">{followersCount}</span>{" "}
                <span className="text-muted-foreground">Followers</span>
              </div>
            </div>
          </div>
          {!isCurrentUser && <FollowButton profileId={profile.id} isFollowing={isFollowing} isLoggedIn={!!session} />}
        </div>

        {/* Profile Content */}
        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-6">
            <ProfilePosts userId={profile.id} />
          </TabsContent>
          <TabsContent value="media" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">Media posts will appear here</div>
          </TabsContent>
          <TabsContent value="likes" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">Liked posts will appear here</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
