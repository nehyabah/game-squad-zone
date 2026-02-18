import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Send, RefreshCw, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  emailNotificationAPI,
  EmailLog,
  RecipientFilter,
  RecipientPreview,
} from "@/lib/api/email-notifications";
import { adminUsersAPI, User } from "@/lib/api/six-nations";
import type { Round } from "./SixNationsManager";

interface Props {
  rounds: Round[];
}

type NotificationType = "round_results" | "picks_reminder" | "custom";

const TYPE_LABELS: Record<string, string> = {
  round_results: "Round Results",
  picks_reminder: "Picks Reminder",
  custom: "Custom",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  partial_failure: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  sending: "bg-blue-100 text-blue-800",
  pending: "bg-gray-100 text-gray-800",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmailNotificationManager({ rounds }: Props) {
  const { toast } = useToast();

  // Compose state
  const [notificationType, setNotificationType] = useState<NotificationType>("round_results");
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>("all");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [preview, setPreview] = useState<RecipientPreview | null>(null);
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // History state
  const [history, setHistory] = useState<EmailLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadHistory();
  }, []);

  // Load Six Nations user list when "specific" filter is chosen
  useEffect(() => {
    if (recipientFilter === "specific" && allUsers.length === 0) {
      adminUsersAPI.getSixNationsUsers().then(setAllUsers).catch(console.error);
    }
  }, [recipientFilter]);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await emailNotificationAPI.getHistory(50);
      setHistory(data);
    } catch (error) {
      console.error("Error loading email history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePreviewRecipients = async () => {
    try {
      setPreviewing(true);
      const roundId = needsRound ? selectedRoundId : undefined;
      const userIds = recipientFilter === "specific" ? selectedUserIds : undefined;
      const data = await emailNotificationAPI.previewRecipients(
        recipientFilter,
        roundId,
        userIds
      );
      setPreview(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to preview recipients",
        variant: "destructive",
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleSend = async () => {
    try {
      setSending(true);
      let result;

      if (notificationType === "round_results") {
        result = await emailNotificationAPI.sendRoundResults(
          selectedRoundId,
          recipientFilter,
          recipientFilter === "specific" ? selectedUserIds : undefined
        );
      } else if (notificationType === "picks_reminder") {
        result = await emailNotificationAPI.sendPicksReminder(
          selectedRoundId,
          recipientFilter,
          recipientFilter === "specific" ? selectedUserIds : undefined
        );
      } else {
        result = await emailNotificationAPI.sendCustom(
          customSubject,
          customBody,
          recipientFilter,
          selectedRoundId || undefined,
          recipientFilter === "specific" ? selectedUserIds : undefined
        );
      }

      toast({
        title: "Emails Sent",
        description: `${result.successCount}/${result.recipientCount} delivered successfully`,
        variant: result.failureCount > 0 ? "destructive" : "default",
      });

      // Reset form
      setCustomSubject("");
      setCustomBody("");
      setPreview(null);
      loadHistory();
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error.response?.data?.error || "Failed to send emails",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const needsRound = notificationType === "round_results" || notificationType === "picks_reminder";

  const canSend =
    (notificationType === "round_results" && selectedRoundId) ||
    (notificationType === "picks_reminder" && selectedRoundId) ||
    (notificationType === "custom" && customSubject.trim() && customBody.trim());

  const filteredHistory =
    historyTypeFilter === "all" ? history : history.filter((h) => h.type === historyTypeFilter);

  return (
    <div className="space-y-6">
      {/* ── Compose Section ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Compose Email Notification
          </CardTitle>
          <CardDescription>
            Send personalized emails to Six Nations players
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notification Type */}
          <div className="space-y-2">
            <Label>Notification Type</Label>
            <Select
              value={notificationType}
              onValueChange={(v) => {
                setNotificationType(v as NotificationType);
                setPreview(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round_results">Round Results</SelectItem>
                <SelectItem value="picks_reminder">Picks Open Reminder</SelectItem>
                <SelectItem value="custom">Custom Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Round Selector (for results and reminder) */}
          {needsRound && (
            <div className="space-y-2">
              <Label>Round</Label>
              <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} (Round {r.roundNumber})
                      {r.isActive && " — Active"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Subject & Body */}
          {notificationType === "custom" && (
            <>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g., Important Update for Six Nations Players"
                />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="Write your message here. Use {{firstName}} or {{username}} for personalization."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Supports: {"{{firstName}}"}, {"{{username}}"} for personalization. Newlines are preserved.
                </p>
              </div>
            </>
          )}

          {/* Recipient Filter */}
          {(
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Select
                value={recipientFilter}
                onValueChange={(v) => {
                  setRecipientFilter(v as RecipientFilter);
                  setPreview(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Six Nations Players</SelectItem>
                  <SelectItem value="active_players">Active Players (submitted picks)</SelectItem>
                  <SelectItem value="missing_picks">Missing Picks (for selected round)</SelectItem>
                  <SelectItem value="specific">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Specific User Multi-Select */}
          {recipientFilter === "specific" && (
            <div className="space-y-2">
              <Label>Select Users ({selectedUserIds.length} selected)</Label>
              <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-1">
                {allUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">Loading users...</p>
                ) : (
                  allUsers.map((user) => {
                    const displayName = (user as any).displayName || user.firstName || user.username;
                    const sub = (user as any).displayName
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || `@${user.username}`
                      : `@${user.username}`;
                    return (
                      <label
                        key={user.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                        <span className="text-sm">
                          {displayName}{" "}
                          <span className="text-muted-foreground text-xs">{sub}</span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Preview + Send Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handlePreviewRecipients}
              disabled={previewing}
            >
              {previewing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Preview Recipients
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!canSend || sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Emails
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Send</AlertDialogTitle>
                  <AlertDialogDescription>
                    You're about to send a <strong>{TYPE_LABELS[notificationType]}</strong> email
                    {preview ? ` to ${preview.count} recipient(s)` : ""}.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSend}>
                    Send Now
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Preview Results */}
          {preview && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="text-sm font-medium mb-2">
                {preview.count} recipient{preview.count !== 1 ? "s" : ""} will receive this email:
              </p>
              {(preview.unsubscribedCount ?? 0) > 0 && (
                <p className="text-xs text-amber-600 mb-2">
                  {preview.unsubscribedCount} user{preview.unsubscribedCount !== 1 ? "s have" : " has"} unsubscribed and will not receive emails.
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {preview.recipients.slice(0, 20).map((r) => (
                  <Badge key={r.id} variant="secondary" className="text-xs">
                    @{r.username}
                  </Badge>
                ))}
                {preview.count > 20 && (
                  <Badge variant="outline" className="text-xs">
                    +{preview.count - 20} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── History Section ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email History</CardTitle>
              <CardDescription>{filteredHistory.length} entries</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="round_results">Round Results</SelectItem>
                  <SelectItem value="picks_reminder">Picks Reminder</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadHistory}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">Loading...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
            <div className="overflow-y-auto max-h-[420px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-[120px]">Recipients</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[100px]">Sent By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No emails sent yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistory.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABELS[log.type] || log.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {log.subject}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="text-green-600">{log.successCount}</span>
                          {log.failureCount > 0 && (
                            <>
                              {" / "}
                              <span className="text-red-600">{log.failureCount} failed</span>
                            </>
                          )}
                          {log.failureCount === 0 && (
                            <span className="text-muted-foreground"> / {log.recipientCount}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              STATUS_COLORS[log.status] || STATUS_COLORS.pending
                            }`}
                          >
                            {log.status === "partial_failure" ? "Partial" : log.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.sentByUser?.username || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
