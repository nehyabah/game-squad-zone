import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SquadCreation from "./SquadCreation";
import SquadCard from "./SquadCard";
import { toast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockSquads = [
  {
    id: "1",
    name: "Weekend Warriors",
    memberCount: 8,
    joinCode: "WW2024",
    createdAt: "2 days ago",
    isOwner: true,
  },
  {
    id: "2", 
    name: "Fantasy Legends",
    memberCount: 12,
    joinCode: "FL2024",
    createdAt: "1 week ago",
    isOwner: false,
  },
  {
    id: "3",
    name: "Gridiron Gang",
    memberCount: 6,
    joinCode: "GG2024", 
    createdAt: "3 days ago",
    isOwner: false,
  },
];

const SquadManager = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [squads, setSquads] = useState(mockSquads);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSquads = squads.filter(squad => 
    squad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    squad.joinCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSquadCreated = (newSquad: { name: string; joinCode: string }) => {
    const squad = {
      id: Date.now().toString(),
      name: newSquad.name,
      memberCount: 1,
      joinCode: newSquad.joinCode,
      createdAt: "Just now",
      isOwner: true,
    };
    setSquads(prev => [squad, ...prev]);
    setView('list');
  };

  const handleJoinSquad = (squadId: string) => {
    setSquads(prev => prev.map(squad => 
      squad.id === squadId 
        ? { ...squad, memberCount: squad.memberCount + 1 }
        : squad
    ));
    toast({
      title: "Joined squad!",
      description: "You're now a member of this squad",
    });
  };

  const handleViewSquad = (squadId: string) => {
    const squad = squads.find(s => s.id === squadId);
    toast({
      title: `Viewing ${squad?.name}`,
      description: "Squad dashboard coming soon!",
    });
  };

  if (view === 'create') {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setView('list')}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          ← Back to Squads
        </Button>
        <SquadCreation onSquadCreated={handleSquadCreated} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-md border border-white/20">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-display text-white flex items-center justify-center gap-2">
            <Users className="w-6 h-6 text-blue-300" />
            My Squads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Search squads or join codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
              />
            </div>
            <Button
              onClick={() => setView('create')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>

          <div className="space-y-3">
            {filteredSquads.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                {searchTerm ? "No squads match your search" : "No squads found"}
              </div>
            ) : (
              filteredSquads.map((squad) => (
                <SquadCard
                  key={squad.id}
                  squad={squad}
                  onJoinSquad={handleJoinSquad}
                  onViewSquad={handleViewSquad}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SquadManager;