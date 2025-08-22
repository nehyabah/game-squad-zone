import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Users, Trophy, Calendar, Copy, Share2, MessageCircle, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import SquadDashboard from "./SquadDashboard";

interface Squad {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  isPublic: boolean;
  createdBy: string;
  joinCode: string;
  features: {
    hasChat: boolean;
    hasLeaderboard: boolean;
  };
}

const mockSquads: Squad[] = [
  {
    id: "1",
    name: "Fantasy Masters",
    description: "Competitive squad for serious fantasy players",
    memberCount: 8,
    maxMembers: 10,
    isPublic: false,
    createdBy: "You",
    joinCode: "FM2024",
    features: {
      hasChat: true,
      hasLeaderboard: true
    }
  },
  {
    id: "2", 
    name: "Office League",
    description: "Fun squad for office colleagues",
    memberCount: 12,
    maxMembers: 15,
    isPublic: true,
    createdBy: "Mike",
    joinCode: "OFFICE",
    features: {
      hasChat: true,
      hasLeaderboard: false
    }
  },
  {
    id: "3",
    name: "Weekend Warriors",
    description: "Casual weekend picks with friends",
    memberCount: 6,
    maxMembers: 8,
    isPublic: true,
    createdBy: "Sarah",
    joinCode: "WKND24",
    features: {
      hasChat: false,
      hasLeaderboard: true
    }
  }
];

