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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{squad.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {squad.memberCount}/{squad.maxMembers}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {squad.joinCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-gray-100 p-1 rounded-full h-12 w-80">
              <TabsTrigger 
                value="chat" 
                className="flex-1 rounded-full h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                💬 Chat
              </TabsTrigger>
              <TabsTrigger 
                value="ranking" 
                className="flex-1 rounded-full h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                🏆 Rankings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="mt-0">
            {/* Modern Chat Design */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                <h3 className="font-semibold">Squad Chat</h3>
                <p className="text-sm opacity-80">{squad.memberCount} members online</p>
              </div>

              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {mockChatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${message.isCurrentUser ? 'order-2' : 'order-1'}`}>
                      {!message.isCurrentUser && (
                        <p className="text-xs text-gray-500 mb-1 px-3">{message.username}</p>
                      )}
                      <div className={`rounded-2xl px-4 py-2 shadow-sm ${
                        message.isCurrentUser 
                          ? 'bg-blue-500 text-white ml-auto' 
                          : 'bg-white border border-gray-100'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3 bg-gray-50 rounded-full p-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 border-0 bg-transparent focus:ring-0 text-sm"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim()}
                    className="rounded-full w-10 h-10 p-0 bg-blue-500 hover:bg-blue-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ranking" className="mt-0">
            {/* Modern Rankings Design */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Rankings Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                <h3 className="font-semibold">Squad Rankings</h3>
                <p className="text-sm opacity-80">Current season standings</p>
              </div>

              {/* Rankings List */}
              <div className="p-4 space-y-3">
                {mockSquadRanking.map((member, index) => (
                  <div 
                    key={member.username}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all hover:shadow-md ${
                      member.isCurrentUser ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 border border-gray-100'
                    } ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-500 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index < 3 ? getRankIcon(member.rank) : member.rank}
                      </div>
                      
                      <div>
                        <div className={`font-semibold ${member.isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}>
                          {member.username}
                          {member.isCurrentUser && <span className="ml-2 text-blue-500">👤</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.wins}W • {member.losses}L • {member.winPercentage}%
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900">{member.points}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SquadDashboard;