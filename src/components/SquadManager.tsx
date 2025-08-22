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
          <Card key={squad.id} className="relative overflow-hidden border-0 bg-white shadow-md hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-0">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 sm:p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">
                      {squad.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900">{squad.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {squad.createdBy === "You" && (
                          <Badge variant="default" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border-0">Owner</Badge>
                        )}
                        <Badge variant="secondary" className={`text-xs px-2 py-0.5 border-0 ${
                          squad.isPublic 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {squad.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5">
                    <span className="hidden sm:inline">Dashboard</span>
                    <span className="sm:hidden">View</span>
                  </Button>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-3 sm:p-4">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{squad.description}</p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-gray-500">Members</span>
                    </div>
                    <div className="font-semibold text-lg text-gray-900">{squad.memberCount}/{squad.maxMembers}</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-gray-500">Join Code</span>
                    </div>
                    <div className="font-mono font-semibold text-lg text-gray-900">{squad.joinCode}</div>
                  </div>
                </div>

                {/* Action Section */}
                {squad.createdBy === "You" && (
                  <div className="pt-3 border-t border-gray-100">
                    <Button variant="outline" size="sm" className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                      Manage Squad Settings
                    </Button>
                  </div>
                )}
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