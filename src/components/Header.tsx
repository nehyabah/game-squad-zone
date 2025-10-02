import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Users, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useState } from "react";
import { getDisplayName, getInitials } from "@/lib/utils/user";

interface HeaderProps {
  onAuthClick: () => void;
}

const Header = ({ onAuthClick }: HeaderProps) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-background border-b border-border px-3 py-3 sm:px-6 sm:py-4 sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img
            src="/android/android-launchericon-192-192.png"
            alt="SquadPot"
            className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-card"
          />
          <div>
            <h1 className="text-base sm:text-2xl font-display font-bold text-foreground">SquadPot</h1>
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground hidden sm:block">NFL Fantasy Squads</p>
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
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                  {getInitials(user)}
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