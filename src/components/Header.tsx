import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Users, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onAuthClick: () => void;
}

const Header = ({ onAuthClick }: HeaderProps) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-card">
            <Trophy className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">SquadPot</h1>
            <p className="text-sm font-medium text-muted-foreground">NFL Fantasy Squads</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-foreground hover:text-primary font-medium transition-smooth">Picks</a>
          <a href="#" className="text-foreground hover:text-primary font-medium transition-smooth">Leaderboard</a>
          <a href="#" className="text-foreground hover:text-primary font-medium transition-smooth">My Squads</a>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Welcome,</span>
                <span className="font-semibold text-foreground">{user.username}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Button variant="squad" size="sm" onClick={onAuthClick}>
              Login / Sign Up
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;