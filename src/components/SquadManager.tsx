import { useState, useEffect } from "react";
import { useSquads } from "@/hooks/use-squads";
import { squadsAPI } from "@/lib/api/squads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Users,
  Trophy,
  Calendar,
  Copy,
  Share2,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import SquadDashboard from "./SquadDashboard";
import { MyJoinRequests } from "./MyJoinRequests";
import type { Squad } from "@/lib/api/squads";

const SquadManager = () => {
  const { squads, loading, createSquad, refetch, error, clearUnreadCount } =
    useSquads();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [createdSquad, setCreatedSquad] = useState<Squad | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [newSquad, setNewSquad] = useState({
    name: "",
    description: "",
    maxMembers: 10,
    isPublic: true,
  });

  // Add error handling for browser extension conflicts
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.filename?.includes("web-client-content-script.js")) {
        // Suppress browser extension errors
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
    }, 250);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);
  };

  const handleCreateSquad = async () => {
    // Validate max members before submitting
    if (newSquad.maxMembers > 50) {
      toast.error("Maximum members cannot exceed 50", {
        description: "Please enter a value between 2 and 50",
      });
      return;
    }

    if (newSquad.maxMembers < 2) {
      toast.error("Squad must have at least 2 members", {
        description: "Please enter a value between 2 and 50",
      });
      return;
    }

    try {
      const squadData = {
        name: newSquad.name,
        description: newSquad.description || undefined,
        maxMembers: newSquad.maxMembers,
      };

      const squad = await createSquad(squadData);

      setCreatedSquad(squad);

      // Trigger celebration
      triggerConfetti();
      toast.success(`🎉 Squad "${squad.name}" created successfully!`, {
        description: `Join code: ${squad.joinCode}`,
      });
    } catch (error) {
      toast.error("Failed to create squad. Please try again.");
    }
  };

  const copyJoinCode = async (joinCode: string) => {
    try {
      await navigator.clipboard.writeText(joinCode);
      toast.success("Join code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy join code");
    }
  };

  const shareToWhatsApp = (squad: Squad) => {
    const message = `🎯 Join my fantasy squad "${squad.name}"!\n\nJoin Code: ${squad.joinCode}\n\nLet's compete and see who's the best at picking winners! 🏆`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const shareGeneric = async (squad: Squad) => {
    const shareData = {
      title: `Join ${squad.name}`,
      text: `🎯 Join my fantasy squad "${squad.name}"! Use join code: ${squad.joinCode}`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
        toast.success("Squad details copied to clipboard!");
      }
    } catch (err) {
      toast.error("Failed to share squad details");
    }
  };

  const handleFinishSharing = () => {
    setCreatedSquad(null);
    setNewSquad({ name: "", description: "", maxMembers: 10, isPublic: true });
    setShowCreateDialog(false);
  };

  const handleJoinSquad = async () => {
    try {
      const finalJoinCode = joinCode.trim().toUpperCase();
      const joinRequest = await squadsAPI.createJoinRequest({
        joinCode: finalJoinCode
      });

      toast.success("Join request sent!", {
        description: `Your request to join "${joinRequest.squad?.name}" has been sent to the admins for approval`,
      });
      setJoinCode("");
      setShowJoinDialog(false);
      refetch(); // Refresh to show any updated squads
    } catch (error) {
      toast.error((error as Error).message || "Failed to send join request. Please check the join code and try again.");
    }
  };

  const handleViewSquad = (squad: Squad) => {
    try {
      console.log("Viewing squad:", squad);
      setSelectedSquad(squad);
      // Clear badge immediately and mark messages as read on server
      if (squad.unreadCount && squad.unreadCount > 0) {
        clearUnreadCount(squad.id);
        squadsAPI.markMessagesAsRead(squad.id).catch(() => {});
      }
    } catch (error) {
      console.error("Error viewing squad:", error);
      toast.error("Failed to load squad. Please try again.");
    }
  };

  const handleBackToSquads = () => {
    try {
      setSelectedSquad(null);
      // Refresh squads to update unread counts
      refetch();
    } catch (error) {
      console.error("Error going back to squads:", error);
    }
  };

  // Handle API errors
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load squads</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  // If a squad is selected, show the dashboard
  if (selectedSquad) {
    try {
      return (
        <SquadDashboard
          squadId={selectedSquad.id}
          onBack={handleBackToSquads}
        />
      );
    } catch (error) {
      console.error("Error rendering SquadDashboard:", error);
      setSelectedSquad(null);
      toast.error("Failed to load squad dashboard. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading your squads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            My Squads
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage your fantasy squads and create new ones
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 flex-1 sm:w-auto transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Create Squad</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-xs mx-auto p-0 gap-0 border-0 bg-white rounded-2xl shadow-2xl">
              {!createdSquad ? (
                // Squad Creation Form
                <>
                  <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-3 border-b border-border/50">
                    <DialogHeader className="space-y-0">
                      <DialogTitle className="text-base font-semibold text-center">
                        Create Squad
                      </DialogTitle>
                    </DialogHeader>
                  </div>

                  <div className="p-3 space-y-2.5">
                    <div className="space-y-1">
                      <Label
                        htmlFor="squad-name"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Squad Name
                      </Label>
                      <Input
                        id="squad-name"
                        placeholder="Enter squad name"
                        value={newSquad.name}
                        onChange={(e) =>
                          setNewSquad({ ...newSquad, name: e.target.value })
                        }
                        className="h-9 border-border/50 rounded-lg focus:ring-1 focus:ring-primary/50 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="squad-description"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="squad-description"
                        placeholder="What's your squad about?"
                        value={newSquad.description}
                        onChange={(e) =>
                          setNewSquad({
                            ...newSquad,
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="border-border/50 rounded-lg focus:ring-1 focus:ring-primary/50 text-sm resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="max-members"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Max Members (2-50)
                      </Label>
                      <Input
                        id="max-members"
                        type="number"
                        min="2"
                        max="50"
                        value={newSquad.maxMembers}
                        onChange={(e) => {
                          const input = e.target.value;
                          // Allow empty field for easier typing
                          if (input === "") {
                            /* eslint-disable  @typescript-eslint/no-explicit-any */
                            setNewSquad({ ...newSquad, maxMembers: "" as any });
                          } else {
                            const value = parseInt(input);
                            // Only update if it's a valid number
                            if (!isNaN(value)) {
                              // Don't clamp here, just store the value to allow user to see what they typed
                              setNewSquad({ ...newSquad, maxMembers: value });
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // On blur, ensure we have a valid value
                          const value = parseInt(e.target.value);
                          if (isNaN(value) || value < 2) {
                            setNewSquad({ ...newSquad, maxMembers: 10 });
                          }
                        }}
                        className="h-9 border-border/50 rounded-lg focus:ring-1 focus:ring-primary/50 text-sm"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        className="flex-1 h-9 rounded-lg border-border/50 text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateSquad}
                        className="flex-1 h-9 rounded-lg text-sm font-medium"
                        disabled={!newSquad.name.trim()}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // Squad Sharing View
                <>
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-3 border-b border-border/50">
                    <DialogHeader className="space-y-0">
                      <DialogTitle className="text-base font-semibold text-center">
                        🎉 Squad Created!
                      </DialogTitle>
                    </DialogHeader>
                  </div>

                  <div className="p-3 space-y-3">
                    {/* Squad Info */}
                    <div className="text-center space-y-1.5">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-base mx-auto">
                        {createdSquad.name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-semibold text-sm">
                        {createdSquad.name}
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          Join Code
                        </p>
                        <p className="font-mono font-bold text-base tracking-wider text-primary">
                          {createdSquad.joinCode}
                        </p>
                      </div>
                    </div>

                    {/* Sharing Options */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground text-center">
                        Share with friends
                      </p>

                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyJoinCode(createdSquad.joinCode)}
                          className="h-8 rounded-lg border-border/50 text-xs gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareToWhatsApp(createdSquad)}
                          className="h-8 rounded-lg border-border/50 text-xs gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => shareGeneric(createdSquad)}
                        className="w-full h-8 rounded-lg border-border/50 text-xs gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share Squad
                      </Button>
                    </div>

                    <Button
                      onClick={handleFinishSharing}
                      className="w-full h-9 rounded-lg text-sm font-medium"
                    >
                      Done
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 flex-1 sm:w-auto transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary hover:text-primary hover:bg-background relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                <UserPlus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Join Squad</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-sm mx-auto p-0 gap-0 border-0 bg-card/95 backdrop-blur-sm rounded-3xl shadow-xl ring-1 ring-border/20">
              <div className="p-6 space-y-6">
                <div className="text-center space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Request to Join Squad</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the join code - admins will review your request
                    </p>
                  </div>
                  <Input
                    placeholder="ABCD1234"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="h-12 text-center font-mono text-lg tracking-widest border-2 rounded-xl focus:border-primary transition-all duration-200"
                    maxLength={12}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowJoinDialog(false);
                      setJoinCode("");
                    }}
                    className="flex-1 h-11 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleJoinSquad}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-200"
                    disabled={!joinCode.trim()}
                  >
                    Send Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pending Join Requests */}
      <MyJoinRequests />

      <div className="space-y-2">
        {squads.map((squad) => (
          <Card
            key={squad.id}
            className="relative overflow-hidden border border-primary/10 shadow-lg bg-gradient-to-br from-background via-primary/3 to-background backdrop-blur-sm hover:shadow-xl transition-all duration-300 group hover:scale-[1.01]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4 opacity-50"></div>
            <CardContent className="relative p-0">
              {/* Sleek Header */}
              <div className="bg-gradient-to-r from-background/90 to-primary/5 p-3 border-b border-primary/10 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center shadow-md border border-primary/20 flex-shrink-0">
                      <span className="text-primary font-bold text-sm">
                        {squad.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-foreground truncate">
                        {squad.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="default"
                          className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20 rounded-full"
                        >
                          Member
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 rounded-full"
                        >
                          Private
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Unread message indicator */}
                    {squad.unreadCount && squad.unreadCount > 0 && (
                      <div className="relative">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {squad.unreadCount > 99 ? "99+" : squad.unreadCount}
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 h-8 transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-lg"
                      onClick={() => handleViewSquad(squad)}
                    >
                      <span className="hidden sm:inline">View Squad</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sleek Content */}
              <div className="p-3">
                {squad.description && (
                  <p className="text-muted-foreground text-xs mb-2 line-clamp-1">
                    {squad.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                        <Users className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Members:
                      </span>
                      <span className="font-semibold text-xs text-foreground">
                        {squad.members?.length || 0}/{squad.maxMembers}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                        <Trophy className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Code:
                      </span>
                      <span className="font-mono font-semibold text-xs text-foreground bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                        {squad.joinCode}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {squads.length === 0 && (
        <Card className="text-center p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                No Squads Yet
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create your first squad to start competing with friends
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Squad
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SquadManager;
