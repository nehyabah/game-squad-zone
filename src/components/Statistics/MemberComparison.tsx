import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Target, TrendingUp, Users2, Loader2, Crown } from "lucide-react";
import { statsAPI, type MemberComparisonData, type PersonalStatsData } from "@/lib/api/stats";
import { squadsAPI, type SquadMember } from "@/lib/api/squads";

interface MemberComparisonProps {
  squadId: string;
}

export const MemberComparison = ({ squadId }: MemberComparisonProps) => {
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [member1Id, setMember1Id] = useState<string>("");
  const [member2Id, setMember2Id] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<MemberComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [membersLoading, setMembersLoading] = useState(true);

  // Fetch squad members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setMembersLoading(true);
        const squad = await squadsAPI.getSquad(squadId);
        setMembers(squad.members || []);
      } catch (err) {
        console.error('Error fetching squad members:', err);
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, [squadId]);

  // Fetch comparison when both members are selected
  useEffect(() => {
    const fetchComparison = async () => {
      if (!member1Id || !member2Id) {
        setComparisonData(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await statsAPI.getMemberComparison(member1Id, member2Id, squadId);
        setComparisonData(data);
      } catch (err) {
        console.error('Error fetching comparison:', err);
        setError(err instanceof Error ? err.message : 'Failed to load comparison');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [member1Id, member2Id, squadId]);

  const showComparison = comparisonData && !loading;

  // Helper to get member name
  const getMemberName = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    if (!member) return "Unknown";
    return member.user?.displayName || member.user?.username || member.username;
  };

  // Get member stats directly from backend data
  const getMemberStats = (stats: PersonalStatsData) => {
    return {
      totalPicks: stats.totalPicks || 0,
      wins: stats.totalWins || 0,
      losses: stats.totalLosses || 0,
      pushes: stats.totalPushes || 0,
      winRate: (stats.winPercentage || 0).toString()
    };
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Member Selectors - More compact */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-lg">Select Members to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="text-[10px] sm:text-sm font-medium mb-1 block">Member 1</label>
                  <Select value={member1Id} onValueChange={setMember1Id}>
                    <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Select first member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter((m) => m.userId !== member2Id)
                        .map((member) => (
                          <SelectItem key={member.userId} value={member.userId} className="text-xs sm:text-sm">
                            {member.user?.displayName || member.user?.username || member.username}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] sm:text-sm font-medium mb-1 block">Member 2</label>
                  <Select value={member2Id} onValueChange={setMember2Id}>
                    <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Select second member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter((m) => m.userId !== member1Id)
                        .map((member) => (
                          <SelectItem key={member.userId} value={member.userId} className="text-xs sm:text-sm">
                            {member.user?.displayName || member.user?.username || member.username}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {member1Id && member2Id && (
                <Button
                  onClick={() => {
                    setMember1Id("");
                    setMember2Id("");
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2 sm:mt-4 text-xs sm:text-sm h-7 sm:h-9"
                >
                  Clear
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && member1Id && member2Id && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && member1Id && member2Id && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="py-8 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {showComparison && comparisonData && (
        <>
          {/* Head to Head */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                <Users2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                Head-to-Head
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-1 sm:gap-4 items-center">
                <div className={`text-center p-2 sm:p-3 rounded-xl transition-all duration-300 ${
                  comparisonData.headToHead.member1Wins > comparisonData.headToHead.member2Wins
                    ? 'bg-green-500/15 ring-2 ring-green-500/30'
                    : 'bg-muted/30'
                }`}>
                  {comparisonData.headToHead.member1Wins > comparisonData.headToHead.member2Wins && (
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mx-auto mb-1 animate-pulse" />
                  )}
                  <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 truncate">
                    {getMemberName(member1Id).split(" ")[0]}
                  </p>
                  <p className={`text-xl sm:text-3xl font-bold ${
                    comparisonData.headToHead.member1Wins > comparisonData.headToHead.member2Wins
                      ? 'text-green-600'
                      : 'text-primary'
                  }`}>
                    {comparisonData.headToHead.member1Wins}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-sm font-medium text-muted-foreground">vs</p>
                </div>
                <div className={`text-center p-2 sm:p-3 rounded-xl transition-all duration-300 ${
                  comparisonData.headToHead.member2Wins > comparisonData.headToHead.member1Wins
                    ? 'bg-green-500/15 ring-2 ring-green-500/30'
                    : 'bg-muted/30'
                }`}>
                  {comparisonData.headToHead.member2Wins > comparisonData.headToHead.member1Wins && (
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mx-auto mb-1 animate-pulse" />
                  )}
                  <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 truncate">
                    {getMemberName(member2Id).split(" ")[0]}
                  </p>
                  <p className={`text-xl sm:text-3xl font-bold ${
                    comparisonData.headToHead.member2Wins > comparisonData.headToHead.member1Wins
                      ? 'text-green-600'
                      : 'text-primary'
                  }`}>
                    {comparisonData.headToHead.member2Wins}
                  </p>
                </div>
              </div>
              <p className="text-[9px] sm:text-xs text-center text-muted-foreground mt-1.5 sm:mt-3">
                Weeks where one outperformed the other
              </p>
            </CardContent>
          </Card>

          {/* Overall Stats */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-sm sm:text-lg">Overall Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {/* Member 1 */}
                <div className="space-y-1.5 sm:space-y-3">
                  <h4 className="font-semibold text-[10px] sm:text-sm text-center truncate">
                    {getMemberName(member1Id).split(" ")[0]}
                  </h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="p-1.5 sm:p-3 bg-muted/50 rounded-lg">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Record</p>
                      <p className="text-sm sm:text-lg font-bold">
                        {getMemberStats(comparisonData.member1Stats).wins}-{getMemberStats(comparisonData.member1Stats).losses}
                      </p>
                    </div>
                    <div className={`p-1.5 sm:p-3 rounded-lg transition-all duration-200 ${
                      parseFloat(getMemberStats(comparisonData.member1Stats).winRate) > parseFloat(getMemberStats(comparisonData.member2Stats).winRate)
                        ? 'bg-green-500/15 ring-1 ring-green-500/30'
                        : 'bg-muted/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] sm:text-xs text-muted-foreground">Win Rate</p>
                        {parseFloat(getMemberStats(comparisonData.member1Stats).winRate) > parseFloat(getMemberStats(comparisonData.member2Stats).winRate) && (
                          <Trophy className="w-3 h-3 text-amber-500" />
                        )}
                      </div>
                      <p
                        className={`text-sm sm:text-lg font-bold ${
                          parseFloat(getMemberStats(comparisonData.member1Stats).winRate) > parseFloat(getMemberStats(comparisonData.member2Stats).winRate)
                            ? "text-green-600"
                            : "text-foreground"
                        }`}
                      >
                        {getMemberStats(comparisonData.member1Stats).winRate}%
                      </p>
                    </div>
                    <div className="p-1.5 sm:p-3 bg-muted/50 rounded-lg">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Picks</p>
                      <p className="text-sm sm:text-lg font-bold">{getMemberStats(comparisonData.member1Stats).totalPicks}</p>
                    </div>
                  </div>
                </div>

                {/* Member 2 */}
                <div className="space-y-1.5 sm:space-y-3">
                  <h4 className="font-semibold text-[10px] sm:text-sm text-center truncate">
                    {getMemberName(member2Id).split(" ")[0]}
                  </h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="p-1.5 sm:p-3 bg-muted/50 rounded-lg">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Record</p>
                      <p className="text-sm sm:text-lg font-bold">
                        {getMemberStats(comparisonData.member2Stats).wins}-{getMemberStats(comparisonData.member2Stats).losses}
                      </p>
                    </div>
                    <div className={`p-1.5 sm:p-3 rounded-lg transition-all duration-200 ${
                      parseFloat(getMemberStats(comparisonData.member2Stats).winRate) > parseFloat(getMemberStats(comparisonData.member1Stats).winRate)
                        ? 'bg-green-500/15 ring-1 ring-green-500/30'
                        : 'bg-muted/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] sm:text-xs text-muted-foreground">Win Rate</p>
                        {parseFloat(getMemberStats(comparisonData.member2Stats).winRate) > parseFloat(getMemberStats(comparisonData.member1Stats).winRate) && (
                          <Trophy className="w-3 h-3 text-amber-500" />
                        )}
                      </div>
                      <p
                        className={`text-sm sm:text-lg font-bold ${
                          parseFloat(getMemberStats(comparisonData.member2Stats).winRate) > parseFloat(getMemberStats(comparisonData.member1Stats).winRate)
                            ? "text-green-600"
                            : "text-foreground"
                        }`}
                      >
                        {getMemberStats(comparisonData.member2Stats).winRate}%
                      </p>
                    </div>
                    <div className="p-1.5 sm:p-3 bg-muted/50 rounded-lg">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Picks</p>
                      <p className="text-sm sm:text-lg font-bold">{getMemberStats(comparisonData.member2Stats).totalPicks}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pick Patterns Comparison */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Pick Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                {/* Home vs Away */}
                <div>
                  <p className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Home vs Away</p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 truncate">
                        {getMemberName(member1Id).split(" ")[0]}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span>Home</span>
                          <span className="font-bold">{comparisonData.member1Stats.pickPatterns.homeRate}%</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                            style={{ width: `${comparisonData.member1Stats.pickPatterns.homeRate}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span>Away</span>
                          <span className="font-bold">{comparisonData.member1Stats.pickPatterns.awayRate}%</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full"
                            style={{ width: `${comparisonData.member1Stats.pickPatterns.awayRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 truncate">
                        {getMemberName(member2Id).split(" ")[0]}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span>Home</span>
                          <span className="font-bold">{comparisonData.member2Stats.pickPatterns.homeRate}%</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                            style={{ width: `${comparisonData.member2Stats.pickPatterns.homeRate}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span>Away</span>
                          <span className="font-bold">{comparisonData.member2Stats.pickPatterns.awayRate}%</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full"
                            style={{ width: `${comparisonData.member2Stats.pickPatterns.awayRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Favorite vs Underdog */}
                <div>
                  <p className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
                    Favorite vs Underdog
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 truncate">
                        {getMemberName(member1Id).split(" ")[0]}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span>Fav</span>
                          <span className="font-bold">{comparisonData.member1Stats.pickPatterns.favoriteRate}%</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-full rounded-full"
                            style={{ width: `${comparisonData.member1Stats.pickPatterns.favoriteRate}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span>Dog</span>
                          <span className="font-bold">{comparisonData.member1Stats.pickPatterns.underdogRate}%</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full"
                            style={{ width: `${comparisonData.member1Stats.pickPatterns.underdogRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 truncate">
                        {getMemberName(member2Id).split(" ")[0]}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span>Fav</span>
                          <span className="font-bold">{comparisonData.member2Stats.pickPatterns.favoriteRate}%</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-full rounded-full"
                            style={{ width: `${comparisonData.member2Stats.pickPatterns.favoriteRate}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span>Dog</span>
                          <span className="font-bold">{comparisonData.member2Stats.pickPatterns.underdogRate}%</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full"
                            style={{ width: `${comparisonData.member2Stats.pickPatterns.underdogRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spread Performance Comparison */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Spread Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Member 1 */}
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 font-semibold truncate">
                    {getMemberName(member1Id).split(" ")[0]}
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {comparisonData.member1Stats.spreadPerformance.map((spread) => (
                      <div key={spread.range} className="space-y-1">
                        <div className="flex justify-between text-[10px] sm:text-xs">
                          <span className="truncate">{spread.range}</span>
                          <span
                            className={`font-bold ${
                              spread.winRate >= 60 ? "text-green-600" : "text-foreground"
                            }`}
                          >
                            {spread.winRate}%
                          </span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className={`h-full rounded-full ${
                              spread.winRate >= 60
                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                : "bg-gradient-to-r from-gray-400 to-gray-500"
                            }`}
                            style={{ width: `${spread.winRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Member 2 */}
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 font-semibold truncate">
                    {getMemberName(member2Id).split(" ")[0]}
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {comparisonData.member2Stats.spreadPerformance.map((spread) => (
                      <div key={spread.range} className="space-y-1">
                        <div className="flex justify-between text-[10px] sm:text-xs">
                          <span className="truncate">{spread.range}</span>
                          <span
                            className={`font-bold ${
                              spread.winRate >= 60 ? "text-green-600" : "text-foreground"
                            }`}
                          >
                            {spread.winRate}%
                          </span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className={`h-full rounded-full ${
                              spread.winRate >= 60
                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                : "bg-gradient-to-r from-gray-400 to-gray-500"
                            }`}
                            style={{ width: `${spread.winRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favorite Teams Comparison */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Top 3 Favorite Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Member 1 */}
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 font-semibold truncate">
                    {getMemberName(member1Id).split(" ")[0]}
                  </p>
                  <div className="space-y-1.5 sm:space-y-2">
                    {comparisonData.member1Stats.favoriteTeams.map((team) => (
                      <div
                        key={team.team}
                        className="p-1.5 sm:p-2 bg-muted/50 rounded-lg text-[10px] sm:text-xs"
                      >
                        <p className="font-semibold truncate">{team.team}</p>
                        <p className="text-muted-foreground">
                          {team.wins}-{team.losses}{team.pushes > 0 ? `-${team.pushes}` : ''} • {team.winRate}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Member 2 */}
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 font-semibold truncate">
                    {getMemberName(member2Id).split(" ")[0]}
                  </p>
                  <div className="space-y-1.5 sm:space-y-2">
                    {comparisonData.member2Stats.favoriteTeams.map((team) => (
                      <div
                        key={team.team}
                        className="p-1.5 sm:p-2 bg-muted/50 rounded-lg text-[10px] sm:text-xs"
                      >
                        <p className="font-semibold truncate">{team.team}</p>
                        <p className="text-muted-foreground">
                          {team.wins}-{team.losses}{team.pushes > 0 ? `-${team.pushes}` : ''} • {team.winRate}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!showComparison && (
        <Card className="border-0 shadow-md border-dashed border-2">
          <CardContent className="py-12 sm:py-16 text-center">
            <Users2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm sm:text-base text-muted-foreground">
              Select two members to compare their stats
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
