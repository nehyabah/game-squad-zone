import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Trophy, Gamepad2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import SixNationsManager from "@/components/admin/SixNationsManager";
import AdminMembersManager from "@/components/admin/AdminMembersManager";
import AdminFeedbackManager from "@/components/admin/AdminFeedbackManager";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    // TODO: Check isAdmin flag from backend
    // For now, we'll allow access if user is logged in
    // In production, this should verify against the database
    setIsAdmin(true);
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {user ? "Access Denied" : "Login Required"}
          </h1>
          <p className="text-muted-foreground mb-4">
            {user
              ? "You don't have permission to access the admin panel."
              : "Please log in to access the admin panel."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Admin Header */}
      <header className="bg-background border-b px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/android/android-launchericon-192-192.png"
              alt="SquadPot"
              className="w-10 h-10"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                SquadPot Admin
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              Back to App
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Manage NFL picks, 6 Nations questions, and system settings
          </p>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="six-nations" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="six-nations" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              6 Nations
            </TabsTrigger>
            <TabsTrigger value="nfl" className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              NFL
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="six-nations" className="space-y-4">
            <SixNationsManager />
          </TabsContent>

          <TabsContent value="nfl" className="space-y-4">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">NFL Manual Overrides</h2>
              <p className="text-muted-foreground">
                Manually update scores and picks when the API fails.
              </p>
              {/* TODO: Add NFL override components */}
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <AdminFeedbackManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <AdminMembersManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
