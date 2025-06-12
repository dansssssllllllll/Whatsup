import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
  });
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await apiRequest("POST", endpoint, formData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: isLogin ? "Welcome back!" : "Account created!",
        description: `Hello ${data.user.username}!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-blue px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-facebook-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-comments text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-dark-gray">
            {isLogin ? "Welcome to WhatsUp" : "Join WhatsUp"}
          </h1>
          <p className="text-medium-gray">
            {isLogin 
              ? "Connect with friends and the world around you."
              : "Create your account to start connecting."
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required={!isLogin}
                />
                <Input
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required={!isLogin}
                />
              </div>
            )}
            
            <Input
              name="username"
              placeholder={isLogin ? "Username" : "Username"}
              value={formData.username}
              onChange={handleInputChange}
              required
            />
            
            {!isLogin && (
              <Input
                name="email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
                required={!isLogin}
              />
            )}
            
            <Input
              name="password"
              type="password"
              placeholder={isLogin ? "Password" : "New password"}
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            
            <Button 
              type="submit" 
              className="w-full bg-facebook-blue hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? "Please wait..." : (isLogin ? "Log In" : "Sign Up")}
            </Button>
          </form>
          
          {isLogin && (
            <div className="text-center mt-4">
              <a href="#" className="text-facebook-blue hover:underline text-sm">
                Forgotten password?
              </a>
            </div>
          )}
          
          <hr className="my-6" />
          
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setIsLogin(!isLogin)}
              className={isLogin ? "bg-green-500 hover:bg-green-600 text-white border-green-500" : ""}
            >
              {isLogin ? "Create New Account" : "Already have an account?"}
            </Button>
          </div>
          
          {isLogin && (
            <div className="mt-4 p-3 bg-hover-gray rounded text-sm text-medium-gray">
              <strong>Demo Account:</strong><br />
              Username: Daniel Mojar<br />
              Password: danielot
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
