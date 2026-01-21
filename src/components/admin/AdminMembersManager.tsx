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
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminUsersAPI.getAdmins();
      setAdmins(data);
    } catch (error) {
      console.error("Error loading admins:", error);
      toast({
        title: "Error",
        description: "Failed to load admin users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      loadAdmins();
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
      await adminUsersAPI.toggleAdmin(selectedUser.id, !selectedUser.isAdmin);
      toast({
        title: "Success",
        description: `Admin access removed from ${getDisplayName(selectedUser)}`,
      });
      loadAdmins();
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
        <h3 className="text-lg font-semibold mb-2">Admin Members</h3>
        <p className="text-sm text-muted-foreground">
          Manage who has access to the admin panel. Currently showing {admins.length} admin
          {admins.length !== 1 ? "s" : ""}.
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

      {/* Current Admins List */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Current Admins</h4>
        <div className="grid gap-4">
          {admins.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  No admin users found
                </p>
              </CardContent>
            </Card>
          ) : (
            admins.map((user) => (
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
                          <Badge className="bg-blue-600">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        </div>
                        <CardDescription>
                          {user.email} • @{user.username}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleToggleAdmin(user)}
                    >
                      <ShieldOff className="w-4 h-4 mr-2" />
                      Remove Admin
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
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access from{" "}
              <strong>{selectedUser ? getDisplayName(selectedUser) : ""}</strong>?
              They will no longer be able to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleAdmin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
