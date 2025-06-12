import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface FeedProps {
  user: any;
}

export default function Feed({ user }: FeedProps) {
  const [newPostContent, setNewPostContent] = useState("");
  const { toast } = useToast();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['/api/posts/feed'],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string }) => {
      const response = await apiRequest("POST", "/api/posts", postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
      setNewPostContent("");
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    createPostMutation.mutate({ content: newPostContent });
  };

  const handleLikePost = (postId: number) => {
    likePostMutation.mutate(postId);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center">Loading feed...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="hidden md:block md:col-span-3">
          <div className="sticky top-20 space-y-4">
            {/* User Profile Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.profilePicture} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <h3 className="font-semibold">{user.username}</h3>
                      {user.isVerified && (
                        <div className="verified-badge w-4 h-4 rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-medium-gray">{user.bio || "WhatsUp User"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Quick Actions</h3>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start">
                    <i className="fas fa-user-friends facebook-blue w-5 mr-3"></i>
                    Find Friends
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <i className="fas fa-calendar-alt facebook-blue w-5 mr-3"></i>
                    Events
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <i className="fas fa-users facebook-blue w-5 mr-3"></i>
                    Groups
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Feed */}
        <div className="md:col-span-6">
          {/* Stories Section */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 overflow-x-auto hide-scrollbar">
                {/* Create Story */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img 
                      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&h=200" 
                      alt="Create Story Background" 
                      className="w-24 h-32 rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg"></div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-8 h-8 bg-facebook-blue rounded-full flex items-center justify-center">
                        <i className="fas fa-plus text-white"></i>
                      </div>
                    </div>
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs font-medium">Create</div>
                  </div>
                </div>
                
                {/* Friend Stories */}
                {users.slice(0, 3).map((friend: any) => (
                  <div key={friend.id} className="flex-shrink-0">
                    <div className="story-ring rounded-lg">
                      <img 
                        src={friend.profilePicture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"} 
                        alt={`${friend.username}'s Story`} 
                        className="w-24 h-32 rounded-lg object-cover"
                      />
                    </div>
                    <div className="text-xs text-center mt-1 font-medium">{friend.firstName || friend.username}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create Post */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.profilePicture} alt={user.username} />
                  <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder={`What's on your mind, ${user.firstName || user.username}?`}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="flex-1 bg-hover-gray border-0 rounded-full resize-none h-10 px-4 py-2"
                />
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t">
                <Button variant="ghost" className="flex items-center space-x-2 text-medium-gray">
                  <i className="fas fa-video text-red-500"></i>
                  <span className="hidden sm:inline">Live Video</span>
                </Button>
                <Button variant="ghost" className="flex items-center space-x-2 text-medium-gray">
                  <i className="fas fa-images text-green-500"></i>
                  <span className="hidden sm:inline">Photo/Video</span>
                </Button>
                <Button variant="ghost" className="flex items-center space-x-2 text-medium-gray">
                  <i className="fas fa-smile text-yellow-500"></i>
                  <span className="hidden sm:inline">Feeling</span>
                </Button>
                <Button 
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || createPostMutation.isPending}
                  className="bg-facebook-blue hover:bg-blue-600 text-white"
                >
                  {createPostMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          {posts.map((post: any) => (
            <Card key={post.id} className="mb-6">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.user.profilePicture} alt={post.user.username} />
                    <AvatarFallback>{post.user.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-1">
                      <h4 className="font-semibold">{post.user.username}</h4>
                      {post.user.isVerified && (
                        <div className="verified-badge w-4 h-4 rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-medium-gray">
                      {formatTimeAgo(post.createdAt)} • <i className="fas fa-globe-americas"></i>
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-medium-gray">
                  <i className="fas fa-ellipsis-h"></i>
                </Button>
              </div>
              
              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="mb-3">{post.content}</p>
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt="Post content" 
                    className="w-full rounded-lg"
                  />
                )}
              </div>
              
              {/* Post Stats */}
              <div className="px-4 py-2 flex items-center justify-between text-sm text-medium-gray border-t">
                <div className="flex items-center space-x-4">
                  <span><i className="fas fa-thumbs-up facebook-blue"></i> {post.likes} likes</span>
                  <span>{post.comments} comments</span>
                  <span>{post.shares} shares</span>
                </div>
              </div>
              
              {/* Post Actions */}
              <div className="px-4 py-2 flex items-center justify-around border-t">
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 text-medium-gray hover:bg-hover-gray flex-1 justify-center"
                  onClick={() => handleLikePost(post.id)}
                >
                  <i className="far fa-thumbs-up"></i>
                  <span>Like</span>
                </Button>
                <Button variant="ghost" className="flex items-center space-x-2 text-medium-gray hover:bg-hover-gray flex-1 justify-center">
                  <i className="far fa-comment"></i>
                  <span>Comment</span>
                </Button>
                <Button variant="ghost" className="flex items-center space-x-2 text-medium-gray hover:bg-hover-gray flex-1 justify-center">
                  <i className="far fa-share"></i>
                  <span>Share</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="hidden md:block md:col-span-3">
          <div className="sticky top-20 space-y-4">
            {/* Online Friends */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Online Friends</h3>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {users.filter((u: any) => u.isOnline && u.id !== user.id).slice(0, 5).map((friend: any) => (
                  <div key={friend.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-hover-gray">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={friend.profilePicture} alt={friend.username} />
                        <AvatarFallback>{friend.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="text-sm">{friend.username}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Suggested Friends */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">People You May Know</h3>
              </CardHeader>
              <CardContent className="p-4">
                {users.filter((u: any) => u.id !== user.id).slice(0, 2).map((suggestedUser: any) => (
                  <div key={suggestedUser.id} className="mb-4 last:mb-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={suggestedUser.profilePicture} alt={suggestedUser.username} />
                        <AvatarFallback>{suggestedUser.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{suggestedUser.username}</h4>
                        <p className="text-xs text-medium-gray">3 mutual friends</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1 bg-facebook-blue hover:bg-blue-600 text-white">
                        Add Friend
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
