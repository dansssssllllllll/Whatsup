import { useState } from "react";
import Navigation from "@/components/Navigation";
import Feed from "@/components/Feed";
import Messenger from "@/components/Messenger";
import Friends from "@/components/Friends";
import Notifications from "@/components/Notifications";
import Profile from "@/components/Profile";

interface HomeProps {
  user: any;
}

export default function Home({ user }: HomeProps) {
  const [currentPage, setCurrentPage] = useState("feed");

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "feed":
        return <Feed user={user} />;
      case "messenger":
        return <Messenger user={user} />;
      case "friends":
        return <Friends user={user} />;
      case "notifications":
        return <Notifications user={user} />;
      case "profile":
        return <Profile user={user} />;
      default:
        return <Feed user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-light-blue">
      <Navigation 
        user={user} 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />
      <main className="pt-14 pb-20 md:pb-0">
        {renderCurrentPage()}
      </main>
    </div>
  );
}
