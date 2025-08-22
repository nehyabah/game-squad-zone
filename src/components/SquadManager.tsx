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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">My Squads</h2>
          <p className="text-muted-foreground text-sm">Manage your fantasy squads and create new ones</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Squad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
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

      <div className="grid gap-4">
        {squads.map((squad) => (
          <div key={squad.id} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-xl text-white">{squad.name}</h3>
                    <div className="flex gap-2">
                      {squad.createdBy === "You" && (
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                          Owner
                        </span>
                      )}
                      <span className={`px-2 py-1 backdrop-blur-sm rounded-full text-xs font-medium ${
                        squad.isPublic ? 'bg-green-400/20 text-green-100' : 'bg-orange-400/20 text-orange-100'
                      }`}>
                        {squad.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-white/80 text-sm mb-4 leading-relaxed">{squad.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/90">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{squad.memberCount}/{squad.maxMembers}</span>
                      <span className="text-white/70">members</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-white/90">
                      <Trophy className="w-4 h-4" />
                      <span className="text-white/70">Join Code:</span>
                      <span className="font-mono font-bold text-white bg-white/10 px-2 py-1 rounded">
                        {squad.joinCode}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  >
                    View Details
                  </Button>
                  {squad.createdBy === "You" && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      Manage
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Corner Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          </div>
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