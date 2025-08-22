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
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl">
        <SheetHeader className="text-center pb-4">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-lg">{user.username}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                {user.email}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-1 pb-6">
          {/* Account Actions */}
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start h-12 text-left font-normal">
              <User className="w-5 h-5 mr-3 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Profile Settings</div>
                <div className="text-xs text-muted-foreground">Update your profile information</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 text-left font-normal">
              <Trophy className="w-5 h-5 mr-3 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">My Stats</div>
                <div className="text-xs text-muted-foreground">View your performance history</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 text-left font-normal">
              <Bell className="w-5 h-5 mr-3 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Notifications</div>
                <div className="text-xs text-muted-foreground">Manage your notifications</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 text-left font-normal">
              <Settings className="w-5 h-5 mr-3 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Settings</div>
                <div className="text-xs text-muted-foreground">App preferences and privacy</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 text-left font-normal">
              <HelpCircle className="w-5 h-5 mr-3 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Help & Support</div>
                <div className="text-xs text-muted-foreground">Get help and contact support</div>
              </div>
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Logout */}
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start h-12 text-left font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <div>
              <div className="text-sm font-medium">Sign Out</div>
              <div className="text-xs text-muted-foreground">Sign out of your account</div>
            </div>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AccountMenu;