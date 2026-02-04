import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Bug, Lightbulb, MessageSquare, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { feedbackAPI, SubmitFeedbackData } from "@/lib/api/feedback";

interface FeedbackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { value: "general" as const, label: "General", icon: MessageSquare, color: "blue" },
  { value: "bug" as const, label: "Bug Report", icon: Bug, color: "red" },
  { value: "feature" as const, label: "Feature Request", icon: Lightbulb, color: "amber" },
];

export default function FeedbackForm({ open, onOpenChange }: FeedbackFormProps) {
  const { toast } = useToast();
  const [category, setCategory] = useState<SubmitFeedbackData["category"]>("general");
  const [content, setContent] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setCategory("general");
    setContent("");
    setContactEmail("");
    setSubmitted(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    if (content.trim().length < 10) {
      toast({
        title: "Too short",
        description: "Please write at least 10 characters.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await feedbackAPI.submit({
        content: content.trim(),
        category,
        contactEmail: contactEmail.trim() || undefined,
      });
      setSubmitted(true);
      toast({ title: "Feedback sent", description: "Thank you for your feedback!" });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85dvh] max-h-[85vh] sm:h-[90dvh] sm:max-h-[90vh] rounded-t-2xl border-0 p-0 z-[10000] flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-background border-b px-4 py-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleClose(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-bold">Send Feedback</h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pt-3 pb-3">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold">Thank you!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your feedback has been submitted anonymously. We appreciate you helping us improve.
              </p>
              <Button onClick={() => handleClose(false)} className="mt-3">
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Anonymous notice */}
              <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5">
                <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <span className="font-semibold">Anonymous.</span>{" "}
                  No identifying info stored unless you provide an email.
                </p>
              </div>

              {/* Category selector */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-xs font-medium ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback content */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Your Feedback <span className="text-muted-foreground font-normal">({content.length}/2000)</span>
                </label>
                <Textarea
                  placeholder="Tell us what's on your mind..."
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                  className="min-h-[100px] resize-none text-base"
                />
                {content.length > 0 && content.length < 10 && (
                  <p className="text-xs text-destructive mt-1">At least 10 characters required</p>
                )}
              </div>

              {/* Optional email */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Contact Email <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="text-base"
                />
              </div>
            </>
          )}
        </div>

        {/* Sticky Submit Footer */}
        {!submitted && (
          <div className="shrink-0 border-t bg-background px-4 py-2.5">
            <Button
              className="w-full h-11 text-sm font-semibold"
              onClick={handleSubmit}
              disabled={submitting || content.trim().length < 10}
            >
              {submitting ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
