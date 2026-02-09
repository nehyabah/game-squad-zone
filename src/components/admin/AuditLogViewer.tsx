import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Shield, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auditLogAPI, AuditLogEntry, SuspiciousActivityReport } from "@/lib/api/six-nations";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  set_correct_answer: { label: "Set Answer", color: "bg-green-100 text-green-800" },
  clear_correct_answer: { label: "Clear Answer", color: "bg-yellow-100 text-yellow-800" },
  update_match_score: { label: "Update Score", color: "bg-blue-100 text-blue-800" },
  answer_submitted: { label: "Answer Submitted", color: "bg-gray-100 text-gray-800" },
  answer_rejected_locked: { label: "REJECTED (Locked)", color: "bg-red-100 text-red-800" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ActionBadge({ action }: { action: string }) {
  const config = ACTION_LABELS[action] || { label: action, color: "bg-gray-100 text-gray-800" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

function DetailsCell({ details, action }: { details: Record<string, any> | null; action: string }) {
  if (!details) return <span className="text-muted-foreground">-</span>;

  if (action === "answer_rejected_locked") {
    return (
      <div className="text-sm space-y-0.5">
        <div className="font-medium text-red-700">{details.reason}</div>
        <div className="text-muted-foreground">
          Answer: "{details.answer}" at {details.submittedAt ? formatDate(details.submittedAt) : "?"}
        </div>
      </div>
    );
  }

  if (action === "answer_submitted") {
    return (
      <div className="text-sm text-muted-foreground">
        Answer: "{details.answer}" | Match: {details.matchDate ? formatDate(details.matchDate) : "?"}
      </div>
    );
  }

  if (action === "set_correct_answer") {
    return (
      <div className="text-sm">
        <span className="text-muted-foreground">{details.questionText}</span>
        {" → "}<span className="font-medium text-green-700">{details.correctAnswer}</span>
      </div>
    );
  }

  if (action === "clear_correct_answer") {
    return (
      <div className="text-sm">
        <span className="text-muted-foreground">{details.questionText}</span>
        {" — was: "}<span className="line-through">{details.oldCorrectAnswer}</span>
      </div>
    );
  }

  if (action === "update_match_score") {
    return (
      <div className="text-sm">
        {details.homeTeam} vs {details.awayTeam}:{" "}
        <span className="text-muted-foreground">
          {details.oldHomeScore ?? "?"}-{details.oldAwayScore ?? "?"}
        </span>
        {" → "}
        <span className="font-medium">{details.newHomeScore}-{details.newAwayScore}</span>
      </div>
    );
  }

  return <pre className="text-xs text-muted-foreground max-w-xs truncate">{JSON.stringify(details)}</pre>;
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [suspicious, setSuspicious] = useState<SuspiciousActivityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, suspiciousData] = await Promise.all([
        auditLogAPI.getAll({ limit: 200 }),
        auditLogAPI.getSuspicious(),
      ]);
      setLogs(logsData);
      setSuspicious(suspiciousData);
    } catch (error) {
      console.error("Error loading audit data:", error);
      toast({
        title: "Error",
        description: "Failed to load audit log data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = actionFilter === "all"
    ? logs
    : logs.filter(l => l.action === actionFilter);

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading audit data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Suspicious Activity Flags */}
      {suspicious && (suspicious.flaggedUsers.length > 0 || suspicious.lateSubmissions.length > 0) && (
        <Card className="border-red-300">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg text-red-700">Flagged Activity</CardTitle>
            </div>
            <CardDescription>
              {suspicious.totalRejections} rejected attempt(s), {suspicious.totalLateSubmissions} late submission(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suspicious.flaggedUsers.map((flagged) => (
              <Collapsible
                key={flagged.user.id}
                open={expandedUsers.has(flagged.user.id)}
                onOpenChange={() => toggleUserExpanded(flagged.user.id)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                    {expandedUsers.has(flagged.user.id)
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                    }
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div className="flex-1">
                      <span className="font-medium">
                        {flagged.user.firstName} {flagged.user.lastName}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        (@{flagged.user.username})
                      </span>
                      {flagged.user.email && (
                        <span className="text-muted-foreground text-sm ml-2">{flagged.user.email}</span>
                      )}
                    </div>
                    <Badge variant="destructive">
                      {flagged.rejectedAttempts} blocked attempt{flagged.rejectedAttempts !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-8 mt-2 space-y-1">
                    {flagged.entries.map((entry) => {
                      const details = entry.details as Record<string, any> | null;
                      return (
                        <div key={entry.id} className="text-sm p-2 bg-red-50/50 rounded border border-red-100">
                          <div className="flex justify-between">
                            <span className="text-red-700 font-medium">
                              {details?.reason || "Attempted submission after lock"}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                          {details?.answer && (
                            <div className="text-muted-foreground mt-0.5">
                              Tried to submit: "{details.answer}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            {suspicious.lateSubmissions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-yellow-700 mb-2 flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Late Submissions (within 2h of kickoff, before lock)
                </h4>
                <div className="space-y-1">
                  {suspicious.lateSubmissions.slice(0, 10).map((entry) => {
                    const details = entry.details as Record<string, any> | null;
                    return (
                      <div key={entry.id} className="text-sm p-2 bg-yellow-50 rounded border border-yellow-100 flex justify-between">
                        <span>
                          <span className="font-medium">{entry.performedByUser?.username || "unknown"}</span>
                          {" — "}{details?.answer ? `"${details.answer}"` : "answer submitted"}
                        </span>
                        <span className="text-muted-foreground text-xs">{formatDate(entry.createdAt)}</span>
                      </div>
                    );
                  })}
                  {suspicious.lateSubmissions.length > 10 && (
                    <div className="text-sm text-muted-foreground text-center">
                      ...and {suspicious.lateSubmissions.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No flags - all clear */}
      {suspicious && suspicious.flaggedUsers.length === 0 && suspicious.lateSubmissions.length === 0 && (
        <Card className="border-green-300">
          <CardContent className="flex items-center gap-3 py-4">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="text-green-700 font-medium">No suspicious activity detected</span>
          </CardContent>
        </Card>
      )}

      {/* Full Audit Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>{filteredLogs.length} entries</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="answer_rejected_locked">Rejected (Locked)</SelectItem>
                  <SelectItem value="answer_submitted">Answer Submitted</SelectItem>
                  <SelectItem value="set_correct_answer">Set Correct Answer</SelectItem>
                  <SelectItem value="clear_correct_answer">Clear Correct Answer</SelectItem>
                  <SelectItem value="update_match_score">Update Match Score</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">Time</TableHead>
                  <TableHead className="w-[160px]">Action</TableHead>
                  <TableHead className="w-[150px]">User</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No audit log entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className={log.action === "answer_rejected_locked" ? "bg-red-50/50" : ""}
                    >
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.performedByUser ? (
                            <>
                              <span className="font-medium">{log.performedByUser.username}</span>
                              {log.action === "answer_rejected_locked" && (
                                <AlertTriangle className="inline h-3 w-3 text-red-500 ml-1" />
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">{log.performedBy.slice(0, 8)}...</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DetailsCell details={log.details as Record<string, any> | null} action={log.action} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
