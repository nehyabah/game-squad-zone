import { useState } from "react";
import { useAuth } from "@/hooks/use-auth.tsx";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LogOut, User, Settings, Trophy, Bell, MessageSquare, HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import MyStats from "./MyStats";
import ProfileSettings from "./ProfileSettings";
import NotificationSettings from "./NotificationSettings";
import FeedbackForm from "./FeedbackForm";
import FAQSheet from "./FAQSheet";
import { getDisplayName, getInitials } from "@/lib/utils/user";

interface AccountMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountMenu = ({ open, onOpenChange }: AccountMenuProps) => {
  const { user, logout } = useAuth();
  const [showMyStats, setShowMyStats] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    onOpenChange(false);
  };

  const handleMyStatsClick = () => {
    setShowMyStats(true);
  };

  const handleProfileSettingsClick = () => {
    setShowProfileSettings(true);
  };

  const handleNotificationSettingsClick = () => {
    setShowNotificationSettings(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl border-0 p-0 bg-gradient-to-b from-background to-background/95 z-[110]">
        {/* Header with User Info */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 pb-4 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-white/20 shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl font-bold">
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-display font-bold text-foreground">{getDisplayName(user)}</h3>
              <p className="text-sm text-muted-foreground/80">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-6 pt-4 pb-32 space-y-2">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div 
              onClick={handleMyStatsClick}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-md"
            >
              <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">My Stats</div>
              <div className="text-xs text-blue-600 dark:text-blue-300">View squad leaderboards</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-2xl border border-green-200/50 dark:border-green-800/50 cursor-pointer">
              <Settings className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
              <div className="text-sm font-semibold text-green-900 dark:text-green-100">Settings</div>
              <div className="text-xs text-green-600 dark:text-green-300">Preferences</div>
            </div>
          </div>

          <div className="space-y-1">
            <Button 
              onClick={handleProfileSettingsClick}
              variant="ghost" 
              className="w-full justify-start h-14 text-left font-normal hover:bg-primary/10 hover:text-foreground rounded-xl group transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-all duration-200 group-hover:scale-110">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">Profile Settings</div>
                <div className="text-xs text-muted-foreground group-hover:text-foreground/70">Update your information</div>
              </div>
            </Button>

            <Button
              onClick={handleNotificationSettingsClick}
              variant="ghost"
              className="w-full justify-start h-14 text-left font-normal hover:bg-orange-500/10 hover:text-foreground rounded-xl group transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
            >
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mr-3 group-hover:bg-orange-500/20 transition-all duration-200 group-hover:scale-110">
                <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-sm font-medium">Notifications</div>
                <div className="text-xs text-muted-foreground group-hover:text-foreground/70">Manage alerts</div>
              </div>
            </Button>

            <Button
              onClick={() => setShowFeedbackForm(true)}
              variant="ghost"
              className="w-full justify-start h-14 text-left font-normal hover:bg-purple-500/10 hover:text-foreground rounded-xl group transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
            >
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mr-3 group-hover:bg-purple-500/20 transition-all duration-200 group-hover:scale-110">
                <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-medium">Send Feedback</div>
                <div className="text-xs text-muted-foreground group-hover:text-foreground/70">Help us improve</div>
              </div>
            </Button>

            <Button
              onClick={() => setShowFAQ(true)}
              variant="ghost"
              className="w-full justify-start h-14 text-left font-normal hover:bg-amber-500/10 hover:text-foreground rounded-xl group transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
            >
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mr-3 group-hover:bg-amber-500/20 transition-all duration-200 group-hover:scale-110">
                <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-medium">How to Play & FAQ</div>
                <div className="text-xs text-muted-foreground group-hover:text-foreground/70">Rules & questions</div>
              </div>
            </Button>
          </div>

          {/* Logout Button */}
          <div className="pt-4 mt-6 border-t border-border/50">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start h-14 text-left font-normal text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl group transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
            >
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mr-3 group-hover:bg-red-500/20 transition-all duration-200 group-hover:scale-110">
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

      {/* My Stats Component */}
      <MyStats 
        open={showMyStats} 
        onOpenChange={setShowMyStats}
      />

      {/* Profile Settings Component */}
      <ProfileSettings
        open={showProfileSettings}
        onOpenChange={setShowProfileSettings}
      />

      {/* Notification Settings Component */}
      <NotificationSettings
        open={showNotificationSettings}
        onOpenChange={setShowNotificationSettings}
      />

      {/* Feedback Form */}
      <FeedbackForm
        open={showFeedbackForm}
        onOpenChange={setShowFeedbackForm}
      />

      {/* FAQ Sheet */}
      <FAQSheet
        open={showFAQ}
        onOpenChange={setShowFAQ}
      />
    </Sheet>
  );
};

export default AccountMenu;