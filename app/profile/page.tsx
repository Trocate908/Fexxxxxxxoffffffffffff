import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostFeed } from "@/components/post-feed"

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="relative">
          <div className="h-48 w-full rounded-xl bg-gradient-to-r from-blue-400 to-purple-500"></div>
          <div className="absolute -bottom-16 left-8">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src="/placeholder.svg?height=128&width=128" alt="@user" />
              <AvatarFallback className="text-4xl">U</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Alex Johnson</h1>
            <p className="text-muted-foreground">@alexj</p>
            <p className="mt-2">Web developer and designer. Coffee enthusiast. Always learning.</p>
            <div className="flex gap-4 mt-2">
              <div>
                <span className="font-bold">245</span> <span className="text-muted-foreground">Following</span>
              </div>
              <div>
                <span className="font-bold">1.2K</span> <span className="text-muted-foreground">Followers</span>
              </div>
            </div>
          </div>
          <Button>Follow</Button>
        </div>

        {/* Profile Content */}
        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-6">
            <PostFeed />
          </TabsContent>
          <TabsContent value="media" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="aspect-square rounded-md bg-muted overflow-hidden">
                  <img
                    src={`/placeholder.svg?height=300&width=300&text=Image+${item}`}
                    alt={`Media ${item}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="likes" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">No liked posts to show</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
