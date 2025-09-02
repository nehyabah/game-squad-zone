import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, Users, Trophy, Crown, Medal, Award, Loader2, UserMinus } from "lucide-react";
import { useSquads, useSquad } from "@/hooks/use-squads";
import { useAuth } from "@/hooks/use-auth";
import { useSquadChat } from "@/hooks/use-squad-chat";
import type { Squad } from "@/lib/api/squads";
import type { ChatMessage as APIChatMessage } from "@/lib/api/chat";
import { getDisplayName, getInitials } from "@/lib/utils/user";
import { squadsAPI } from "@/lib/api/squads";

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
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  rank: number;
  wins: number;
  losses: number;
  winPercentage: number;
  points: number;
  isCurrentUser?: boolean;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 2:
      return <Medal className="w-4 h-4 text-gray-400" />;
    case 3:
      return <Award className="w-4 h-4 text-orange-400" />;
    default:
      return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-muted-foreground">#{rank}</span>;
  }
};

interface SquadDashboardProps {
  squadId: string;
  onBack: () => void;
}

const SquadDashboard = ({ squadId, onBack }: SquadDashboardProps) => {
  const { squad, loading, error } = useSquad(squadId);
  const { leaveSquad, deleteSquad } = useSquads();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");
  const [newMessage, setNewMessage] = useState("");
  
  // Chat functionality with auto-refresh every 3 seconds
  const { 
    messages: chatMessages, 
    loading: chatLoading, 
    sending: chatSending, 
    sendMessage, 
    refetch: refetchMessages,
    isPolling
  } = useSquadChat(squadId, 3000);

  // Enable both chat and leaderboard features
  const features: SquadFeatures = {
    hasChat: true, // Chat is now implemented
    hasLeaderboard: true, // Show member leaderboard using real data
  };

  // Mark messages as read when component mounts or when switching to chat tab
  useEffect(() => {
    const markAsRead = async () => {
      if (activeTab === "chat" && squadId) {
        try {
          await squadsAPI.markMessagesAsRead(squadId);
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      }
    };
    
    markAsRead();
  }, [squadId, activeTab]);

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

  // Generate member ranking from real squad data
  const memberRanking: SquadMemberRanking[] = squad.members.map((member, index) => ({
    username: member.user?.username || member.username || 'Unknown',
    displayName: member.user?.displayName || null,
    firstName: member.user?.firstName || null,
    lastName: member.user?.lastName || null,
    rank: index + 1,
    wins: 0, // TODO: Implement win/loss tracking
    losses: 0,
    winPercentage: 0,
    points: 0,
    isCurrentUser: false, // TODO: Add current user detection
  }));

  // Format chat messages for compatibility
  const formattedChatMessages: ChatMessage[] = chatMessages.map(msg => ({
    id: msg.id,
    username: msg.user.username,
    displayName: msg.user.displayName,
    firstName: msg.user.firstName,
    lastName: msg.user.lastName,
    message: msg.message,
    timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    isCurrentUser: msg.isCurrentUser
  }));

  const handleSendMessage = async () => {
    if (!newMessage.trim() || chatSending) return;
    
    try {
      await sendMessage({ message: newMessage.trim() });
      setNewMessage("");
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const isOwner = squad?.ownerId === user?.id;

  const handleLeaveSquad = async () => {
    const action = isOwner ? 'delete' : 'leave';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${squad?.name}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    const success = isOwner 
      ? await deleteSquad(squadId)
      : await leaveSquad(squadId);
      
    if (success) {
      onBack(); // Go back to squad list after leaving/deleting
    }
  };

  const hasBothFeatures = features.hasChat && features.hasLeaderboard;

  return (
    <div className="h-screen flex flex-col max-w-4xl mx-auto px-2 sm:px-0">
      {/* Ultra Compact Header */}
      <div className="flex items-center gap-2 py-1 flex-shrink-0">
        <Button variant="ghost" onClick={onBack} className="p-1 h-7 w-7">
          <ArrowLeft className="w-3 h-3" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">{squad.name}</h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Users className="w-3 h-3 text-primary" />
          <span className="font-medium">{squad.members?.length || 0}</span>
          <Trophy className="w-3 h-3 text-primary" />
          <span className="font-mono font-bold">{squad.joinCode}</span>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLeaveSquad}
          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <UserMinus className="w-3 h-3 mr-1" />
          {isOwner ? 'Delete' : 'Leave'}
        </Button>
      </div>

      {/* Mobile Top Tabs - Only show if squad has both features */}
      {hasBothFeatures && (
        <div className="sm:hidden flex-shrink-0 pb-2">
          <div className="grid grid-cols-2 bg-background border border-border rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center justify-center text-xs font-medium py-1.5 px-2 rounded-md transition-all duration-200 ${
                activeTab === "chat" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex items-center justify-center text-xs font-medium py-1.5 px-2 rounded-md transition-all duration-200 ${
                activeTab === "leaderboard" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              🏆 Ranks
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile Content */}
        <div className="sm:hidden flex-1 flex flex-col min-h-0">
          {((hasBothFeatures && activeTab === "chat") || (!hasBothFeatures && features.hasChat)) && (
            <div className="flex-1 flex flex-col min-h-0 border border-primary/10 rounded-lg bg-background">
              {/* Chat Header */}
              <div className="flex items-center gap-2 p-2 border-b border-border flex-shrink-0">
                <span className="text-sm font-medium">💬 Chat</span>
                {isPolling && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Live</span>
                  </div>
                )}
              </div>
              
              {/* Chat Messages - This takes up most of the screen */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {formattedChatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-1.5 max-w-[85%] ${
                      message.isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <Avatar className="w-4 h-4 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials({username: message.username, displayName: message.displayName, firstName: message.firstName, lastName: message.lastName})}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg p-2 ${
                        message.isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className={`text-xs font-medium ${
                            message.isCurrentUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          }`}>
                            {getDisplayName({username: message.username, displayName: message.displayName, firstName: message.firstName, lastName: message.lastName})}
                          </span>
                          <span className={`text-xs ${
                            message.isCurrentUser ? 'text-primary-foreground/60' : 'text-muted-foreground/60'
                          }`}>
                            {message.timestamp}
                          </span>
                        </div>
                        <p className="text-xs">{message.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Chat Input - Fixed at bottom */}
              <div className="flex items-center gap-2 p-2 border-t border-border flex-shrink-0">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={chatSending}
                  className="flex-1 h-8 text-sm"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim() || chatSending} 
                  size="sm" 
                  className="h-8 w-8 p-0"
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

          {((hasBothFeatures && activeTab === "leaderboard") || (!hasBothFeatures && features.hasLeaderboard)) && (
            <div className="flex-1 flex flex-col min-h-0 border border-primary/10 rounded-lg bg-background">
              {/* Leaderboard Header */}
              <div className="flex items-center gap-2 p-2 border-b border-border flex-shrink-0">
                <span className="text-sm font-medium">🏆 Leaderboard</span>
              </div>
              
              {/* Leaderboard Content */}
              <div className="flex-1 overflow-y-auto">
                {memberRanking.map((member, index) => (
                  <div 
                    key={getDisplayName(member)}
                    className={`flex items-center justify-between p-2 border-b border-border/30 hover:bg-muted/30 transition-colors ${
                      member.isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    } ${index === 0 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent' : ''} ${
                      index === 1 ? 'bg-gradient-to-r from-gray-50/50 to-transparent' : ''
                    } ${index === 2 ? 'bg-gradient-to-r from-orange-50/50 to-transparent' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                        {getRankIcon(member.rank)}
                      </div>
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs font-medium">
                          {getInitials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className={`text-xs font-semibold ${member.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                          {getDisplayName(member)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.wins}W - {member.losses}L
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="text-right">
                        <div className="font-bold text-primary">{member.points}</div>
                        <div className="text-muted-foreground">pts</div>
                      </div>
                      <div className="text-muted-foreground">
                        {member.winPercentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Tabs */}
        {hasBothFeatures && (
          <div className="hidden sm:block flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1">
              <TabsList className="grid w-full grid-cols-2 h-9 mb-2 flex-shrink-0">
                <TabsTrigger value="chat" className="text-sm">💬 Squad Chat</TabsTrigger>
                <TabsTrigger value="leaderboard" className="text-sm">🏆 Leaderboard</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="mt-0 flex-1 flex flex-col">
                <div className="flex-1 flex flex-col border border-primary/10 rounded-lg bg-background">
                  <div className="flex items-center gap-2 p-3 border-b border-border flex-shrink-0">
                    <span className="text-base font-medium">💬 Squad Chat</span>
                    {isPolling && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600">Live</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {formattedChatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2 max-w-[85%] ${
                          message.isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                        }`}>
                          <Avatar className="w-5 h-5 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {getInitials({username: message.username, displayName: message.displayName, firstName: message.firstName, lastName: message.lastName})}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`rounded-lg p-2 ${
                            message.isCurrentUser 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className={`text-xs font-medium ${
                                message.isCurrentUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}>
                                {getDisplayName({username: message.username, displayName: message.displayName, firstName: message.firstName, lastName: message.lastName})}
                              </span>
                              <span className={`text-xs ${
                                message.isCurrentUser ? 'text-primary-foreground/60' : 'text-muted-foreground/60'
                              }`}>
                                {message.timestamp}
                              </span>
                            </div>
                            <p className="text-xs">{message.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 p-3 border-t border-border flex-shrink-0">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
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

              <TabsContent value="leaderboard" className="mt-0 flex-1 flex flex-col">
                <div className="flex-1 flex flex-col border border-primary/10 rounded-lg bg-background">
                  <div className="flex items-center gap-2 p-3 border-b border-border flex-shrink-0">
                    <span className="text-base font-medium">🏆 Leaderboard</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {memberRanking.map((member, index) => (
                      <div 
                        key={getDisplayName(member)}
                        className={`flex items-center justify-between p-3 border-b border-border/30 hover:bg-muted/30 transition-colors ${
                          member.isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                        } ${index === 0 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent' : ''} ${
                          index === 1 ? 'bg-gradient-to-r from-gray-50/50 to-transparent' : ''
                        } ${index === 2 ? 'bg-gradient-to-r from-orange-50/50 to-transparent' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                            {getRankIcon(member.rank)}
                          </div>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-sm font-medium">
                              {getInitials(member)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className={`text-sm font-semibold ${member.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                              {getDisplayName(member)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.wins}W - {member.losses}L
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <div className="font-bold text-primary">{member.points}</div>
                            <div className="text-xs text-muted-foreground">Points</div>
                          </div>
                          <div className="text-muted-foreground">
                            {member.winPercentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default SquadDashboard;