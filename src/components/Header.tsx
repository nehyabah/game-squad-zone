import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Users, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface HeaderProps {
  onAuthClick: () => void;
}

const Header = ({ onAuthClick }: HeaderProps) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-background border-b border-border px-4 sm:px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-card">
            <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground">SquadPot</h1>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground hidden sm:block">NFL Fantasy Squads</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          <a href="#" className="text-foreground hover:text-primary font-medium transition-smooth">Picks</a>
          <a href="#" className="text-foreground hover:text-primary font-medium transition-smooth">Leaderboard</a>
          <a href="#" className="text-foreground hover:text-primary font-medium transition-smooth">My Squads</a>
        </nav>

        {/* Desktop User Actions */}
        <div className="hidden sm:flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-sm">
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

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          {user && (
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden mt-4 pb-4 border-t border-border">
          <div className="space-y-4 pt-4">
            {user ? (
              <>
                <div className="text-center pb-2">
                  <p className="text-sm text-muted-foreground">Welcome back,</p>
                  <p className="font-semibold text-foreground">{user.username}</p>
                </div>
                <nav className="space-y-2">
                  <a href="#" className="block text-center py-2 text-foreground hover:text-primary font-medium transition-smooth">My Picks</a>
                  <a href="#" className="block text-center py-2 text-foreground hover:text-primary font-medium transition-smooth">Leaderboard</a>
                  <a href="#" className="block text-center py-2 text-foreground hover:text-primary font-medium transition-smooth">My Squads</a>
                </nav>
                <Button variant="outline" size="sm" onClick={logout} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="squad" size="sm" onClick={onAuthClick} className="w-full">
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;