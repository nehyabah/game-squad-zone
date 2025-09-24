import React, { useState, useEffect } from "react";
import { useSquads } from "@/hooks/use-squads";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useSquadLeaderboard } from "@/hooks/use-leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Trophy,
  Users,
  Crown,
  Medal,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowLeft,
  Target,
  Award,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDisplayName, getInitials } from "@/lib/utils/user";

interface MyStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MyStats = ({ open, onOpenChange }: MyStatsProps) => {
  const { user } = useAuth();
  const { squads, loading, refetch } = useSquads();
  const [selectedSquad, setSelectedSquad] = useState<string | null>(null);

  // Get leaderboard data for selected squad
  const squadLeaderboard = useSquadLeaderboard(selectedSquad || "");

  // Refresh squads data when modal opens to get latest user info
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open]); // Removed refetch from dependencies to prevent infinite loop

  if (!user) return null;

  const userStats = {
    totalSquads: squads.length,
    ownedSquads: squads.filter(s => s.ownerId === user.id).length,
    totalPaidPots: squads.filter(s => s.potEnabled && s.payments?.some(p => p.user.id === user.id && p.status === 'completed')).length,
    totalSpent: squads.reduce((sum, squad) => {
      const userPayment = squad.payments?.find(p => p.user.id === user.id && p.status === 'completed');
      return sum + (userPayment?.amount || 0);
    }, 0),
  };

  const selectedSquadData = selectedSquad ? squads.find(s => s.id === selectedSquad) : null;

  const renderSquadList = () => (
    <div className="space-y-2.5">
      {/* Compact Overall Stats */}
      <div className="relative bg-gradient-to-br from-primary/8 via-primary/4 to-transparent rounded-xl p-3 border border-primary/15 overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/3 rounded-full -translate-y-8 translate-x-8"></div>
        
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/15 to-primary/8 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">My Performance</h3>
              <p className="text-xs text-muted-foreground leading-none">Overview stats</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-lg p-2.5 text-center border border-white/15 dark:border-white/5">
              <div className="text-lg font-bold text-primary leading-none">{userStats.totalSquads}</div>
              <div className="text-xs text-muted-foreground font-medium mt-1">Squads</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50/40 to-orange-50/20 dark:from-amber-900/15 dark:to-orange-900/8 rounded-lg p-2.5 text-center border border-amber-200/15 dark:border-amber-800/15">
              <div className="text-lg font-bold text-amber-600 leading-none">{userStats.ownedSquads}</div>
              <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">Owned</div>
            </div>
            <div className="bg-gradient-to-br from-green-50/40 to-emerald-50/20 dark:from-green-900/15 dark:to-emerald-900/8 rounded-lg p-2.5 text-center border border-green-200/15 dark:border-green-800/15">
              <div className="text-lg font-bold text-green-600 leading-none">{userStats.totalPaidPots}</div>
              <div className="text-xs text-green-700 dark:text-green-400 font-medium mt-1">Paid</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-900/15 dark:to-cyan-900/8 rounded-lg p-2.5 text-center border border-blue-200/15 dark:border-blue-800/15">
              <div className="text-lg font-bold text-blue-600 leading-none">€{userStats.totalSpent.toFixed(2)}</div>
              <div className="text-xs text-blue-700 dark:text-blue-400 font-medium mt-1">Spent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Squad List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-semibold text-sm text-foreground/80 uppercase tracking-wide leading-none">
            My Squads ({squads.length})
          </h4>
          {squads.length > 0 && (
            <div className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
              Tap for details
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="absolute inset-0 bg-primary/15 rounded-full animate-ping"></div>
            </div>
          </div>
        ) : squads.length === 0 ? (
          <div className="text-center py-8">
            <div className="relative mb-3">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground/50" />
              </div>
            </div>
            <p className="text-sm font-medium text-foreground/60">No squads yet</p>
            <p className="text-xs mt-0.5 text-muted-foreground">Join or create a squad</p>
          </div>
        ) : (
          squads.map((squad) => {
            const isOwner = squad.ownerId === user.id;
            const userPayment = squad.payments?.find(p => p.user.id === user.id && p.status === 'completed');
            const hasPaid = !!userPayment;
            
            return (
              <Card key={squad.id} className="group hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer bg-gradient-to-r from-background to-background/80 border-border/40 hover:border-primary/25" onClick={() => setSelectedSquad(squad.id)}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary/12 to-primary/4 rounded-lg flex items-center justify-center group-hover:from-primary/15 group-hover:to-primary/6 transition-colors">
                          {squad.imageUrl ? (
                            <img src={squad.imageUrl} alt={squad.name} className="w-9 h-9 rounded-lg object-cover" />
                          ) : (
                            <Users className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        {isOwner && (
                          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                            <Crown className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors leading-tight">{squad.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="secondary" className="text-xs h-4 bg-muted/40 px-1.5">
                            {squad.members.length}m
                          </Badge>
                          {squad.potEnabled && (
                            <Badge 
                              variant={hasPaid ? "default" : "outline"} 
                              className={`text-xs h-4 px-1.5 ${
                                hasPaid 
                                  ? 'bg-green-500/90 text-white border-green-400' 
                                  : 'border-orange-300 text-orange-700 dark:text-orange-400'
                              }`}
                            >
                              {hasPaid ? "✓" : `€${squad.potAmount}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/8 transition-colors">
                        <TrendingUp className="w-3.5 h-3.5 text-primary/70" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );

  const renderSquadDetails = () => {
    if (!selectedSquadData) return null;
    
    const isOwner = selectedSquadData.ownerId === user.id;
    const userPayment = selectedSquadData.payments?.find(p => p.user.id === user.id && p.status === 'completed');
    const hasPaid = !!userPayment;
    const completedPayments = selectedSquadData.payments?.filter(p => p.status === 'completed') || [];
    const totalCollected = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return (
      <div className="space-y-4">
        {/* Compact Squad Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedSquad(null)}
            className="p-1.5 h-8 w-8 rounded-lg bg-muted/40 hover:bg-muted/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/12 to-primary/4 rounded-lg flex items-center justify-center">
                {selectedSquadData.imageUrl ? (
                  <img src={selectedSquadData.imageUrl} alt={selectedSquadData.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <Users className="w-5 h-5 text-primary" />
                )}
              </div>
              {isOwner && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-sm truncate leading-tight">{selectedSquadData.name}</h2>
              <p className="text-xs text-muted-foreground leading-none">
                Created {formatDistanceToNow(new Date(selectedSquadData.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        {/* Compact Squad Pot */}
        {selectedSquadData.potEnabled && (
          <Card className="relative bg-gradient-to-br from-green-50/60 via-emerald-50/40 to-green-50/30 dark:from-green-900/15 dark:via-emerald-900/10 dark:to-green-900/8 border-green-200/40 dark:border-green-800/25 overflow-hidden">
            {/* Minimal background decoration */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-green-400/8 rounded-full -translate-y-6 translate-x-6"></div>
            
            <CardContent className="p-3 relative">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500/12 to-emerald-500/8 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-green-900 dark:text-green-100 leading-tight">Squad Pot</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {completedPayments.length}/{selectedSquadData.members.length} paid
                      </p>
                    </div>
                    {/* Compact Progress bar */}
                    <div className="flex-1 h-1 bg-green-200/25 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${(completedPayments.length / selectedSquadData.members.length) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/50 dark:bg-black/15 backdrop-blur-sm rounded-lg p-2.5 text-center border border-green-200/15 dark:border-green-800/15">
                  <div className="text-base font-bold text-green-700 dark:text-green-300 leading-none">€{totalCollected.toFixed(2)}</div>
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">Collected</div>
                </div>
                <div className="bg-white/50 dark:bg-black/15 backdrop-blur-sm rounded-lg p-2.5 text-center border border-green-200/15 dark:border-green-800/15">
                  <div className="text-base font-bold text-green-700 dark:text-green-300 leading-none">€{selectedSquadData.potAmount?.toFixed(2) || '0.00'}</div>
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">Per Member</div>
                </div>
              </div>
              
              {selectedSquadData.potDeadline && (
                <div className="mt-3 pt-2 border-t border-green-200/25 dark:border-green-800/25">
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50/40 dark:bg-green-900/15 rounded-lg px-2.5 py-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-medium">Deadline: {new Date(selectedSquadData.potDeadline).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Compact Members List */}
        <Card className="bg-gradient-to-b from-background to-background/80 border-border/40">
          <CardHeader className="pb-2 px-3 py-2.5">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              Leaderboard ({squadLeaderboard.data.length || selectedSquadData.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {squadLeaderboard.loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <div className="absolute inset-0 bg-primary/15 rounded-full animate-ping"></div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {squadLeaderboard.data.map((member) => {
                  const memberPayment = selectedSquadData.payments?.find(p => p.userId === member.userId && p.status === 'completed');
                  const memberHasPaid = !!memberPayment;
                  const isCurrentUser = member.userId === user.id;

                  return (
                    <div key={member.userId} className={`px-3 py-2.5 transition-colors ${isCurrentUser ? 'bg-primary/6 border-l-2 border-l-primary/25' : 'hover:bg-muted/20'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center w-7 h-7">
                            {member.rank <= 3 ? (
                              <div className="w-6 h-6 rounded-full bg-muted/50 border border-border/30 flex items-center justify-center">
                                {member.rank === 1 ? (
                                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                                ) : member.rank === 2 ? (
                                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                                )}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm ${isCurrentUser ? 'text-primary' : 'text-foreground'} truncate leading-tight`}>
                                {member.displayName || member.username}
                                {isCurrentUser && <span className="text-xs ml-1 text-primary/60">(You)</span>}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {member.wins === 0 && member.losses === 0 && member.pushes === 0 ? (
                                  <span className="text-xs text-muted-foreground">No picks yet</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {member.wins}W {member.losses}L {member.pushes}D • {(member.winPercentage / 100).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right ml-2 flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-semibold text-sm text-foreground">
                              {member.wins === 0 && member.losses === 0 ? (
                                <span className="text-muted-foreground/60">—</span>
                              ) : (
                                `${(member.winPercentage / 100).toFixed(2)}`
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">W%</div>
                          </div>
                          {selectedSquadData.potEnabled && (
                            <Badge
                              variant={memberHasPaid ? "default" : "outline"}
                              className={`text-xs h-4 px-1.5 ${
                                memberHasPaid
                                  ? 'bg-green-500/90 text-white border-green-400'
                                  : 'border-orange-300 text-orange-700 dark:text-orange-400'
                              }`}
                            >
                              {memberHasPaid ? "✓" : "Pending"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl border-0 p-0 bg-gradient-to-b from-background via-background/98 to-background/95 flex flex-col z-[120]">
        {/* Compact Header */}
        <SheetHeader className="px-4 py-2.5 pb-1 flex-shrink-0 border-b border-border/20">
          <SheetTitle className="flex items-center gap-2.5 text-left">
            <div className="w-7 h-7 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold leading-tight">
                {selectedSquad ? 'Squad Leaderboard' : 'My Stats'}
              </h2>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                {selectedSquad ? 'Member rankings' : 'Performance overview'}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 pb-32 pt-2">
          {selectedSquad ? renderSquadDetails() : renderSquadList()}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MyStats;