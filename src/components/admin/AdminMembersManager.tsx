import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff, AlertTriangle } from "lucide-react";
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
  const [emailInput, setEmailInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [filterAdminsOnly, setFilterAdminsOnly] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUsersAPI.getAllUsers();
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

  const admins = users.filter(u => u.isAdmin);
  const filteredUsers = filterAdminsOnly ? admins : users;

  const handleAddAdmin = async () => {
    if (!emailInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAdding(true);
      await adminUsersAPI.addByEmail(emailInput.trim());
      toast({
        title: "Success",
        description: `Admin access granted to ${emailInput}`,
      });
      setEmailInput("");
      loadUsers();
    } catch (error: any) {
      console.error("Error adding admin:", error);
      const errorMessage = error.response?.data?.error || "Failed to add admin";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleAdmin = (user: User) => {
    setSelectedUser(user);
    setShowConfirmDialog(true);
  };

  const confirmToggleAdmin = async () => {
    if (!selectedUser) return;

    try {
      const newAdminStatus = !selectedUser.isAdmin;
      await adminUsersAPI.toggleAdmin(selectedUser.id, newAdminStatus);
      toast({
        title: "Success",
        description: newAdminStatus
          ? `Admin access granted to ${getDisplayName(selectedUser)}`
          : `Admin access removed from ${getDisplayName(selectedUser)}`,
      });
      loadUsers();
    } catch (error) {
      console.error("Error toggling admin status:", error);
      toast({
        title: "Error",
        description: "Failed to remove admin access",
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
        <h3 className="text-lg font-semibold mb-2">User Management</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Total users: {users.length} • Admins: {admins.length}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterAdminsOnly(!filterAdminsOnly)}
          >
            {filterAdminsOnly ? "Show All Users" : "Show Admins Only"}
          </Button>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> Admin users have full access to manage rounds, matches,
          questions, and can modify other users' admin status. Only grant admin access to
          trusted members.
        </AlertDescription>
      </Alert>

      {/* Add Admin by Email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Admin</CardTitle>
          <CardDescription>
            Enter the email address of the user you want to grant admin access to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddAdmin();
                }
              }}
              disabled={isAdding}
            />
            <Button onClick={handleAddAdmin} disabled={isAdding || !emailInput.trim()}>
              <Shield className="w-4 h-4 mr-2" />
              {isAdding ? "Adding..." : "Add Admin"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div>
        <h4 className="text-sm font-semibold mb-3">
          {filterAdminsOnly ? "Admins" : "All Users"} ({filteredUsers.length})
        </h4>
        <div className="grid gap-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  No admin users found
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
                        <AvatarFallback className={user.isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
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
                  They will be able to manage rounds, matches, questions, and other users.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleAdmin}
              className={selectedUser?.isAdmin ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {selectedUser?.isAdmin ? "Remove Admin" : "Grant Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
