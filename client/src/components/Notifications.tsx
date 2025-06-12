import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

interface NotificationsProps {
  user: any;
}

export default function Notifications({ user }: NotificationsProps) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return { icon: 'fas fa-thumbs-up', color: 'text-facebook-blue bg-facebook-blue' };
      case 'comment':
        return { icon: 'fas fa-comment', color: 'text-green-500 bg-green-500' };
      case 'friend_request':
        return { icon: 'fas fa-user-plus', color: 'text-facebook-blue bg-facebook-blue' };
      case 'message':
        return { icon: 'fas fa-envelope', color: 'text-purple-500 bg-purple-500' };
      default:
        return { icon: 'fas fa-bell', color: 'text-gray-500 bg-gray-500' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Notifications</h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-medium-gray">
                <i className="fas fa-bell text-4xl mb-4"></i>
                <p>No notifications yet</p>
                <p className="text-sm">When you get notifications, they'll show up here</p>
              </div>
            ) : (
              notifications.map((notification: any) => {
                const iconInfo = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-hover-gray transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        {notification.fromUser ? (
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={notification.fromUser.profilePicture} alt={notification.fromUser.username} />
                            <AvatarFallback>{notification.fromUser.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-bell text-gray-500"></i>
                          </div>
                        )}
                        
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${iconInfo.color.split(' ')[1]} rounded-full flex items-center justify-center`}>
                          <i className={`${iconInfo.icon} text-white text-xs`}></i>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm">{notification.content}</p>
                        <p className="text-xs text-medium-gray mt-1">{formatTimeAgo(notification.createdAt)}</p>
                        
                        {notification.type === 'friend_request' && !notification.isRead && (
                          <div className="flex space-x-2 mt-2">
                            <Button size="sm" className="bg-facebook-blue hover:bg-blue-600 text-white">
                              Confirm
                            </Button>
                            <Button size="sm" variant="outline">
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {!notification.isRead && (
                        <div className="w-3 h-3 bg-facebook-blue rounded-full"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
