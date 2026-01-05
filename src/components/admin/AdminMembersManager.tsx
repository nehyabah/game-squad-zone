import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, ShieldOff, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminUsersAPI } from "@/lib/api/six-nations";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
}

export default function AdminMembersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUsersAPI.getAll();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminCount = users.filter((u) => u.isAdmin).length;

  const handleToggleAdmin = (user: User) => {
    setSelectedUser(user);
    setShowConfirmDialog(true);
  };

  const confirmToggleAdmin = async () => {
    if (!selectedUser) return;

    try {
      await adminUsersAPI.toggleAdmin(selectedUser.id, !selectedUser.isAdmin);
      toast({
        title: "Success",
        description: `Admin status updated for ${getDisplayName(selectedUser)}`,
      });
      loadUsers();
    } catch (error) {
      console.error("Error toggling admin status:", error);
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive",
      });
    } finally {
      setShowConfirmDialog(false);
      setSelectedUser(null);
    }
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Admin Members</h3>
        <p className="text-sm text-muted-foreground">
          Manage who has access to the admin panel. Currently {adminCount} admin
          {adminCount !== 1 ? "s" : ""}.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> Admin users have full access to manage rounds, matches,
          questions, and can modify other users' admin status. Only grant admin access to
          trusted members.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, email, or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No users found matching your search" : "No users found"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {getDisplayName(user)}
                        </CardTitle>
                        {user.isAdmin && (
                          <Badge className="bg-blue-600">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {user.email} • @{user.username}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant={user.isAdmin ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleAdmin(user)}
                  >
                    {user.isAdmin ? (
                      <>
                        <ShieldOff className="w-4 h-4 mr-2" />
                        Remove Admin
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Make Admin
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.isAdmin ? "Remove Admin Access" : "Grant Admin Access"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.isAdmin ? (
                <>
                  Are you sure you want to remove admin access from{" "}
                  <strong>{selectedUser ? getDisplayName(selectedUser) : ""}</strong>?
                  They will no longer be able to access the admin panel.
                </>
              ) : (
                <>
                  Are you sure you want to grant admin access to{" "}
                  <strong>{selectedUser ? getDisplayName(selectedUser) : ""}</strong>?
                  They will have full access to manage the 6 Nations tournament and NFL settings.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleAdmin}>
              {selectedUser?.isAdmin ? "Remove Admin" : "Grant Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
