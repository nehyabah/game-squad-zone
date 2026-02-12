import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Send,
  Users,
  Trophy,
  Crown,
  Medal,
  Award,
  Loader2,
  UserMinus,
  Share2,
  Copy,
  Check,
  Settings,
  Trash2,
  User,
  AlertTriangle,
  BarChart3,
  UserPlus,
  Shield,
  MessageCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSquads, useSquad } from "@/hooks/use-squads";
import { useAuth } from "@/hooks/use-auth";
import { useSquadChat } from "@/hooks/use-squad-chat";
import { useSquadLeaderboard } from "@/hooks/use-leaderboard";
import { getCurrentWeekIdSync } from "@/lib/utils/weekUtils";
import type { Squad } from "@/lib/api/squads";
import type { ChatMessage as APIChatMessage } from "@/lib/api/chat";
import { getDisplayName, getInitials } from "@/lib/utils/user";
import { squadsAPI } from "@/lib/api/squads";
import { leaderboardAPI as sixNationsLeaderboardAPI, SixNationsLeaderboardEntry } from "@/lib/api/six-nations";
import { MemberPicksModal } from "./MemberPicksModal";
import { StatisticsTab } from "./Statistics/StatisticsTab";
import { PendingJoinRequests } from "./PendingJoinRequests";
import { useQuery } from "@tanstack/react-query";

interface SquadFeatures {
  hasChat: boolean;
  hasLeaderboard: boolean;
}

interface ChatMessage {
  id: string;
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  message: string;
  timestamp: string;
  isCurrentUser: boolean;
}

interface SquadMemberRanking {
  userId: string;
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  rank: number;
  wins: number;
  losses: number;
  pushes: number;
  winPercentage: number;
  isCurrentUser?: boolean;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 2:
      return <Medal className="w-4 h-4 text-gray-400" />;
    case 3:
      return <Award className="w-4 h-4 text-amber-600" />;
    default:
      return (
        <span className="w-4 h-4 flex items-center justify-center text-muted-foreground font-bold text-xs">
          {rank}
        </span>
      );
  }
};

interface SquadDashboardProps {
  squadId: string;
  onBack: () => void;
}

