import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Users, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useSport, Sport } from "@/hooks/use-sport.tsx";
import { useState } from "react";
import { getDisplayName, getInitials } from "@/lib/utils/user";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onAuthClick: () => void;
}

const Header = ({ onAuthClick }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { selectedSport, setSelectedSport, hasSportSelection } = useSport();
  const navigate = useNavigate();

  // Debug: Log user object to check isAdmin field
  console.log('Header user object:', user);

  const sportName = selectedSport === 'nfl' ? 'NFL Fantasy' : '6 Nations Rugby';

  // Sport-specific colors
  const sportColors = {
    nfl: 'from-blue-500/10 to-purple-500/10 border-blue-500/20',
    'six-nations': 'from-green-500/10 to-emerald-500/10 border-green-500/20'
  };

  // Sport-specific logos
  const sportLogos = {
    nfl: '/android/android-launchericon-192-192.png',
    'six-nations': '/rugbylogo.png'
  };

  const handleSportChange = (sport: Sport) => {
    setSelectedSport(sport);
    const path = sport === 'nfl' ? '/nfl' : '/six-nations';
    navigate(path);
  };

  return (
    <header className={cn(
      "bg-background border-b px-3 py-3 sm:px-6 sm:py-4 sticky top-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-500",
      hasSportSelection && `bg-gradient-to-r ${sportColors[selectedSport]} backdrop-blur-sm`
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src={hasSportSelection ? sportLogos[selectedSport] : '/android/android-launchericon-192-192.png'}
            alt="SquadPot"
            className="w-10 h-10 sm:w-12 sm:h-12"
          />
          <div className="flex flex-col justify-center">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              SquadPot
            </h1>
            {hasSportSelection && (
              <p className="text-[9px] sm:text-xs font-medium text-muted-foreground tracking-wider uppercase mt-0.5 hidden sm:block">
                {sportName}
              </p>
            )}
          </div>
        </div>


        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Welcome,</span>
                <span className="font-semibold text-foreground">{getDisplayName(user)}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:flex">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none">
                    <Avatar className="w-7 h-7 sm:w-8 sm:h-8 cursor-pointer">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-semibold">{getDisplayName(user)}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.isAdmin === true && (
                    <>
                      <DropdownMenuItem
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 py-2 cursor-pointer"
                      >
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">Admin Panel</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {hasSportSelection && (
                    <>
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2">Switch Sport</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleSportChange('nfl')}
                        className={cn(
                          "flex items-center gap-3 py-3 cursor-pointer transition-all duration-200 rounded-md",
                          "hover:bg-blue-500/10 hover:scale-[1.02] focus:bg-blue-500/10 focus:text-foreground",
                          selectedSport === 'nfl' && "bg-blue-500/15 border-l-2 border-blue-500"
                        )}
                      >
                        <div className="relative w-8 h-8 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                          <img
                            src="/nfl-logo.png"
                            alt="NFL"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className={cn(
                          "flex-1 font-medium transition-colors duration-200",
                          selectedSport === 'nfl' ? "text-blue-600 dark:text-blue-400" : "group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        )}>
                          NFL
                        </span>
                        {selectedSport === 'nfl' && (
                          <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSportChange('six-nations')}
                        className={cn(
                          "flex items-center gap-3 py-3 cursor-pointer transition-all duration-200 rounded-md",
                          "hover:bg-emerald-400/10 hover:scale-[1.02] focus:bg-emerald-400/10 focus:text-foreground",
                          selectedSport === 'six-nations' && "bg-emerald-400/15 border-l-2 border-emerald-500"
                        )}
                      >
                        <div className="relative w-8 h-8 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                          <img
                            src="/6Nations.png"
                            alt="6 Nations"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className={cn(
                          "flex-1 font-medium transition-colors duration-200",
                          selectedSport === 'six-nations' ? "text-emerald-600 dark:text-emerald-400" : "group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                        )}>
                          6 Nations
                        </span>
                        {selectedSport === 'six-nations' && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={logout} className="sm:hidden cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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