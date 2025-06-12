import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NavigationProps {
  user: any;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Navigation({ user, currentPage, onPageChange }: NavigationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { id: "feed", icon: "fas fa-home", label: "Home" },
    { id: "friends", icon: "fas fa-user-friends", label: "Friends" },
    { id: "messenger", icon: "fas fa-comment-dots", label: "Messenger", badge: 3 },
    { id: "notifications", icon: "fas fa-bell", label: "Notifications", badge: 7 },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-facebook-blue rounded-full flex items-center justify-center">
                  <i className="fas fa-comments text-white text-lg"></i>
                </div>
                <h1 className="text-xl font-bold facebook-blue hidden sm:block">WhatsUp</h1>
                <span className="text-sm text-medium-gray hidden sm:block">by Mojar</span>
              </div>
              
              <div className="hidden md:block">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search WhatsUp"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 bg-hover-gray border-0 rounded-full focus:ring-2 focus:ring-facebook-blue"
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-medium-gray text-sm"></i>
                </div>
              </div>
            </div>

            {/* Center Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`nav-item relative p-3 rounded-lg hover:bg-hover-gray ${
                    currentPage === item.id ? "active facebook-blue" : "text-medium-gray"
                  }`}
                  onClick={() => onPageChange(item.id)}
                >
                  <i className={`${item.icon} text-xl`}></i>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Button>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="p-2 bg-hover-gray rounded-full">
                <i className="fas fa-plus text-lg"></i>
              </Button>
              
              <Button variant="ghost" size="sm" className="p-2 bg-hover-gray rounded-full">
                <i className="fab fa-facebook-messenger text-lg"></i>
              </Button>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-hover-gray"
                  onClick={() => onPageChange("profile")}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.profilePicture} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <i className="fas fa-chevron-down text-sm text-medium-gray hidden md:block"></i>
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-medium-gray hover:text-red-500 hidden md:block"
              >
                <i className="fas fa-sign-out-alt"></i>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`nav-item relative p-3 rounded-lg ${
                currentPage === item.id ? "active facebook-blue" : "text-medium-gray"
              }`}
              onClick={() => onPageChange(item.id)}
            >
              <i className={`${item.icon} text-xl`}></i>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
          <Button
            variant="ghost"
            className={`nav-item p-3 rounded-lg ${
              currentPage === "profile" ? "active facebook-blue" : "text-medium-gray"
            }`}
            onClick={() => onPageChange("profile")}
          >
            <i className="fas fa-user text-xl"></i>
          </Button>
        </div>
      </div>
    </>
  );
}