const SquadDashboard = ({ squadId, onBack }: SquadDashboardProps) => {
  const { squad, loading, error, updateSettings, refetch } = useSquad(squadId);
  const { leaveSquad, deleteSquad } = useSquads();
  const { user } = useAuth();

  const currentWeekId = getCurrentWeekIdSync();
  const squadLeaderboard = useSquadLeaderboard(squadId);
  const squadTotalLeaderboard = useSquadLeaderboard(squadId, undefined, 'total');
  const [squadLeaderboardTab, setSquadLeaderboardTab] = useState("total");

  // Global Six Nations leaderboard state
  const [globalSixNationsData, setGlobalSixNationsData] = useState<SixNationsLeaderboardEntry[]>([]);
  const [globalSixNationsLoading, setGlobalSixNationsLoading] = useState(false);

  const {
    messages: chatMessages,
    loading: chatLoading,
    sending: chatSending,
    sendMessage,
    refetch: refetchMessages,
    isPolling,
  } = useSquadChat(squadId, 15000); // Poll every 15 seconds

  // Check if user is admin or owner (needed for useQuery below)
  const currentUserMember = squad?.members?.find(m => m.userId === user?.id);
  const isAdminOrOwner = currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin';
  const isSixNations = squad?.sport === 'six-nations';

  // Fetch pending join requests count for notification badge
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["squadJoinRequests", squadId],
    queryFn: () => squadsAPI.getPendingJoinRequests(squadId),
    enabled: isAdminOrOwner,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const pendingRequestsCount = pendingRequests.length;

  // Load global Six Nations leaderboard (total) when viewing a Six Nations squad
  useEffect(() => {
    if (isSixNations) {
      setGlobalSixNationsLoading(true);
      sixNationsLeaderboardAPI.get(undefined, 'total')
        .then(data => setGlobalSixNationsData(data))
        .catch(err => console.error('Error loading global Six Nations leaderboard:', err))
        .finally(() => setGlobalSixNationsLoading(false));
    }
  }, [isSixNations]);

  const [activeTab, setActiveTab] = useState("leaderboard");
  const [newMessage, setNewMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newMaxMembers, setNewMaxMembers] = useState(squad?.maxMembers || 10);
  const [selectedMember, setSelectedMember] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);
  const [newSquadName, setNewSquadName] = useState(squad?.name || "");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const mobileMessagesEndRef = useRef<HTMLDivElement>(null);
  const desktopMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const markAsRead = async () => {
      if (activeTab === "chat" && squadId) {
        try {
          await squadsAPI.markMessagesAsRead(squadId);
        } catch (error) {
          console.error("Failed to mark messages as read:", error);
        }
      }
    };

    markAsRead();
  }, [squadId, activeTab]);

  const formattedChatMessages: ChatMessage[] = chatMessages.map((msg) => ({
    id: msg.id,
    username: msg.user.username,
    displayName: msg.user.displayName,
    firstName: msg.user.firstName,
    lastName: msg.user.lastName,
    message: msg.message,
    timestamp: new Date(msg.createdAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    isCurrentUser: msg.isCurrentUser,
  }));

  useEffect(() => {
    const scrollToBottom = () => {
      mobileMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      desktopMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    if (formattedChatMessages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [formattedChatMessages.length, activeTab]);

  useEffect(() => {
    if (squad?.maxMembers !== undefined) {
      setNewMaxMembers(squad.maxMembers);
    }
    if (squad?.name) {
      setNewSquadName(squad.name);
    }
  }, [squad?.maxMembers, squad?.name]);

  const sortSixNationsData = (data: typeof squadLeaderboard.data) => {
    return [...data]
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.wins - a.wins;
      })
      .map((member, index) => ({
        ...member,
        rank: index + 1,
      }));
  };

  const memberRanking = useMemo(() => {
    const data = squadLeaderboard.data || [];
    if (isSixNations) return sortSixNationsData(data);
    return data;
  }, [squadLeaderboard.data, isSixNations]);

  const memberTotalRanking = useMemo(() => {
    const data = squadTotalLeaderboard.data || [];
    if (isSixNations) return sortSixNationsData(data);
    return data;
  }, [squadTotalLeaderboard.data, isSixNations]);

  // Transform global Six Nations data to squad ranking format
  const globalRanking = useMemo(() => {
    if (!globalSixNationsData.length) return [];
    return globalSixNationsData
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return b.correctAnswers - a.correctAnswers;
      })
      .map((entry, index) => {
        const pendingAnswers = entry.totalAnswers - entry.correctAnswers - entry.incorrectAnswers;
        return {
          userId: entry.user.id,
          username: entry.user.username,
          displayName: entry.user.displayName,
          firstName: entry.user.firstName,
          lastName: entry.user.lastName,
          points: entry.totalPoints,
          wins: entry.correctAnswers,
          losses: entry.incorrectAnswers,
          pushes: pendingAnswers,
          winPercentage: 0,
          rank: index + 1,
          isCurrentUser: user ? entry.user.id === user.id : false,
        };
      });
  }, [globalSixNationsData, user]);

  // For Six Nations squads, switch between current round, total, and global based on tab
  const activeSquadRanking = isSixNations
    ? squadLeaderboardTab === 'total'
      ? memberTotalRanking
      : squadLeaderboardTab === 'global'
        ? globalRanking
        : memberRanking
    : memberRanking;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error || !squad) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load squad details</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const features: SquadFeatures = {
    hasChat: true,
    hasLeaderboard: true,
  };

  const quickEmojis = ["🔥", "😂", "🤣", "👏", "💯", "❤️"];

  const handleSendMessage = async () => {
    if (!newMessage.trim() || chatSending) return;

    try {
      await sendMessage({ message: newMessage.trim() });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleEmojiClick = async (emoji: string) => {
    if (chatSending) return;

    try {
      await sendMessage({ message: emoji });
    } catch (error) {
      console.error("Failed to send emoji:", error);
    }
  };

  const isOwner = squad?.ownerId === user?.id;

  const handleShareSquad = async () => {
    if (!squad?.joinCode) return;

    const shareUrl = `${window.location.origin}/?joinCode=${squad.joinCode}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Join ${squad.name}`,
          text: `Join my squad "${squad.name}" on SquadPot!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Failed to share:", error);
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (clipboardError) {
        console.error("Failed to copy to clipboard:", clipboardError);
      }
    }
  };

  const handleLeaveSquad = async () => {
    setLeaveLoading(true);
    const action = isOwner ? "delete" : "leave";

    try {
      const success = isOwner
        ? await deleteSquad(squadId)
        : await leaveSquad(squadId);

      if (success) {
        setShowLeaveModal(false);
        toast.success(
          isOwner ? "Squad deleted successfully" : "You have left the squad"
        );
        onBack();
      }
    } catch (error) {
      console.error("Failed to leave/delete squad:", error);
      toast.error(`Failed to ${action} squad. Please try again.`);
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleUpdateSquadSettings = async () => {
    if (!squad) {
      setShowSettings(false);
      return;
    }

    const hasChanges =
      newMaxMembers !== squad.maxMembers || newSquadName.trim() !== squad.name;

    if (!hasChanges) {
      setShowSettings(false);
      return;
    }

    if (newSquadName.trim().length === 0) {
      toast.error("Squad name cannot be empty");
      return;
    }

    const currentMemberCount = squad.members?.length || 0;
    if (newMaxMembers < currentMemberCount) {
      toast.error(
        `Cannot set max members below current member count (${currentMemberCount})`
      );
      return;
    }

    setUpdateLoading(true);
    try {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const updateData: any = {};

      if (newMaxMembers !== squad.maxMembers) {
        updateData.maxMembers = newMaxMembers;
      }

      if (newSquadName.trim() !== squad.name) {
        updateData.name = newSquadName.trim();
      }

      const success = await updateSettings(updateData);

      if (success) {
        setShowSettings(false);
      }
    } catch (error) {
      console.error("Failed to update squad settings:", error);
      toast.error("Failed to update squad settings. Please try again.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const hasBothFeatures = features.hasChat && features.hasLeaderboard;

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 bg-background">
      {/* Sleeker Mobile Header */}
      <div className="flex items-center gap-2 py-2 px-3 mb-3 bg-gradient-to-r from-card to-muted/30 border border-border/50 rounded-xl shadow-sm flex-shrink-0">
        <Button
          variant="ghost"
          onClick={onBack}
          className="p-1.5 h-7 w-7 hover:bg-primary/10 rounded-full"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground truncate leading-tight">
            {squad.name}
          </h1>
          <div className="flex items-center gap-1 mt-0.5">
            <Trophy className="w-2.5 h-2.5 text-yellow-600" />
            <span className="font-mono font-medium text-foreground text-[10px]">
              {squad.joinCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Chat Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("chat")}
            className={`h-7 w-7 p-0 hover:bg-primary/10 rounded-lg relative ${activeTab === "chat" ? "bg-primary/10" : ""}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {squad?.unreadCount && squad.unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">
                  {squad.unreadCount > 9 ? "9+" : squad.unreadCount}
                </span>
              </div>
            )}
          </Button>

          {isOwner && (
            <Dialog
              open={showSettings}
              onOpenChange={(open) => {
                if (open && squad) {
                  if (squad.maxMembers) setNewMaxMembers(squad.maxMembers);
                  if (squad.name) setNewSquadName(squad.name);
                }
                setShowSettings(open);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-primary/10 rounded-lg"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md mx-auto p-0 gap-0 border border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl max-h-[90vh] overflow-hidden">
                <div className="bg-muted/30 p-5 border-b border-border">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-center text-foreground">
                      Squad Settings
                    </DialogTitle>
                  </DialogHeader>
                </div>

                <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                  <div className="space-y-2">
                    <Label htmlFor="squad-name" className="text-sm font-medium">
                      Squad Name
                    </Label>
                    <Input
                      id="squad-name"
                      type="text"
                      value={newSquadName}
                      onChange={(e) => setNewSquadName(e.target.value)}
                      className="h-10 font-medium"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="max-members"
                      className="text-sm font-medium"
                    >
                      Maximum Members
                    </Label>
                    <div className="space-y-1">
                      <Input
                        id="max-members"
                        type="number"
                        min="2"
                        max="50"
                        value={newMaxMembers}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          const newValue = isNaN(value)
                            ? 2
                            : Math.max(2, Math.min(50, value));
                          setNewMaxMembers(newValue);
                        }}
                        className="h-10 text-center font-medium"
                      />
                      <p className="text-xs text-muted-foreground">
                        Current members: {squad?.members?.length || 0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Members ({squad?.members?.length || 0})
                    </Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {squad?.members?.map((member) => {
                        const isCurrentUser = member.user?.id === user?.id;
                        const isOwner = member.role === "owner";
                        const isAdmin = member.role === "admin";
                        const displayName = getDisplayName({
                          displayName: member.user?.displayName,
                          firstName: member.user?.firstName,
                          lastName: member.user?.lastName,
                          username:
                            member.user?.username ||
                            member.username ||
                            "Unknown",
                        });

                        return (
                          <div
                            key={member.user?.id || member.userId}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                          >
                            <div
                              className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-muted/70 -m-2 p-2 rounded-lg transition-colors"
                              onClick={() =>
                                setSelectedMember({
                                  userId: member.user?.id || member.userId,
                                  displayName: displayName,
                                })
                              }
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {getInitials({
                                    displayName: member.user?.displayName,
                                    firstName: member.user?.firstName,
                                    lastName: member.user?.lastName,
                                    username:
                                      member.user?.username ||
                                      member.username ||
                                      "Unknown",
                                  })}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {displayName}
                                </span>
                                <div className="flex items-center gap-1">
                                  {isOwner && (
                                    <Crown className="w-3 h-3 text-yellow-500" />
                                  )}
                                  {isAdmin && !isOwner && (
                                    <Shield className="w-3 h-3 text-blue-500" />
                                  )}
                                  <Badge
                                    variant={isOwner ? "default" : isAdmin ? "default" : "secondary"}
                                    className={`text-xs px-1.5 py-0.5 ${isAdmin && !isOwner ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : ""}`}
                                  >
                                    {member.role}
                                  </Badge>
                                  {isCurrentUser && (
                                    <span className="text-xs text-muted-foreground">
                                      (You)
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="ml-auto">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>

                            {!isCurrentUser && !isOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const confirmed = window.confirm(
                                    `Remove ${displayName} from the squad?`
                                  );
                                  if (confirmed && member.user?.id) {
                                    try {
                                      await squadsAPI.removeMember(
                                        squad!.id,
                                        member.user.id
                                      );
                                      toast.success(
                                        `${displayName} has been removed from the squad`
                                      );
                                      refetch();
                                    } catch (error) {
                                      console.error(
                                        "Failed to remove member:",
                                        error
                                      );
                                      toast.error(
                                        "Failed to remove member. Please try again."
                                      );
                                    }
                                  }
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowSettings(false)}
                      className="flex-1 h-10 rounded-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateSquadSettings}
                      disabled={
                        updateLoading ||
                        (newMaxMembers === squad?.maxMembers &&
                          newSquadName.trim() === squad?.name)
                      }
                      className="flex-1 h-10 rounded-lg"
                    >
                      {updateLoading && (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      )}
                      Update
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareSquad}
            className="h-7 w-7 p-0 hover:bg-primary/10 rounded-lg"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLeaveModal(true)}
            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <UserMinus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Sleeker Mobile Tabs */}
      {hasBothFeatures && (
        <div className="sm:hidden flex-shrink-0 pb-2 px-1">
          <div className={`grid ${isAdminOrOwner && !isSixNations ? 'grid-cols-3' : 'grid-cols-2'} bg-muted/30 rounded-lg p-0.5 gap-0.5`}>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-md transition-all ${
                activeTab === "leaderboard"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <Trophy className="w-3 h-3" />
              Ranks
            </button>
            {!isSixNations && (
              <button
                onClick={() => setActiveTab("statistics")}
                className={`flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-md transition-all ${
                  activeTab === "statistics"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                Stats
              </button>
            )}
            {isAdminOrOwner && (
              <button
                onClick={() => setActiveTab("requests")}
                className={`relative flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-md transition-all ${
                  activeTab === "requests"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                <UserPlus className="w-3 h-3" />
                Requests
                {pendingRequestsCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center p-0 px-1 text-[10px] font-bold animate-pulse"
                  >
                    {pendingRequestsCount}
                  </Badge>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Content */}
      <div className="sm:hidden flex-1 flex flex-col min-h-0">
        {((hasBothFeatures && activeTab === "chat") ||
          (!hasBothFeatures && features.hasChat)) && (
          <div className="flex flex-col flex-1 min-h-0 border border-border/50 rounded-xl bg-card overflow-hidden">
            {/* Compact Chat Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-primary/10 rounded">
                  <Send className="w-3 h-3 text-primary" />
                </div>
                <span className="text-xs font-bold">Chat</span>
              </div>
              {isPolling && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-semibold text-green-600">
                    Live
                  </span>
                </div>
              )}
            </div>

            {/* Ultra-compact Messages */}
            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 min-h-0 bg-muted/5">
              {formattedChatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-2 py-1 max-w-[80%] ${
                      message.isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-[10px] font-bold ${
                          message.isCurrentUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {getDisplayName({
                          username: message.username,
                          displayName: message.displayName,
                          firstName: message.firstName,
                          lastName: message.lastName,
                        })}
                      </span>
                      <span
                        className={`text-[9px] ${
                          message.isCurrentUser
                            ? "text-primary-foreground/50"
                            : "text-muted-foreground/50"
                        }`}
                      >
                        {message.timestamp}
                      </span>
                    </div>
                    <p className="text-xs leading-snug mt-0.5">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={mobileMessagesEndRef} />
            </div>

            {/* Compact Emoji Bar */}
            <div className="flex items-center justify-center gap-1 px-2 py-1 bg-muted/20 border-t border-border/30 flex-shrink-0">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  disabled={chatSending}
                  className="text-base hover:scale-110 rounded px-1 py-0.5 transition-transform disabled:opacity-50 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Compact Input */}
            <div className="flex items-center gap-1.5 p-2 border-t border-border/50 bg-card flex-shrink-0">
              <Input
                placeholder="Message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSendMessage()
                }
                disabled={chatSending}
                className="flex-1 h-8 text-xs border-border/50 focus:border-primary/50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || chatSending}
                size="sm"
                className="h-8 w-8 p-0 rounded-lg"
              >
                {chatSending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        )}

        {activeTab === "statistics" && !isSixNations && (
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <StatisticsTab squadId={squadId} userId={user?.id || ""} />
          </div>
        )}

        {isAdminOrOwner && activeTab === "requests" && (
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <PendingJoinRequests squadId={squadId} squadName={squad?.name || ''} />
          </div>
        )}

        {((hasBothFeatures && activeTab === "leaderboard") ||
          (!hasBothFeatures && features.hasLeaderboard)) && (
          <div className="flex flex-col flex-1 min-h-0 border border-border/50 rounded-xl bg-card overflow-hidden">
            {/* Compact Leaderboard Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-gradient-to-r from-yellow-50 dark:from-yellow-900/10 to-transparent flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                  <Trophy className="w-3 h-3 text-yellow-600" />
                </div>
                <span className="text-xs font-bold">Ranks</span>
              </div>
              <div className="flex items-center gap-0.5 px-2 py-0.5 bg-muted/50 rounded-full">
                <span className="text-[10px] font-bold">
                  {activeSquadRanking.length}
                </span>
              </div>
            </div>

            {/* Six Nations Total/Global Tab Selector (mobile) */}
            {isSixNations && (
              <div className="flex border-b border-border/50 flex-shrink-0">
                <button
                  onClick={() => setSquadLeaderboardTab("total")}
                  className={`flex-1 text-xs font-semibold py-2 transition-colors ${
                    squadLeaderboardTab !== "global"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  Total
                </button>
                <button
                  onClick={() => setSquadLeaderboardTab("global")}
                  className={`flex-1 text-xs font-semibold py-2 transition-colors ${
                    squadLeaderboardTab === "global"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  Global
                </button>
              </div>
            )}

            {/* Ultra-compact Leaderboard List */}
            <div
              className="overflow-y-auto"
              style={{ height: "calc(100vh - 240px)" }}
            >
              {activeSquadRanking.map((member, index) => (
                <div
                  key={member.userId}
                  className={`flex items-center justify-between px-2 py-2 border-b border-border/20 active:bg-primary/5 transition-colors ${
                    member.isCurrentUser
                      ? "bg-primary/10 border-l-2 border-l-primary"
                      : ""
                  } ${
                    index === 0 ? "bg-yellow-50/50 dark:bg-yellow-900/5" : ""
                  } ${index === 1 ? "bg-gray-50/50 dark:bg-gray-800/5" : ""} ${
                    index === 2 ? "bg-orange-50/50 dark:bg-orange-900/5" : ""
                  }`}
                  onClick={() =>
                    setSelectedMember({
                      userId: member.userId,
                      displayName: getDisplayName(member),
                    })
                  }
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {getRankIcon(member.rank)}
                    </div>
                    <Avatar className="w-6 h-6 ring-1 ring-primary/10 flex-shrink-0">
                      <AvatarFallback className="text-[9px] font-bold bg-muted">
                        {getInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-bold truncate ${
                          member.isCurrentUser
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {getDisplayName(member)}
                        {member.isCurrentUser && (
                          <span className="text-[9px] font-normal text-primary/60 ml-0.5">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">
                        {member.wins === 0 &&
                        member.losses === 0 &&
                        member.pushes === 0 ? (
                          <span className="text-muted-foreground/50">
                            No picks
                          </span>
                        ) : (
                          `${member.wins}W-${member.losses}L-${member.pushes}${isSixNations ? 'P' : 'D'}`
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs font-bold">
                      {member.wins === 0 && member.losses === 0 ? (
                        <span className="text-muted-foreground/50">—</span>
                      ) : isSixNations ? (
                        member.points
                      ) : (
                        `${(member.winPercentage / 100).toFixed(2)}`
                      )}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-medium">
                      {isSixNations ? 'pts' : 'W%'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Tabs */}
      {hasBothFeatures ? (
        <div className="hidden sm:block flex-1 flex flex-col min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full flex flex-col flex-1"
          >
            <TabsList className={`grid w-full ${isAdminOrOwner && !isSixNations ? 'grid-cols-3' : 'grid-cols-2'} h-12 mb-4 flex-shrink-0 bg-muted/40 border border-border rounded-xl p-1`}>
              <TabsTrigger
                value="leaderboard"
                className="text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200 rounded-lg"
              >
                <Trophy className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Leaderboard</span>
              </TabsTrigger>
              {!isSixNations && (
                <TabsTrigger
                  value="statistics"
                  className="text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200 rounded-lg"
                >
                  <BarChart3 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Statistics</span>
                </TabsTrigger>
              )}
              {isAdminOrOwner && (
                <TabsTrigger
                  value="requests"
                  className="relative text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200 rounded-lg"
                >
                  <UserPlus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Requests</span>
                  {pendingRequestsCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1.5 text-[10px] font-bold animate-pulse"
                    >
                      {pendingRequestsCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent
              value="leaderboard"
              className="mt-0 flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col border border-border rounded-2xl bg-card shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 rounded-t-2xl flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                      <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Squad Leaderboard
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isSixNations ? 'Tournament standings' : 'Current season standings'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {activeSquadRanking.length} players
                    </span>
                  </div>
                </div>

                {/* Six Nations Round/Total/Global Tab Selector */}
                {isSixNations && (
                  <div className="flex border-b border-border flex-shrink-0">
                    <button
                      onClick={() => setSquadLeaderboardTab("round")}
                      className={`flex-1 text-sm font-semibold py-2.5 transition-colors ${
                        squadLeaderboardTab === "round"
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Current Round
                    </button>
                    <button
                      onClick={() => setSquadLeaderboardTab("total")}
                      className={`flex-1 text-sm font-semibold py-2.5 transition-colors ${
                        squadLeaderboardTab === "total"
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Total
                    </button>
                    <button
                      onClick={() => setSquadLeaderboardTab("global")}
                      className={`flex-1 text-sm font-semibold py-2.5 transition-colors ${
                        squadLeaderboardTab === "global"
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Global
                    </button>
                  </div>
                )}

                <div className="overflow-y-auto" style={{ height: "700px" }}>
                  <div className="divide-y divide-border">
                    {activeSquadRanking.map((member, index) => (
                      <div
                        key={member.userId}
                        className={`flex items-center justify-between p-2.5 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                          member.isCurrentUser
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : ""
                        } ${
                          index === 0
                            ? "bg-yellow-50 dark:bg-yellow-900/10"
                            : ""
                        } ${
                          index === 1 ? "bg-gray-50 dark:bg-gray-800/10" : ""
                        } ${
                          index === 2
                            ? "bg-orange-50 dark:bg-orange-900/10"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedMember({
                            userId: member.userId,
                            displayName: getDisplayName(member),
                          })
                        }
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                            {getRankIcon(member.rank)}
                          </div>

                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                              <AvatarFallback className="text-xs font-medium">
                                {getInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div
                                className={`text-sm font-medium ${
                                  member.isCurrentUser
                                    ? "text-primary"
                                    : "text-foreground"
                                }`}
                              >
                                {getDisplayName(member)}
                                {member.isCurrentUser && (
                                  <span className="ml-1 text-xs font-normal text-primary/70">
                                    (You)
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {member.wins === 0 &&
                                member.losses === 0 &&
                                member.pushes === 0 ? (
                                  <span className="text-muted-foreground/60">
                                    —
                                  </span>
                                ) : (
                                  `${member.wins}W ${member.losses}L ${member.pushes}${isSixNations ? 'P' : 'D'}`
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-6">
                          <div className="text-right hidden sm:block">
                            <div className="font-medium text-foreground">
                              {member.wins === 0 && member.losses === 0 ? (
                                <span className="text-muted-foreground/60">
                                  —
                                </span>
                              ) : isSixNations ? (
                                member.points
                              ) : (
                                `${(member.winPercentage / 100).toFixed(2)}`
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {isSixNations ? 'Points' : 'W%'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-0 flex-1 flex flex-col">
              <div className="flex-1 flex flex-col border border-border rounded-2xl bg-card shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 rounded-t-2xl flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Send className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Squad Chat
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Connect with your teammates
                      </p>
                    </div>
                  </div>
                  {isPolling && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Live
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {formattedChatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isCurrentUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start gap-2 max-w-[85%] sm:max-w-[80%] ${
                          message.isCurrentUser
                            ? "flex-row-reverse"
                            : "flex-row"
                        }`}
                      >
                        <Avatar className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {getInitials({
                              username: message.username,
                              displayName: message.displayName,
                              firstName: message.firstName,
                              lastName: message.lastName,
                            })}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg p-2 sm:p-3 ${
                            message.isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span
                              className={`text-xs font-medium ${
                                message.isCurrentUser
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {getDisplayName({
                                username: message.username,
                                displayName: message.displayName,
                                firstName: message.firstName,
                                lastName: message.lastName,
                              })}
                            </span>
                            <span
                              className={`text-xs ${
                                message.isCurrentUser
                                  ? "text-primary-foreground/60"
                                  : "text-muted-foreground/60"
                              }`}
                            >
                              {message.timestamp}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={desktopMessagesEndRef} />
                </div>

                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-muted/20 border-t border-border/50 flex-shrink-0">
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      disabled={chatSending}
                      className="text-lg hover:bg-muted/50 rounded-lg px-2 py-1 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 p-3 border-t border-border flex-shrink-0">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleSendMessage()
                    }
                    disabled={chatSending}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || chatSending}
                    size="sm"
                    className="h-9 w-9 p-0"
                  >
                    {chatSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {isAdminOrOwner && (
              <TabsContent value="requests" className="mt-0 flex-1">
                <div className="overflow-y-auto pr-2" style={{ maxHeight: "700px" }}>
                  <PendingJoinRequests squadId={squadId} squadName={squad?.name || ''} />
                </div>
              </TabsContent>
            )}

            {!isSixNations && (
              <TabsContent value="statistics" className="mt-0 flex-1">
                <div className="overflow-y-auto pr-2" style={{ maxHeight: "700px" }}>
                  <StatisticsTab squadId={squadId} userId={user?.id || ""} />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      ) : (
        <div className="hidden sm:block">
          {features.hasChat && !features.hasLeaderboard && (
            <Card className="relative overflow-hidden border border-border shadow-lg bg-card">
              <div className="absolute inset-0 bg-muted/20"></div>
              <CardHeader className="relative pb-2 pt-3 px-3">
                <CardTitle className="text-base sm:text-lg">
                  Squad Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-3 p-3 pt-0">
                <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
                  {formattedChatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isCurrentUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start gap-2 max-w-[85%] sm:max-w-[80%] ${
                          message.isCurrentUser
                            ? "flex-row-reverse"
                            : "flex-row"
                        }`}
                      >
                        <Avatar className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {getInitials({
                              username: message.username,
                              displayName: message.displayName,
                              firstName: message.firstName,
                              lastName: message.lastName,
                            })}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg p-2 sm:p-3 ${
                            message.isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span
                              className={`text-xs font-medium ${
                                message.isCurrentUser
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {getDisplayName({
                                username: message.username,
                                displayName: message.displayName,
                                firstName: message.firstName,
                                lastName: message.lastName,
                              })}
                            </span>
                            <span
                              className={`text-xs ${
                                message.isCurrentUser
                                  ? "text-primary-foreground/60"
                                  : "text-muted-foreground/60"
                              }`}
                            >
                              {message.timestamp}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 h-8 text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {features.hasLeaderboard && !features.hasChat && (
            <Card className="relative overflow-hidden border border-border shadow-lg bg-card">
              <div className="absolute inset-0 bg-muted/20"></div>
              <CardHeader className="relative pb-2 pt-3 px-3">
                <CardTitle className="text-base sm:text-lg">
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="relative p-0">
                <div
                  className="divide-y divide-border"
                  style={{
                    height: "400px",
                    overflowY: "scroll",
                    maxHeight: "400px",
                  }}
                >
                  {memberRanking.map((member, index) => (
                    <div
                      key={getDisplayName(member)}
                      className={`flex items-center justify-between p-2.5 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        member.isCurrentUser
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : ""
                      } ${
                        index === 0 ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
                      } ${
                        index === 1 ? "bg-gray-50 dark:bg-gray-800/10" : ""
                      } ${
                        index === 2 ? "bg-orange-50 dark:bg-orange-900/10" : ""
                      }`}
                      onClick={() =>
                        setSelectedMember({
                          userId: member.userId,
                          displayName: getDisplayName(member),
                        })
                      }
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                          {getRankIcon(member.rank)}
                        </div>

                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                            <AvatarFallback className="text-xs font-medium">
                              {getInitials(member)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div
                              className={`text-sm font-semibold ${
                                member.isCurrentUser
                                  ? "text-primary"
                                  : "text-foreground"
                              }`}
                            >
                              {getDisplayName(member)}
                              {member.isCurrentUser && (
                                <span className="ml-1 text-xs font-normal text-primary/70">
                                  (You)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.wins === 0 &&
                              member.losses === 0 &&
                              member.pushes === 0 ? (
                                <span className="text-muted-foreground/60">
                                  —
                                </span>
                              ) : (
                                `${member.wins}W ${member.losses}L ${member.pushes}D`
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-6">
                        <div className="text-right hidden sm:block">
                          <div className="font-semibold text-foreground">
                            {member.wins === 0 &&
                            member.losses === 0 &&
                            member.pushes === 0 ? (
                              <span className="text-muted-foreground/60">
                                —
                              </span>
                            ) : (
                              `${(member.winPercentage / 100).toFixed(2)}`
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            W%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <MemberPicksModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        userId={selectedMember?.userId || ""}
        displayName={selectedMember?.displayName || ""}
        sport={squad?.sport}
      />

      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-xl">
                {isOwner ? "Delete Squad" : "Leave Squad"}
              </DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription className="pt-3 text-base">
            Are you sure you want to {isOwner ? "delete" : "leave"}{" "}
            <span className="font-semibold">"{squad?.name}"</span>?
            {isOwner && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Warning:</strong> Deleting this squad will permanently
                  remove it for all {squad?.members?.length || 0} members. This
                  action cannot be undone.
                </p>
              </div>
            )}
            {!isOwner && (
              <p className="mt-2 text-sm text-muted-foreground">
                You can rejoin this squad later if you have the join code.
              </p>
            )}
          </DialogDescription>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLeaveModal(false)}
              disabled={leaveLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveSquad}
              disabled={leaveLoading}
              className="gap-2"
            >
              {leaveLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isOwner ? "Deleting..." : "Leaving..."}
                </>
              ) : (
                <>
                  {isOwner ? (
                    <Trash2 className="w-4 h-4" />
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )}
                  {isOwner ? "Delete Squad" : "Leave Squad"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SquadDashboard;
