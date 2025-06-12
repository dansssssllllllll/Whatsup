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

interface ProfileProps {
  user: any;
}

export default function Profile({ user }: ProfileProps) {
  const [newPostContent, setNewPostContent] = useState("");
  const { toast } = useToast();

  const { data: userPosts = [] } = useQuery({
    queryKey: [`/api/posts/user/${user.id}`],
    queryFn: async () => {
      // Since we don't have a specific endpoint, we'll use the feed and filter
      const response = await fetch('/api/posts/feed', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch posts');
      const allPosts = await response.json();
      return allPosts.filter((post: any) => post.userId === user.id);
    },
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['/api/friends'],
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
      queryClient.invalidateQueries({ queryKey: [`/api/posts/user/${user.id}`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/posts/user/${user.id}`] });
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

  // Get friend list for display
  const friendsList = friends.slice(0, 6);
  const remainingFriendsCount = Math.max(0, friends.length - 6);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <Card className="mb-6">
        {/* Cover Photo */}
        <div className="relative h-64 md:h-80 rounded-t-lg overflow-hidden">
          <img 
            src={user.coverPhoto || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=400"} 
            alt="Cover photo" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
        
        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-20 md:-mt-24">
            {/* Profile Picture */}
            <div className="relative mb-4 md:mb-0">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white">
                <AvatarImage src={user.profilePicture} alt={user.username} />
                <AvatarFallback className="text-4xl">{user.username.charAt(0)}</AvatarFallback>
              </Avatar>
              {user.isVerified && (
                <div className="verified-badge absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-white"></i>
                </div>
              )}
            </div>
            
            {/* Profile Details */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{user.username}</h1>
                    {user.isVerified && (
                      <div className="verified-badge w-6 h-6 rounded-full flex items-center justify-center">
                        <i className="fas fa-check text-white text-sm"></i>
                      </div>
                    )}
                  </div>
                  <p className="text-medium-gray mb-2">{user.bio || "WhatsUp User"}</p>
                  <p className="text-sm text-medium-gray">{friends.length} friends • {userPosts.length} posts</p>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <Button className="bg-facebook-blue hover:bg-blue-600 text-white flex items-center space-x-2">
                    <i className="fas fa-plus"></i>
                    <span>Add to Story</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <i className="fas fa-edit"></i>
                    <span>Edit Profile</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="md:col-span-5 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-lg">About</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.bio && (
                <div className="flex items-start space-x-3">
                  <i className="fas fa-info-circle text-medium-gray mt-1"></i>
                  <span>{user.bio}</span>
                </div>
              )}
              {user.email && (
                <div className="flex items-center space-x-3">
                  <i className="fas fa-envelope text-medium-gray"></i>
                  <span>{user.email}</span>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <i className="fas fa-map-marker-alt text-medium-gray"></i>
                <span>Lives in <strong>San Francisco, CA</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-calendar text-medium-gray"></i>
                <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              {user.isOnline && (
                <div className="flex items-center space-x-3">
                  <i className="fas fa-circle text-green-500"></i>
                  <span>Active now</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Friends */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="font-bold text-lg">Friends</h3>
              <Button variant="ghost" className="text-facebook-blue hover:underline p-0">
                See all friends
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-medium-gray text-sm mb-4">{friends.length} friends</p>
              {friends.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {friendsList.map((friendship: any) => (
                    <div key={friendship.id} className="aspect-square">
                      <Avatar className="w-full h-full">
                        <AvatarImage src={friendship.friend.profilePicture} alt={friendship.friend.username} />
                        <AvatarFallback className="text-xl">{friendship.friend.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-xs mt-1 font-medium truncate">{friendship.friend.firstName || friendship.friend.username}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-medium-gray">
                  <i className="fas fa-user-friends text-4xl mb-2"></i>
                  <p>No friends yet</p>
                  <p className="text-sm">Connect with people you know</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="font-bold text-lg">Photos</h3>
              <Button variant="ghost" className="text-facebook-blue hover:underline p-0">
                See all photos
              </Button>
            </CardHeader>
            <CardContent>
              {userPosts.filter((post: any) => post.imageUrl).length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {userPosts
                    .filter((post: any) => post.imageUrl)
                    .slice(0, 6)
                    .map((post: any) => (
                      <div key={post.id} className="aspect-square">
                        <img 
                          src={post.imageUrl} 
                          alt="Photo" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-medium-gray">
                  <i className="fas fa-images text-4xl mb-2"></i>
                  <p>No photos yet</p>
                  <p className="text-sm">Share your first photo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Posts */}
        <div className="md:col-span-7">
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
                  <span>Live Video</span>
                </Button>
                <Button variant="ghost" className="flex items-center space-x-2 text-medium-gray">
                  <i className="fas fa-images text-green-500"></i>
                  <span>Photo/Video</span>
                </Button>
                <Button variant="ghost" className="flex items-center space-x-2 text-medium-gray">
                  <i className="fas fa-smile text-yellow-500"></i>
                  <span>Feeling</span>
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

          {/* User's Posts */}
          {userPosts.length > 0 ? (
            userPosts.map((post: any) => (
              <Card key={post.id} className="mb-6">
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.profilePicture} alt={user.username} />
                      <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-1">
                        <h4 className="font-semibold">{user.username}</h4>
                        {user.isVerified && (
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
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <i className="fas fa-pen text-4xl text-medium-gray mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-medium-gray mb-4">Share your first post to connect with friends</p>
                <Button 
                  onClick={() => document.querySelector('textarea')?.focus()}
                  className="bg-facebook-blue hover:bg-blue-600 text-white"
                >
                  Create your first post
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
