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
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{squad.name}</h1>
          <p className="text-sm text-muted-foreground">{squad.description}</p>
        </div>
      </div>

      {/* Squad Info */}
      <Card className="border-0 shadow-card bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {squad.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{squad.memberCount}/{squad.maxMembers} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-purple-500" />
                  <span>Code: <span className="font-mono font-bold">{squad.joinCode}</span></span>
                </div>
              </div>
            </div>
            <Badge variant={squad.isPublic ? "secondary" : "outline"} className="text-xs">
              {squad.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto mb-6">
          <TabsTrigger value="chat">Squad Chat</TabsTrigger>
          <TabsTrigger value="ranking">Rankings</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card className="border-0 shadow-card bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Squad Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat Messages */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mockChatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-2 max-w-[80%] ${
                      message.isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {message.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg p-3 ${
                        message.isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <div className="flex items-baseline gap-2 mb-1">
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
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking">
          <Card className="border-0 shadow-card bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Squad Rankings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockSquadRanking.map((member, index) => (
                  <div 
                    key={member.username}
                    className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
                      member.isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    } ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''} ${
                      index === 1 ? 'bg-gradient-to-r from-gray-50 to-transparent' : ''
                    } ${index === 2 ? 'bg-gradient-to-r from-orange-50 to-transparent' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(member.rank)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-sm font-medium">
                            {member.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className={`font-semibold ${member.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                            {member.username}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.wins}W - {member.losses}L
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-semibold text-foreground">{member.winPercentage}%</div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg text-primary">{member.points}</div>
                        <div className="text-xs text-muted-foreground">Points</div>
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