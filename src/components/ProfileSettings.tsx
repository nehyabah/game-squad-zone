import React, { useState, useEffect } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Save,
  Loader2,
  Edit2,
  Shield,
  Wallet,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api/auth";

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileSettings = ({ open, onOpenChange }: ProfileSettingsProps) => {
  const { user, logout } = useAuth();
  const { profile, loading, error, updateProfile } = useProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    avatarUrl: '',
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phoneNumber: profile.phoneNumber || '',
        avatarUrl: profile.avatarUrl || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    
    // Prepare update data - only include fields that have actually changed
    const updateData: any = {};
    
    // Include fields that have changed
    if (formData.displayName !== (profile?.displayName || '')) {
      updateData.displayName = formData.displayName || null;
    }
    if (formData.firstName !== (profile?.firstName || '')) {
      updateData.firstName = formData.firstName || null;
    }
    if (formData.lastName !== (profile?.lastName || '')) {
      updateData.lastName = formData.lastName || null;
    }
    if (formData.phoneNumber !== (profile?.phoneNumber || '')) {
      updateData.phoneNumber = formData.phoneNumber || null;
    }
    if (formData.avatarUrl !== (profile?.avatarUrl || '')) {
      updateData.avatarUrl = formData.avatarUrl || null;
    }
    
    
    // Only make request if there are actual changes
    if (Object.keys(updateData).length === 0) {
      toast({
        title: 'No Changes',
        description: 'No changes detected to save',
      });
      setIsSaving(false);
      setIsEditing(false);
      return;
    }
    
    const success = await updateProfile(updateData);
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phoneNumber: profile.phoneNumber || '',
        avatarUrl: profile.avatarUrl || '',
      });
    }
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast({
        title: "Invalid confirmation",
        description: 'Please type "DELETE" to confirm',
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      await authAPI.deleteAccount();
      
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });

      // Close all modals
      setShowDeleteDialog(false);
      onOpenChange(false);
      
      // Logout user
      logout();
      
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl border-0 p-0 bg-background z-[120]">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (error) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl border-0 p-0 bg-background z-[120]">
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <p className="text-red-500 mb-2">Error loading profile</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!profile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl border-0 p-0 bg-background z-[120]">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground">No profile data available</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const getDisplayName = () => {
    if (profile.displayName) return profile.displayName;
    if (profile.firstName || profile.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return profile.username;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl border-0 p-0 bg-background flex flex-col z-[120]">
        <SheetHeader className="px-4 py-3 pb-2 flex-shrink-0">
          <SheetTitle className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">Profile Settings</h2>
              <p className="text-xs text-muted-foreground font-normal">
                Manage your personal information
              </p>
            </div>
            {isEditing && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="h-8 px-3"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">
          {/* Profile Header - More Compact */}
          <Card className="bg-gradient-to-r from-primary/8 to-primary/4 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-12 h-12 border-2 border-white/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-lg font-bold">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{getDisplayName()}</h3>
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                </div>
                <Button
                  variant={isEditing ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                  disabled={isSaving}
                  className="h-8 px-2"
                >
                  {isEditing ? "Cancel" : <Edit2 className="w-4 h-4" />}
                </Button>
              </div>

              {/* Compact Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background/60 rounded-lg p-2 text-center">
                  <div className="text-sm font-semibold">€{profile.walletBalance.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Balance</div>
                </div>
                <div className="bg-background/60 rounded-lg p-2 text-center">
                  <div className="text-sm font-semibold text-green-600">Verified</div>
                  <div className="text-xs text-muted-foreground">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader className="pb-2 px-4 py-3">
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {/* Display Name */}
              <div className="space-y-1">
                <label htmlFor="displayName" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Display Name
                </label>
                {isEditing ? (
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="How you'd like to be called"
                    maxLength={50}
                    className="h-9 text-sm"
                  />
                ) : (
                  <div className="h-9 px-3 py-2 bg-muted rounded-md flex items-center text-sm">
                    {profile.displayName || <span className="text-muted-foreground">Not set</span>}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  How others see your name
                </p>
              </div>

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="First name"
                      className="h-9 text-sm"
                    />
                  ) : (
                    <div className="h-9 px-3 py-2 bg-muted rounded-md flex items-center text-sm">
                      {profile.firstName || <span className="text-muted-foreground">Not set</span>}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Last name"
                      className="h-9 text-sm"
                    />
                  ) : (
                    <div className="h-9 px-3 py-2 bg-muted rounded-md flex items-center text-sm">
                      {profile.lastName || <span className="text-muted-foreground">Not set</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label htmlFor="phoneNumber" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  Phone Number
                </label>
                {isEditing ? (
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="h-9 text-sm"
                  />
                ) : (
                  <div className="h-9 px-3 py-2 bg-muted rounded-md flex items-center text-sm">
                    {profile.phoneNumber || <span className="text-muted-foreground">Not set</span>}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  For security & notifications
                </p>
              </div>

              {/* Avatar URL - Simplified */}
              <div className="space-y-1">
                <label htmlFor="avatarUrl" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Avatar URL
                </label>
                {isEditing ? (
                  <Input
                    id="avatarUrl"
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="h-9 text-sm"
                  />
                ) : (
                  <div className="h-9 px-3 py-2 bg-muted rounded-md flex items-center text-sm">
                    {profile.avatarUrl ? (
                      <span className="text-primary truncate">
                        {profile.avatarUrl.length > 40 ? profile.avatarUrl.substring(0, 40) + '...' : profile.avatarUrl}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </div>
                )}
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Email Address
                </label>
                <div className="h-9 px-3 py-2 bg-muted/50 rounded-md flex items-center justify-between text-sm border border-dashed">
                  <span className="truncate">{profile.email}</span>
                  <span className="text-xs text-green-600">✓</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cannot be changed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Information - Compact */}
          <Card>
            <CardHeader className="pb-2 px-4 py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">Username</p>
                </div>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-xs">
                  @{profile.username}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>

              {profile.lastLoginAt && (
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Last Active</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(profile.lastLoginAt), { addSuffix: true })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/50">
            <CardHeader className="pb-3 px-4 py-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="p-3 border border-red-200 dark:border-red-800 rounded-lg bg-background/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                      Delete Account
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex-shrink-0 h-8 px-3 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md z-[130]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-left space-y-2">
                <p>
                  This will permanently delete your account and all associated data, including:
                </p>
                <ul className="text-xs list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Your profile and personal information</li>
                  <li>All squad memberships</li>
                  <li>Your pick history</li>
                  <li>Wallet balance and transactions</li>
                  <li>Chat messages and activity</li>
                </ul>
                <p className="font-semibold text-red-600 dark:text-red-400 mt-3">
                  This action cannot be undone.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="delete-confirmation" className="text-sm font-medium block mb-2">
                Type <span className="font-mono bg-muted px-1 rounded">DELETE</span> to confirm:
              </label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE here"
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation("");
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmation !== "DELETE"}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};

export default ProfileSettings;