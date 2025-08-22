import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Users, Trophy, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

const mockSquads: Squad[] = [
  {
    id: "1",
    name: "Fantasy Masters",
    description: "Competitive squad for serious fantasy players",
    memberCount: 8,
    maxMembers: 10,
    isPublic: false,
    createdBy: "You",
    joinCode: "FM2024"
  },
  {
    id: "2", 
    name: "Office League",
    description: "Fun squad for office colleagues",
    memberCount: 12,
    maxMembers: 15,
    isPublic: true,
    createdBy: "Mike",
    joinCode: "OFFICE"
  },
  {
    id: "3",
    name: "Weekend Warriors",
    description: "Casual weekend picks with friends",
    memberCount: 6,
    maxMembers: 8,
    isPublic: true,
    createdBy: "Sarah",
    joinCode: "WKND24"
  }
];

const SquadManager = () => {
  const [squads, setSquads] = useState<Squad[]>(mockSquads);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSquad, setNewSquad] = useState({
    name: "",
    description: "",
    maxMembers: 10,
    isPublic: true
  });

  const handleCreateSquad = () => {
    const squad: Squad = {
      id: Date.now().toString(),
      name: newSquad.name,
      description: newSquad.description,
      memberCount: 1,
      maxMembers: newSquad.maxMembers,
      isPublic: newSquad.isPublic,
      createdBy: "You",
      joinCode: Math.random().toString(36).substring(2, 8).toUpperCase()
    };
    
    setSquads([squad, ...squads]);
    setNewSquad({ name: "", description: "", maxMembers: 10, isPublic: true });
    setShowCreateDialog(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">My Squads</h2>
          <p className="text-muted-foreground text-sm">Manage your fantasy squads and create new ones</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Create Squad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Create New Squad</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="squad-name">Squad Name</Label>
                <Input
                  id="squad-name"
                  placeholder="Enter squad name"
                  value={newSquad.name}
                  onChange={(e) => setNewSquad({ ...newSquad, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="squad-description">Description</Label>
                <Textarea
                  id="squad-description"
                  placeholder="Describe your squad"
                  value={newSquad.description}
                  onChange={(e) => setNewSquad({ ...newSquad, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="max-members">Max Members</Label>
                <Input
                  id="max-members"
                  type="number"
                  min="2"
                  max="50"
                  value={newSquad.maxMembers}
                  onChange={(e) => setNewSquad({ ...newSquad, maxMembers: parseInt(e.target.value) })}
                />
              </div>
              
              <Button 
                onClick={handleCreateSquad} 
                className="w-full"
                disabled={!newSquad.name.trim()}
              >
                Create Squad
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {squads.map((squad) => (
          <Card key={squad.id} className="relative overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-xl hover:shadow-2xl hover:bg-white/15 transition-all duration-300 group">
            <CardContent className="p-0">
              <div className="p-3 sm:p-4 relative">
                {/* Glass overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base sm:text-lg text-white truncate">{squad.name}</h3>
                        {squad.createdBy === "You" && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex-shrink-0 bg-white/20 text-white border-white/30">Owner</Badge>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-xs px-1.5 py-0.5 mb-2 border-white/30 text-white ${
                        squad.isPublic ? 'bg-green-500/20' : 'bg-orange-500/20'
                      }`}>
                        {squad.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>
                    
                    <Button variant="secondary" size="sm" className="text-xs px-2 sm:px-3 h-7 sm:h-8 flex-shrink-0 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                      <span className="hidden sm:inline">Go to Squad Dashboard</span>
                      <span className="sm:hidden">Dashboard</span>
                    </Button>
                  </div>
                  
                  <p className="text-white/80 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-1">{squad.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/90" />
                        <span className="font-medium text-white">{squad.memberCount}/{squad.maxMembers}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/90" />
                        <span className="font-mono font-medium text-white bg-white/15 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs border border-white/20">
                          {squad.joinCode}
                        </span>
                      </div>
                    </div>
                    
                    {squad.createdBy === "You" && (
                      <Button variant="ghost" size="sm" className="text-xs px-2 h-6 sm:h-7 text-white/80 hover:text-white hover:bg-white/10">
                        Manage
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Glass accent */}
              <div className="h-0.5 bg-gradient-to-r from-white/40 via-white/60 to-white/40"></div>
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