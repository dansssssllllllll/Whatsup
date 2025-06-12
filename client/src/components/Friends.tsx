import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface FriendsProps {
  user: any;
}

export default function Friends({ user }: FriendsProps) {
  const { toast } = useToast();

  const { data: friends = [] } = useQuery({
    queryKey: ['/api/friends'],
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: ['/api/friends/requests'],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const response = await apiRequest("POST", "/api/friends/request", { friendId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/friends/request/${requestId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      toast({
        title: "Friend request updated!",
        description: "Friend request has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update friend request",
        variant: "destructive",
      });
    },
  });

  const handleSendFriendRequest = (friendId: number) => {
    sendFriendRequestMutation.mutate(friendId);
  };

  const handleRespondToRequest = (requestId: number, status: string) => {
    respondToRequestMutation.mutate({ requestId, status });
  };

  // Get users who are not friends and not the current user
  const friendIds = new Set(friends.map((f: any) => f.friend.id));
  const pendingRequestIds = new Set(friendRequests.map((r: any) => r.user.id));
  const suggestedFriends = users.filter((u: any) => 
    u.id !== user.id && 
    !friendIds.has(u.id) && 
    !pendingRequestIds.has(u.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Friends Navigation */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Friends</h2>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start bg-hover-gray font-medium">
                  <i className="fas fa-home facebook-blue w-5 mr-3"></i>
                  Home
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <i className="fas fa-user-plus facebook-blue w-5 mr-3"></i>
                  Friend Requests
                  {friendRequests.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {friendRequests.length}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <i className="fas fa-user-friends facebook-blue w-5 mr-3"></i>
                  Suggestions
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <i className="fas fa-users facebook-blue w-5 mr-3"></i>
                  All Friends
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <i className="fas fa-birthday-cake facebook-blue w-5 mr-3"></i>
                  Birthdays
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Friends Content */}
        <div className="md:col-span-9">
          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-semibold">Friend Requests</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendRequests.map((request: any) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="text-center">
                        <Avatar className="w-20 h-20 mx-auto mb-3">
                          <AvatarImage src={request.user.profilePicture} alt={request.user.username} />
                          <AvatarFallback className="text-2xl">{request.user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h4 className="font-semibold mb-1">{request.user.username}</h4>
                        <p className="text-sm text-medium-gray mb-3">3 mutual friends</p>
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleRespondToRequest(request.id, 'accepted')}
                            className="w-full bg-facebook-blue hover:bg-blue-600 text-white"
                            disabled={respondToRequestMutation.isPending}
                          >
                            Confirm
                          </Button>
                          <Button
                            onClick={() => handleRespondToRequest(request.id, 'declined')}
                            variant="outline"
                            className="w-full"
                            disabled={respondToRequestMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Friends */}
          {friends.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-semibold">Your Friends ({friends.length})</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friendship: any) => (
                    <div key={friendship.id} className="border rounded-lg p-4">
                      <div className="text-center">
                        <Avatar className="w-20 h-20 mx-auto mb-3">
                          <AvatarImage src={friendship.friend.profilePicture} alt={friendship.friend.username} />
                          <AvatarFallback className="text-2xl">{friendship.friend.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h4 className="font-semibold mb-1">{friendship.friend.username}</h4>
                        <p className="text-sm text-medium-gray mb-3">
                          {friendship.friend.isOnline ? (
                            <span className="text-green-600">
                              <i className="fas fa-circle text-xs mr-1"></i>
                              Online
                            </span>
                          ) : (
                            "Offline"
                          )}
                        </p>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full">
                            Message
                          </Button>
                          <Button variant="outline" className="w-full">
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* People You May Know */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">People You May Know</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedFriends.map((suggestedUser: any) => (
                  <div key={suggestedUser.id} className="border rounded-lg p-4">
                    <div className="text-center">
                      <Avatar className="w-20 h-20 mx-auto mb-3">
                        <AvatarImage src={suggestedUser.profilePicture} alt={suggestedUser.username} />
                        <AvatarFallback className="text-2xl">{suggestedUser.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <h4 className="font-semibold mb-1">{suggestedUser.username}</h4>
                      <p className="text-sm text-medium-gray mb-3">
                        {Math.floor(Math.random() * 10) + 1} mutual friends
                      </p>
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleSendFriendRequest(suggestedUser.id)}
                          className="w-full bg-facebook-blue hover:bg-blue-600 text-white"
                          disabled={sendFriendRequestMutation.isPending}
                        >
                          Add Friend
                        </Button>
                        <Button variant="outline" className="w-full">
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