const SquadManager = () => {
  const [squads, setSquads] = useState<Squad[]>(mockSquads);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [createdSquad, setCreatedSquad] = useState<Squad | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [newSquad, setNewSquad] = useState({
    name: "",
    description: "",
    maxMembers: 10,
    isPublic: true
  });

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
    }, 250);
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 400);
  };

  const handleCreateSquad = () => {
    const squad: Squad = {
      id: Date.now().toString(),
      name: newSquad.name,
      description: newSquad.description,
      memberCount: 1,
      maxMembers: newSquad.maxMembers,
      isPublic: newSquad.isPublic,
      createdBy: "You",
      joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      features: {
        hasChat: true,
        hasLeaderboard: true
      }
    };
    
    setSquads([squad, ...squads]);
    setCreatedSquad(squad);
    
    // Trigger celebration
    triggerConfetti();
    toast.success(`🎉 Squad "${squad.name}" created successfully!`, {
      description: `Join code: ${squad.joinCode}`
    });
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
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const shareGeneric = async (squad: Squad) => {
    const shareData = {
      title: `Join ${squad.name}`,
      text: `🎯 Join my fantasy squad "${squad.name}"! Use join code: ${squad.joinCode}`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
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

  const handleJoinSquad = () => {
    // Find the squad with the matching join code
    const existingSquad = mockSquads.find(squad => squad.joinCode.toLowerCase() === joinCode.toLowerCase());
    
    if (existingSquad) {
      // Check if user is already in this squad
      const isAlreadyMember = squads.some(squad => squad.id === existingSquad.id);
      
      if (isAlreadyMember) {
        toast.error("You're already a member of this squad!");
        return;
      }
      
      // Add squad to user's squads list
      const joinedSquad = { ...existingSquad, memberCount: existingSquad.memberCount + 1 };
      setSquads([joinedSquad, ...squads]);
      
      triggerConfetti();
      toast.success(`🎉 Successfully joined "${existingSquad.name}"!`);
      
      setJoinCode("");
      setShowJoinDialog(false);
    } else {
      toast.error("Invalid join code. Please check and try again.");
    }
  };

  const handleViewSquad = (squad: Squad) => {
    setSelectedSquad(squad);
  };

  const handleBackToSquads = () => {
    setSelectedSquad(null);
  };

  // If a squad is selected, show the dashboard
  if (selectedSquad) {
    return <SquadDashboard squad={selectedSquad} onBack={handleBackToSquads} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">My Squads</h2>
          <p className="text-muted-foreground text-sm">Manage your fantasy squads and create new ones</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 flex-1 sm:w-auto">
                <Plus className="w-4 h-4" />
                Create Squad
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-xs mx-auto p-0 gap-0 border-0 bg-white rounded-2xl shadow-2xl">
              {!createdSquad ? (
                // Squad Creation Form
                <>
                  <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-3 border-b border-border/50">
                    <DialogHeader className="space-y-0">
                      <DialogTitle className="text-base font-semibold text-center">Create Squad</DialogTitle>
                    </DialogHeader>
                  </div>
                  
                  <div className="p-3 space-y-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="squad-name" className="text-xs font-medium text-muted-foreground">Squad Name</Label>
                      <Input
                        id="squad-name"
                        placeholder="Enter squad name"
                        value={newSquad.name}
                        onChange={(e) => setNewSquad({ ...newSquad, name: e.target.value })}
                        className="h-9 border-border/50 rounded-lg focus:ring-1 focus:ring-primary/50 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="squad-description" className="text-xs font-medium text-muted-foreground">Description (Optional)</Label>
                      <Textarea
                        id="squad-description"
                        placeholder="What's your squad about?"
                        value={newSquad.description}
                        onChange={(e) => setNewSquad({ ...newSquad, description: e.target.value })}
                        rows={2}
                        className="border-border/50 rounded-lg focus:ring-1 focus:ring-primary/50 text-sm resize-none"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="max-members" className="text-xs font-medium text-muted-foreground">Max Members</Label>
                      <Input
                        id="max-members"
                        type="number"
                        min="2"
                        max="50"
                        value={newSquad.maxMembers}
                        onChange={(e) => setNewSquad({ ...newSquad, maxMembers: parseInt(e.target.value) })}
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
                      <DialogTitle className="text-base font-semibold text-center">🎉 Squad Created!</DialogTitle>
                    </DialogHeader>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {/* Squad Info */}
                    <div className="text-center space-y-1.5">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-base mx-auto">
                        {createdSquad.name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-semibold text-sm">{createdSquad.name}</h3>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Join Code</p>
                        <p className="font-mono font-bold text-base tracking-wider text-primary">{createdSquad.joinCode}</p>
                      </div>
                    </div>
                    
                    {/* Sharing Options */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground text-center">Share with friends</p>
                      
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
              <Button variant="outline" className="gap-2 flex-1 sm:w-auto">
                <UserPlus className="w-4 h-4" />
                Join Squad
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-xs mx-auto p-0 gap-0 border-0 bg-white rounded-2xl shadow-2xl">
              <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 p-3 border-b border-border/50">
                <DialogHeader className="space-y-0">
                  <DialogTitle className="text-base font-semibold text-center">Join Squad</DialogTitle>
                </DialogHeader>
              </div>
              
              <div className="p-3 space-y-3">
                <div className="text-center space-y-1.5">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-base mx-auto">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-muted-foreground">Enter the join code to become part of an existing squad</p>
                </div>
                
                <div className="space-y-2">
                  <Input
                    placeholder="Enter join code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="h-9 border-border/50 rounded-lg focus:ring-1 focus:ring-primary/50 text-sm text-center font-mono tracking-wider"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Try: FM2024, OFFICE, or WKND24
                  </p>
                </div>
                
                <div className="flex gap-2 pt-1">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowJoinDialog(false);
                      setJoinCode("");
                    }}
                    className="flex-1 h-9 rounded-lg border-border/50 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleJoinSquad} 
                    className="flex-1 h-9 rounded-lg text-sm font-medium"
                    disabled={!joinCode.trim()}
                  >
                    Join
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-2">
        {squads.map((squad) => (
          <Card key={squad.id} className="relative overflow-hidden border-0 bg-white shadow-md hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-0">
              {/* Compact Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 border-b border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {squad.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{squad.name}</h3>
                      <div className="flex items-center gap-2">
                        {squad.createdBy === "You" && (
                          <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 border-0">Owner</Badge>
                        )}
                        <Badge variant="secondary" className={`text-xs px-1.5 py-0.5 border-0 ${
                          squad.isPublic 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {squad.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {squad.createdBy === "You" && (
                      <Button variant="outline" size="sm" className="text-xs px-2 h-7 text-gray-600 hover:text-gray-700 bg-white border-gray-200">
                        Manage
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 h-7"
                      onClick={() => handleViewSquad(squad)}
                    >
                      <span className="hidden sm:inline">Dashboard</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Compact Content */}
              <div className="p-3">
                <p className="text-gray-600 text-xs mb-2 line-clamp-1">{squad.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs text-gray-500">Members:</span>
                      <span className="font-medium text-sm text-gray-900">{squad.memberCount}/{squad.maxMembers}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-xs text-gray-500">Code:</span>
                      <span className="font-mono font-medium text-sm text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">{squad.joinCode}</span>
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
              <h3 className="font-semibold text-foreground mb-2">No Squads Yet</h3>
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