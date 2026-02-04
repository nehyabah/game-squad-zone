import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Bug,
  Lightbulb,
  MessageSquare,
  CheckCircle2,
  Eye,
  Trash2,
  StickyNote,
  Mail,
  Filter,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { feedbackAdminAPI, FeedbackItem, FeedbackStats } from "@/lib/api/feedback";
import { useToast } from "@/hooks/use-toast";

const categoryConfig = {
  general: { label: "General", icon: MessageSquare, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  bug: { label: "Bug Report", icon: Bug, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  feature: { label: "Feature Request", icon: Lightbulb, color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
};

const statusConfig = {
  new: { label: "New", color: "bg-blue-600" },
  reviewed: { label: "Reviewed", color: "bg-yellow-600" },
  resolved: { label: "Resolved", color: "bg-green-600" },
};

export default function AdminFeedbackManager() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);
  const [notesTarget, setNotesTarget] = useState<FeedbackItem | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters: { status?: string; category?: string } = {};
      if (statusFilter) filters.status = statusFilter;
      if (categoryFilter) filters.category = categoryFilter;

      const [feedbackData, statsData] = await Promise.all([
        feedbackAdminAPI.getAll(filters),
        feedbackAdminAPI.getStats(),
      ]);
      setFeedback(feedbackData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading feedback:", error);
      toast({ title: "Error", description: "Failed to load feedback", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "reviewed" | "resolved") => {
    try {
      await feedbackAdminAPI.update(id, { status });
      toast({ title: "Updated", description: `Feedback marked as ${status}` });
      loadData();
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast({ title: "Error", description: "Failed to update feedback", variant: "destructive" });
    }
  };

  const handleSaveNotes = async () => {
    if (!notesTarget) return;
    try {
      await feedbackAdminAPI.update(notesTarget.id, { adminNotes: notesInput });
      toast({ title: "Saved", description: "Admin notes updated" });
      setNotesTarget(null);
      setNotesInput("");
      loadData();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({ title: "Error", description: "Failed to save notes", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await feedbackAdminAPI.delete(deleteTarget.id);
      toast({ title: "Deleted", description: "Feedback has been removed" });
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast({ title: "Error", description: "Failed to delete feedback", variant: "destructive" });
    }
  };

  const openNotesDialog = (item: FeedbackItem) => {
    setNotesTarget(item);
    setNotesInput(item.adminNotes || "");
  };

  if (loading && !stats) {
    return <div className="flex items-center justify-center py-12">Loading feedback...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.new}</div>
              <p className="text-sm text-muted-foreground">New</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.reviewed}</div>
              <p className="text-sm text-muted-foreground">Reviewed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground mr-1">Status:</span>
        {["", "new", "reviewed", "resolved"].map((s) => (
          <Button
            key={s || "all"}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s || "All"}
          </Button>
        ))}
        <span className="text-sm font-medium text-muted-foreground ml-2 mr-1">Category:</span>
        {["", "general", "bug", "feature"].map((c) => (
          <Button
            key={c || "all"}
            variant={categoryFilter === c ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(c)}
          >
            {c || "All"}
          </Button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No feedback found</p>
            </CardContent>
          </Card>
        ) : (
          feedback.map((item) => {
            const cat = categoryConfig[item.category] || categoryConfig.general;
            const status = statusConfig[item.status] || statusConfig.new;
            const CatIcon = cat.icon;

            return (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
                        <CatIcon className="w-3 h-3" />
                        {cat.label}
                      </span>
                      <Badge className={`${status.color} text-white text-xs`}>
                        {status.label}
                      </Badge>
                      {item.contactEmail && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {item.contactEmail}
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-xs shrink-0">
                      {new Date(item.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm whitespace-pre-wrap">{item.content}</p>

                  {item.adminNotes && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <span className="font-medium text-xs text-muted-foreground block mb-1">Admin Notes</span>
                      {item.adminNotes}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.status === "new" && (
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(item.id, "reviewed")}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Mark Reviewed
                      </Button>
                    )}
                    {item.status !== "resolved" && (
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(item.id, "resolved")}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Resolve
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openNotesDialog(item)}>
                      <StickyNote className="w-3.5 h-3.5 mr-1.5" />
                      Notes
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(item)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Admin Notes Dialog */}
      <Dialog open={!!notesTarget} onOpenChange={(open) => { if (!open) setNotesTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
            <DialogDescription>Add internal notes about this feedback.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Add notes..."
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesTarget(null)}>Cancel</Button>
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this feedback? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
