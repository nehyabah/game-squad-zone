import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Users } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">SquadPot</h1>
            <p className="text-sm text-muted-foreground">NFL Fantasy Squads</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-foreground hover:text-primary transition-smooth">Picks</a>
          <a href="#" className="text-foreground hover:text-primary transition-smooth">Leaderboard</a>
          <a href="#" className="text-foreground hover:text-primary transition-smooth">My Squads</a>
        </nav>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Users className="w-4 h-4 mr-2" />
            My Squads
          </Button>
          <Avatar>
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;