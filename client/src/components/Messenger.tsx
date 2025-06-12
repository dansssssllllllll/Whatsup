import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { connectSocket, disconnectSocket, socket } from "@/lib/socket";

interface MessengerProps {
  user: any;
}

export default function Messenger({ user }: MessengerProps) {
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [typingIndicator, setTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Connect socket on mount
  useEffect(() => {
    connectSocket();
    if (socket) {
      socket.emit("join_room", user.id);
      
      socket.on("new_message", (message) => {
        queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
        if (selectedChat && (message.senderId === selectedChat.user.id || message.senderId === user.id)) {
          queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedChat.user.id}`] });
        }
      });
    }

    return () => {
      disconnectSocket();
    };
  }, [user.id, selectedChat]);

  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/messages/conversations'],
  });

  const { data: messages = [] } = useQuery({
    queryKey: [`/api/messages/${selectedChat?.user?.id}`],
    enabled: !!selectedChat?.user?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; receiverId?: number; isAi?: boolean }) => {
      if (messageData.isAi) {
        const response = await apiRequest("POST", "/api/ai/chat", { message: messageData.content });
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/messages", messageData);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      if (selectedChat) {
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedChat.user.id}`] });
      }
      setNewMessage("");
      setTypingIndicator(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setTypingIndicator(false);
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    if (selectedChat?.user?.username === "Artificial Intelligence") {
      // AI Chat
      setTypingIndicator(true);
      sendMessageMutation.mutate({
        content: newMessage,
        isAi: true,
      });
    } else if (selectedChat?.user) {
      // Regular user chat
      sendMessageMutation.mutate({
        content: newMessage,
        receiverId: selectedChat.user.id,
      });
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create AI conversation if not exists
  const aiConversation = {
    user: {
      id: 0,
      username: "Artificial Intelligence",
      profilePicture: null,
      isVerified: true,
    },
    lastMessage: {
      content: "Hello! How can I help you today?",
      createdAt: new Date().toISOString(),
      sender: { username: "AI" }
    }
  };

  const allConversations = [aiConversation, ...conversations];

  // Default to AI chat
  useEffect(() => {
    if (!selectedChat) {
      setSelectedChat(aiConversation);
    }
  }, []);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
        {/* Chat List */}
        <div className="md:col-span-4 bg-white rounded-lg shadow-sm">
          <CardHeader>
            <h2 className="text-xl font-bold">Chats</h2>
            <Input
              placeholder="Search Messenger"
              className="mt-3 bg-hover-gray border-0 rounded-full"
            />
          </CardHeader>
          
          <div className="overflow-y-auto h-full hide-scrollbar">
            {allConversations.map((conversation) => (
              <div
                key={conversation.user.id}
                className={`p-4 hover:bg-hover-gray cursor-pointer border-b ${
                  selectedChat?.user?.id === conversation.user.id ? "bg-hover-gray" : ""
                }`}
                onClick={() => setSelectedChat(conversation)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {conversation.user.username === "Artificial Intelligence" ? (
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-robot text-white text-lg"></i>
                      </div>
                    ) : (
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conversation.user.profilePicture} alt={conversation.user.username} />
                        <AvatarFallback>{conversation.user.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    {conversation.user.isVerified && (
                      <div className="verified-badge absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center">
                        <i className="fas fa-check text-white text-xs"></i>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <h3 className="font-medium truncate">{conversation.user.username}</h3>
                      {conversation.user.username === "Artificial Intelligence" && (
                        <i className="fas fa-star text-yellow-500 text-xs"></i>
                      )}
                    </div>
                    <p className="text-sm text-medium-gray truncate">
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                  
                  <div className="text-xs text-medium-gray">
                    {formatTimeAgo(conversation.lastMessage.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="md:col-span-8 bg-white rounded-lg shadow-sm flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {selectedChat.user.username === "Artificial Intelligence" ? (
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-robot text-white"></i>
                        </div>
                      ) : (
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={selectedChat.user.profilePicture} alt={selectedChat.user.username} />
                          <AvatarFallback>{selectedChat.user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      {selectedChat.user.isVerified && (
                        <div className="verified-badge absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">{selectedChat.user.username}</h3>
                      <p className="text-sm text-medium-gray">
                        {selectedChat.user.username === "Artificial Intelligence" 
                          ? "Active now • AI Assistant" 
                          : "Active now"
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="p-2 facebook-blue">
                      <i className="fas fa-phone"></i>
                    </Button>
                    <Button variant="ghost" size="sm" className="p-2 facebook-blue">
                      <i className="fas fa-video"></i>
                    </Button>
                    <Button variant="ghost" size="sm" className="p-2 facebook-blue">
                      <i className="fas fa-info-circle"></i>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
                {/* Welcome message for AI */}
                {selectedChat.user.username === "Artificial Intelligence" && messages.length === 0 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-robot text-white text-sm"></i>
                    </div>
                    <div className="bg-hover-gray rounded-lg p-3 max-w-xs">
                      <p className="text-sm">Hello! I'm your AI assistant. I can help answer questions, provide information, or just have a friendly conversation. What would you like to know?</p>
                      <p className="text-xs text-medium-gray mt-1">Just now</p>
                    </div>
                  </div>
                )}

                {messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.senderId === user.id ? "justify-end" : ""
                    }`}
                  >
                    {message.senderId === user.id ? (
                      <>
                        <div className="bg-facebook-blue text-white rounded-lg p-3 max-w-xs">
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-blue-200 mt-1">{formatTime(message.createdAt)}</p>
                        </div>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={user.profilePicture} alt={user.username} />
                          <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </>
                    ) : (
                      <>
                        {message.isAi ? (
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-robot text-white text-sm"></i>
                          </div>
                        ) : (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={message.sender.profilePicture} alt={message.sender.username} />
                            <AvatarFallback>{message.sender.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="bg-hover-gray rounded-lg p-3 max-w-md">
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-medium-gray mt-1">{formatTime(message.createdAt)}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {typingIndicator && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-robot text-white text-sm"></i>
                    </div>
                    <div className="bg-hover-gray rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-medium-gray rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-medium-gray rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-medium-gray rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" className="p-2 facebook-blue">
                    <i className="fas fa-plus"></i>
                  </Button>
                  
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-hover-gray border-0 rounded-full pr-12"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 facebook-blue"
                    >
                      <i className="far fa-smile"></i>
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    variant="ghost"
                    size="sm"
                    className="p-2 facebook-blue"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-medium-gray">
                <i className="fas fa-comments text-4xl mb-4"></i>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
