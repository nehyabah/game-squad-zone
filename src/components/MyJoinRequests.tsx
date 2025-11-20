import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { squadsAPI, type SquadJoinRequest } from "@/lib/api/squads";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

export function MyJoinRequests() {
  const queryClient = useQueryClient();
  const previousRequestsRef = useRef<SquadJoinRequest[]>([]);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["myJoinRequests"],
    queryFn: () => squadsAPI.getMyJoinRequests(),
    refetchInterval: 10000, // Refetch every 10 seconds for faster detection
    refetchOnWindowFocus: true,
  });

  // Detect when a request gets approved
  useEffect(() => {
    if (!isLoading) {
      const previousRequests = previousRequestsRef.current;

      console.log('[MyJoinRequests] Checking for changes:', {
        previousCount: previousRequests.length,
        currentCount: requests.length,
        previousIds: previousRequests.map(r => r.id),
        currentIds: requests.map(r => r.id),
      });

      // Only check for changes if we have previous data
      if (previousRequests.length > 0) {
        // Check each previous request to see if it's no longer in the pending list
        previousRequests.forEach((prevRequest) => {
          const stillPending = requests.find(r => r.id === prevRequest.id);

          console.log('[MyJoinRequests] Checking request:', {
            id: prevRequest.id,
            squadName: prevRequest.squad?.name,
            stillPending: !!stillPending,
          });

          // If a request is no longer in the pending list, it was approved
          if (!stillPending) {
            console.log('[MyJoinRequests] Request approved! Showing toast for:', prevRequest.squad?.name);

            // Show success notification
            toast.success(
              `You've been admitted to "${prevRequest.squad?.name}"!`,
              {
                description: "You can now view your squad and start making picks.",
                duration: 5000,
              }
            );

            // Refresh the squads list so the user sees their new squad
            queryClient.invalidateQueries({ queryKey: ["squads"] });
            queryClient.invalidateQueries({ queryKey: ["mySquads"] });
          }
        });
      }

      // Update the ref for next comparison
      previousRequestsRef.current = requests;
    }
  }, [requests, isLoading, queryClient]);

  if (isLoading) {
    return null; // Don't show loading state, just hide
  }

  if (requests.length === 0) {
    return null; // Don't show anything if there are no pending requests
  }

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

  return (
    <Card className="shadow-hover border border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-background backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg font-display text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          Pending Join Requests
          <Badge variant="secondary" className="ml-auto text-xs">
            {requests.length}
          </Badge>
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Waiting for admin approval
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-3 rounded-lg border border-amber-200/50 bg-white/50 hover:bg-amber-50/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg flex items-center justify-center shadow-sm border border-amber-200/50 flex-shrink-0">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {request.squad?.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="outline"
                    className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {formatRequestDate(request.requestedAt)}
                  </Badge>
                </div>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex-shrink-0">
              Pending
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
