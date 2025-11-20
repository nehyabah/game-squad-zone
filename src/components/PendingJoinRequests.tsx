import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  UserPlus,
  Check,
  X,
  Loader2,
  Clock,
  Mail
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { squadsAPI, type SquadJoinRequest } from "@/lib/api/squads";
import { getDisplayName, getInitials } from "@/lib/utils/user";

interface PendingJoinRequestsProps {
  squadId: string;
  squadName: string;
}

export function PendingJoinRequests({ squadId, squadName }: PendingJoinRequestsProps) {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<SquadJoinRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Fetch pending join requests
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ["squadJoinRequests", squadId],
    queryFn: () => squadsAPI.getPendingJoinRequests(squadId),
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (requestId: string) =>
      squadsAPI.approveJoinRequest(squadId, requestId),
    onSuccess: () => {
      toast.success("Join request approved!");
      queryClient.invalidateQueries({ queryKey: ["squadJoinRequests", squadId] });
      queryClient.invalidateQueries({ queryKey: ["squad", squadId] });
      setSelectedRequest(null);
      setActionType(null);
      setProcessingRequestId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve request");
      setProcessingRequestId(null);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (requestId: string) =>
      squadsAPI.rejectJoinRequest(squadId, requestId),
    onSuccess: () => {
      toast.success("Join request rejected");
      queryClient.invalidateQueries({ queryKey: ["squadJoinRequests", squadId] });
      setSelectedRequest(null);
      setActionType(null);
      setProcessingRequestId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject request");
      setProcessingRequestId(null);
    },
  });

  const handleApprove = (request: SquadJoinRequest) => {
    setSelectedRequest(request);
    setActionType("approve");
  };

  const handleReject = (request: SquadJoinRequest) => {
    setSelectedRequest(request);
    setActionType("reject");
  };

  const confirmAction = () => {
    if (!selectedRequest) return;

    setProcessingRequestId(selectedRequest.id);

    if (actionType === "approve") {
      approveMutation.mutate(selectedRequest.id);
    } else if (actionType === "reject") {
      rejectMutation.mutate(selectedRequest.id);
    }
  };

  const formatRequestDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            Pending Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            Pending Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <UserPlus className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-medium mb-1">No pending requests</p>
            <p className="text-sm text-muted-foreground/70">
              New join requests will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 sm:pb-3 pt-3 sm:pt-4 px-3 sm:px-6 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-b">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            </div>
            <span className="flex-1 font-semibold">
              <span className="hidden sm:inline">Pending Join Requests</span>
              <span className="sm:hidden">Join Requests</span>
            </span>
            <Badge variant="secondary" className="px-2 sm:px-2.5 py-0.5 font-semibold text-xs">
              {requests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <div className="space-y-2 sm:space-y-3">
            {requests.map((request) => {
              const isProcessing = processingRequestId === request.id;

              return (
              <div
                key={request.id}
                className={`group relative flex items-start gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/20 hover:shadow-md hover:border-primary/30 transition-all duration-200 ${
                  isProcessing ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {/* Processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-lg sm:rounded-xl z-10">
                    <div className="flex items-center gap-2 bg-card px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-lg border">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary" />
                      <span className="text-xs sm:text-sm font-medium">Processing...</span>
                    </div>
                  </div>
                )}

                {/* Decorative gradient accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/60 via-primary/40 to-transparent rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <Avatar className="w-9 h-9 sm:w-12 sm:h-12 ring-1 sm:ring-2 ring-primary/10 ring-offset-1 sm:ring-offset-2 ring-offset-background flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-xs sm:text-base">
                    {getInitials(request.user)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <p className="font-semibold text-sm sm:text-base truncate text-foreground">
                      {getDisplayName(request.user)}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 bg-background/50 border-primary/20 px-1.5 sm:px-2"
                    >
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">{formatRequestDate(request.requestedAt)}</span>
                      <span className="sm:hidden">{formatRequestDate(request.requestedAt).replace(' ago', '')}</span>
                    </Badge>
                  </div>

                  {request.user.email && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mb-2 sm:mb-3 truncate">
                      <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                      <span className="truncate">{request.user.email}</span>
                    </p>
                  )}

                  {request.message && (
                    <div className="relative mt-2 sm:mt-3 mb-2 sm:mb-3">
                      <p className="text-xs sm:text-sm italic text-muted-foreground bg-muted/80 p-2 sm:p-3 rounded-md sm:rounded-lg border border-border/40 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                        <span className="text-primary/60 font-serif text-sm sm:text-lg">"</span>
                        {request.message}
                        <span className="text-primary/60 font-serif text-sm sm:text-lg">"</span>
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-4">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(request)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-sm hover:shadow-md transition-all h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Approve</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(request)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:shadow-sm transition-all h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Reject</span>
                    </Button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!selectedRequest && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setActionType(null);
          }
        }}
      >
        <DialogContent className="w-[90vw] max-w-[360px] sm:max-w-md p-4 sm:p-6">
          <DialogHeader className="space-y-2 sm:space-y-3">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full flex items-center justify-center ${
                actionType === "approve"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {actionType === "approve" ? (
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-500" />
              ) : (
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-500" />
              )}
            </div>
            <DialogTitle className="text-center text-base sm:text-xl">
              {actionType === "approve" ? (
                <>
                  <span className="hidden sm:inline">Approve Join Request</span>
                  <span className="sm:hidden">Approve Request</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Reject Join Request</span>
                  <span className="sm:hidden">Reject Request</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-center text-xs sm:text-sm leading-snug sm:leading-relaxed">
              {actionType === "approve" ? (
                <>
                  <span className="hidden sm:inline">
                    Are you sure you want to approve{" "}
                    <span className="font-semibold text-foreground">
                      {selectedRequest ? getDisplayName(selectedRequest.user) : "this user"}
                    </span>{" "}
                    to join{" "}
                    <span className="font-semibold text-foreground">"{squadName}"</span>?
                  </span>
                  <span className="sm:hidden">
                    Approve{" "}
                    <span className="font-semibold text-foreground">
                      {selectedRequest ? getDisplayName(selectedRequest.user) : "this user"}
                    </span>{" "}
                    to join{" "}
                    <span className="font-semibold text-foreground">"{squadName}"</span>?
                  </span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">
                    Are you sure you want to reject{" "}
                    <span className="font-semibold text-foreground">
                      {selectedRequest ? getDisplayName(selectedRequest.user) : "this user"}
                    </span>
                    's request to join{" "}
                    <span className="font-semibold text-foreground">"{squadName}"</span>?
                  </span>
                  <span className="sm:hidden">
                    Reject{" "}
                    <span className="font-semibold text-foreground">
                      {selectedRequest ? getDisplayName(selectedRequest.user) : "this user"}
                    </span>
                    's request to join{" "}
                    <span className="font-semibold text-foreground">"{squadName}"</span>?
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
              }}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="w-full sm:w-auto order-2 sm:order-1 h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className={`w-full sm:w-auto order-1 sm:order-2 h-9 text-sm ${
                actionType === "approve"
                  ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              }`}
            >
              {(approveMutation.isPending || rejectMutation.isPending) && (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
              )}
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
