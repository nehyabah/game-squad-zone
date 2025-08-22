import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, Users, Trophy, Crown, Medal, Award } from "lucide-react";

interface Squad {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  isPublic: boolean;
  createdBy: string;
  joinCode: string;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  isCurrentUser: boolean;
}

interface SquadMember {
  username: string;
  rank: number;
  wins: number;
  losses: number;
  winPercentage: number;
  points: number;
  isCurrentUser?: boolean;
}

const mockChatMessages: ChatMessage[] = [
  { id: "1", username: "Alex", message: "Good luck everyone for this week's picks!", timestamp: "2:30 PM", isCurrentUser: false },
  { id: "2", username: "Jordan", message: "I'm feeling confident about the Chiefs game", timestamp: "2:32 PM", isCurrentUser: false },
  { id: "3", username: "You", message: "Same here! Let's get these wins 🔥", timestamp: "2:35 PM", isCurrentUser: true },
  { id: "4", username: "Taylor", message: "Anyone else going with the over on the Bills game?", timestamp: "2:38 PM", isCurrentUser: false },
  { id: "5", username: "Ryan", message: "I'm staying away from that one, too risky", timestamp: "2:40 PM", isCurrentUser: false },
];

const mockSquadRanking: SquadMember[] = [
  { username: "Alex", rank: 1, wins: 8, losses: 2, winPercentage: 80, points: 180 },
  { username: "Jordan", rank: 2, wins: 7, losses: 3, winPercentage: 70, points: 160 },
  { username: "You", rank: 3, wins: 6, losses: 4, winPercentage: 60, points: 140, isCurrentUser: true },
  { username: "Taylor", rank: 4, wins: 5, losses: 5, winPercentage: 50, points: 120 },
  { username: "Ryan", rank: 5, wins: 4, losses: 6, winPercentage: 40, points: 100 },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 2:
      return <Medal className="w-4 h-4 text-gray-400" />;
    case 3:
      return <Award className="w-4 h-4 text-amber-600" />;
    default:
      return <span className="w-4 h-4 flex items-center justify-center text-muted-foreground font-bold text-xs">{rank}</span>;
  }
};

interface SquadDashboardProps {
  squad: Squad;
  onBack: () => void;
}

const SquadDashboard = ({ squad, onBack }: SquadDashboardProps) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // In a real app, this would send the message to the backend
    setNewMessage("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6 px-3 sm:px-0">
      {/* Compact Header */}
      <div className="flex items-center gap-3 py-2">
        <Button variant="ghost" onClick={onBack} className="p-1.5 h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{squad.name}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{squad.description}</p>
        </div>
      </div>

      {/* Compact Squad Info */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {squad.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <span className="font-medium">{squad.memberCount}/{squad.maxMembers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                  <span className="font-mono font-bold">{squad.joinCode}</span>
                </div>
              </div>
            </div>
            <Badge variant={squad.isPublic ? "secondary" : "outline"} className="text-xs px-2 py-0.5">
              {squad.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Compact Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10 mb-3 sm:mb-6">
          <TabsTrigger value="chat" className="text-xs sm:text-sm">💬 Squad Chat</TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs sm:text-sm">🏆 Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-0">
          <Card className="border-0 shadow-sm bg-card">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-base sm:text-lg">Squad Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3 pt-0">
              {/* Compact Chat Messages */}
              <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
                {mockChatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-2 max-w-[85%] sm:max-w-[80%] ${
                      message.isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <Avatar className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {message.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg p-2 sm:p-3 ${
                        message.isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className={`text-xs font-medium ${
                            message.isCurrentUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          }`}>
                            {message.username}
                          </span>
                          <span className={`text-xs ${
                            message.isCurrentUser ? 'text-primary-foreground/60' : 'text-muted-foreground/60'
                          }`}>
                            {message.timestamp}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm">{message.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compact Message Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 h-8 text-sm"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="sm" className="h-8 w-8 p-0">
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-0">
          <Card className="border-0 shadow-sm bg-card">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-base sm:text-lg">🏆 Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockSquadRanking.map((member, index) => (
                  <div 
                    key={member.username}
                    className={`flex items-center justify-between p-2.5 sm:p-4 hover:bg-muted/50 transition-colors ${
                      member.isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    } ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''} ${
                      index === 1 ? 'bg-gradient-to-r from-gray-50 to-transparent' : ''
                    } ${index === 2 ? 'bg-gradient-to-r from-orange-50 to-transparent' : ''}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                        {getRankIcon(member.rank)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                          <AvatarFallback className="text-xs font-medium">
                            {member.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className={`text-sm font-semibold ${member.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                            {member.username}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.wins}W - {member.losses}L
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6">
                      <div className="text-right hidden sm:block">
                        <div className="font-semibold text-foreground">{member.winPercentage}%</div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-sm sm:text-lg text-primary">{member.points}</div>
                        <div className="text-xs text-muted-foreground">Points</div>
                      </div>
                      
                      {/* Mobile compact view */}
                      <div className="text-right sm:hidden">
                        <div className="text-xs text-muted-foreground">{member.winPercentage}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SquadDashboard;