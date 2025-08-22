import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LogOut, User, Settings, Trophy, Bell, HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AccountMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountMenu = ({ open, onOpenChange }: AccountMenuProps) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl border-0 p-0 bg-gradient-to-b from-background to-background/95">
        {/* Header with User Info */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 pb-4 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-white/20 shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-display font-bold text-foreground">{user.username}</h3>
              <p className="text-sm text-muted-foreground/80">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-6 pt-4 space-y-2">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
              <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">My Stats</div>
              <div className="text-xs text-blue-600 dark:text-blue-300">View performance</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-2xl border border-green-200/50 dark:border-green-800/50">
              <Settings className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
              <div className="text-sm font-semibold text-green-900 dark:text-green-100">Settings</div>
              <div className="text-xs text-green-600 dark:text-green-300">Preferences</div>
            </div>
          </div>

          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start h-14 text-left font-normal hover:bg-muted/50 rounded-xl group">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">Profile Settings</div>
                <div className="text-xs text-muted-foreground">Update your information</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-14 text-left font-normal hover:bg-muted/50 rounded-xl group">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mr-3 group-hover:bg-orange-500/20 transition-colors">
                <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-sm font-medium">Notifications</div>
                <div className="text-xs text-muted-foreground">Manage alerts</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-14 text-left font-normal hover:bg-muted/50 rounded-xl group">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mr-3 group-hover:bg-purple-500/20 transition-colors">
                <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-medium">Help & Support</div>
                <div className="text-xs text-muted-foreground">Get assistance</div>
              </div>
            </Button>
          </div>

          {/* Logout Button */}
          <div className="pt-4 mt-6 border-t border-border/50">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start h-14 text-left font-normal text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl group"
            >
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mr-3 group-hover:bg-red-500/20 transition-colors">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium">Sign Out</div>
                <div className="text-xs text-red-500/70">Sign out of your account</div>
              </div>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AccountMenu;