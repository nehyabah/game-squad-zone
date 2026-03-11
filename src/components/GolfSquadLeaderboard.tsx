import { useState, useEffect } from "react";
import { golfPicksUserAPI } from "@/lib/api/golf-picks";
import { golfAPI, GolfPlayer } from "@/lib/api/golf";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── helpers ───────────────────────────────────────────────────────────────────
function scoreColor(score: string | undefined) {
  if (!score || score === "E" || score === "—") return "";
  if (score.startsWith("-")) return "text-red-500";
  if (score.startsWith("+")) return "text-blue-500";
  return "";
}

function parseScore(score: string | undefined): number {
  if (!score || score === "E" || score === "—") return 0;
  const n = parseInt(score, 10);
  return isNaN(n) ? 0 : n;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <span className="text-sm">🥇</span>;
  if (rank === 2) return <span className="text-sm">🥈</span>;
  if (rank === 3) return <span className="text-sm">🥉</span>;
  return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{rank}</span>;
}

function getInitials(displayName: string | null, username: string) {
  const name = displayName || username;
  return name.slice(0, 2).toUpperCase();
}

// ── types ────────────────────────────────────────────────────────────────────
interface MemberRow {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  picks: { groupNumber: number; playerId: string; firstName: string; lastName: string }[];
  picksSubmitted: number;
  picksHidden: boolean;
  totalScore: number;
  rank: number;
  isCurrentUser: boolean;
}

interface Props {
  squadId: string;
  onMemberClick?: (userId: string, displayName: string) => void;
}

export default function GolfSquadLeaderboard({ squadId, onMemberClick }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [tournamentName, setTournamentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLeaderboard, setHasLeaderboard] = useState(false);

  useEffect(() => {
    if (!squadId) return;
    setLoading(true);

    golfPicksUserAPI.getSquadLeaderboard(squadId)
      .then(async (data) => {
        setTournamentName(data.tournament.name);

        let statsMap = new Map<string, GolfPlayer>();
        try {
          const lb = await golfAPI.getLeaderboard(data.tournament.tournId, data.tournament.year);
          lb.leaderboardRows.forEach((p) => statsMap.set(p.playerId, p));
          setHasLeaderboard(lb.leaderboardRows.length > 0);
        } catch {
          // No leaderboard yet
        }

        const isLocked = data.tournament.isLocked;

        // Use DB scores if all picks have been scored, otherwise fall back to live leaderboard
        const hasDbScores = data.members.every((m) =>
          m.picks.length === 0 || m.picks.every((p) => p.score !== null)
        );

        const built = data.members.map((m) => {
          const picksHidden = !isLocked && m.userId !== user?.id;
          let totalScore: number;
          if (picksHidden) {
            totalScore = 0;
          } else if (hasDbScores) {
            totalScore = m.picks.reduce((sum, p) => sum + (p.score ?? 0), 0);
          } else {
            totalScore = m.picks
              .map((p) => statsMap.get(p.playerId))
              .filter((s): s is GolfPlayer => s !== undefined)
              .reduce((sum, s) => {
                const isCut = s.status === "cut" || s.status === "C";
                return sum + parseScore(s.total) + (isCut ? 10 : 0);
              }, 0);
          }

          return {
            userId: m.userId,
            username: m.username,
            displayName: m.displayName,
            avatarUrl: m.avatarUrl,
            picks: m.picks,
            picksSubmitted: m.picksSubmitted,
            picksHidden,
            totalScore,
            isCurrentUser: m.userId === user?.id,
          };
        });

        const sorted = [...built].sort((a, b) => {
          // No picks at all → bottom
          if (a.picksSubmitted === 0 && b.picksSubmitted === 0) return 0;
          if (a.picksSubmitted === 0) return 1;
          if (b.picksSubmitted === 0) return -1;
          // Picks hidden (not locked yet) → can't rank fairly, keep original order
          if (a.picksHidden && b.picksHidden) return 0;
          if (a.picksHidden) return 1;
          if (b.picksHidden) return -1;
          if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore;
          return b.picksSubmitted - a.picksSubmitted;
        });

        setRows(sorted.map((m, i) => ({ ...m, rank: i + 1 })));
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [squadId, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Loading standings…</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-xs">
        No picks submitted yet
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/40">
        <span className="text-[10px] text-muted-foreground font-medium truncate">{tournamentName}</span>
        {hasLeaderboard && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0">Total</span>
        )}
      </div>

      {rows.map((member, index) => {
        const noPicks = member.picksSubmitted === 0;
        const totalStr =
          member.totalScore === 0 ? "E"
          : member.totalScore > 0 ? `+${member.totalScore}`
          : `${member.totalScore}`;

        return (
          <button
            key={member.userId}
            onClick={() => !noPicks && !member.picksHidden && onMemberClick?.(
              member.userId,
              member.displayName || member.username
            )}
            disabled={noPicks || member.picksHidden}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-2.5 border-b border-border/20 text-left transition-colors",
              member.isCurrentUser && "bg-primary/10 border-l-2 border-l-primary",
              index === 0 && !member.isCurrentUser && "bg-yellow-50/50 dark:bg-yellow-900/5",
              index === 1 && !member.isCurrentUser && "bg-gray-50/50 dark:bg-gray-800/5",
              index === 2 && !member.isCurrentUser && "bg-orange-50/50 dark:bg-orange-900/5",
              !noPicks && "active:bg-primary/5"
            )}
          >
            {/* Rank */}
            <div className="w-5 flex items-center justify-center flex-shrink-0">
              {getRankIcon(member.rank)}
            </div>

            {/* Avatar */}
            <Avatar className="w-6 h-6 ring-1 ring-primary/10 flex-shrink-0">
              <AvatarFallback className="text-[9px] font-bold bg-muted">
                {getInitials(member.displayName, member.username)}
              </AvatarFallback>
            </Avatar>

            {/* Name + subtitle */}
            <div className="flex-1 min-w-0">
              <div className={cn("text-xs font-bold truncate", member.isCurrentUser && "text-primary")}>
                {member.displayName || member.username}
                {member.isCurrentUser && (
                  <span className="text-[9px] font-normal text-primary/60 ml-0.5">(You)</span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {noPicks ? (
                  <span className="text-muted-foreground/50">No picks</span>
                ) : member.picksHidden ? (
                  <span className="text-muted-foreground/60">🔒 Revealed when tournament starts</span>
                ) : (
                  <span>{member.picksSubmitted} pick{member.picksSubmitted !== 1 ? "s" : ""} · tap to view</span>
                )}
              </div>
            </div>

            {/* Score */}
            {!noPicks && (
              <div className="text-right flex-shrink-0">
                {member.picksHidden ? (
                  <span className="text-[10px] text-muted-foreground">{member.picksSubmitted}/5</span>
                ) : hasLeaderboard ? (
                  <span className={cn("text-xs font-bold tabular-nums", scoreColor(totalStr))}>
                    {totalStr}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">{member.picksSubmitted}/5</span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
