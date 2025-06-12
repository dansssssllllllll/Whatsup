import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import { useQuery } from "@tanstack/react-query";

function AuthenticatedApp() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-blue">
        <div className="text-center">
          <div className="w-16 h-16 bg-facebook-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-comments text-white text-2xl"></i>
          </div>
          <div className="text-lg font-semibold text-dark-gray">Loading WhatsUp...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Home user={user} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthenticatedApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
