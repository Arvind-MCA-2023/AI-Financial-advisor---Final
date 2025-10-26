import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useApi, useAsyncAction } from "@/hooks/useApi";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { User, Mail, Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { User as UserType } from "@/types/api";

const UserProfile = () => {
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user data
  const { data: user, loading, refetch } = useApi<UserType>(() => 
    apiService.getCurrentUser().then(response => response as UserType)
  );

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    username: user?.username || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const { execute: updateProfile, loading: updatingProfile } = useAsyncAction(
    (data: typeof profileForm) => apiService.updateUserProfile(data)
  );

  const { execute: changePassword, loading: changingPassword } = useAsyncAction(
    (data: typeof passwordForm) => apiService.changePassword(data)
  );

  const { execute: deactivateAccount } = useAsyncAction(
    () => apiService.deactivateAccount()
  );

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await updateProfile(profileForm);

    if (result) {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
      setIsEditingProfile(false);
      refetch();
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    const result = await changePassword(passwordForm);

    if (result) {
      toast({
        title: "Password Changed",
        description: "Your password has been successfully changed",
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setIsChangingPassword(false);
    } else {
      toast({
        title: "Password Change Failed",
        description: "Failed to change password. Check your current password.",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateAccount = async () => {
    if (confirm("Are you sure you want to deactivate your account? This action will log you out.")) {
      const result = await deactivateAccount();
      if (result !== null) {
        toast({
          title: "Account Deactivated",
          description: "Your account has been deactivated",
        });
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        window.location.href = '/';
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="financial-card animate-pulse">
          <CardContent className="p-6">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Update form when user data loads
  if (user && !isEditingProfile) {
    if (profileForm.full_name !== user.full_name) {
      setProfileForm({
        full_name: user.full_name,
        email: user.email,
        username: user.username,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">User Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Profile Information */}
      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </div>
            {!isEditingProfile && (
              <Button onClick={() => setIsEditingProfile(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    className="pl-10"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="pl-10"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="johndoe"
                    className="pl-10"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button type="submit" disabled={updatingProfile}>
                  {updatingProfile ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditingProfile(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="text-lg font-medium">{user?.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Username</Label>
                  <p className="text-lg font-medium">{user?.username}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-lg font-medium">{user?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account Status</Label>
                  <p className="text-lg font-medium">
                    {user?.is_active ? (
                      <span className="text-success">Active</span>
                    ) : (
                      <span className="text-destructive">Inactive</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="pt-2 text-sm text-muted-foreground">
                Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'N/A'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password */}
      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </div>
            {!isChangingPassword && (
              <Button onClick={() => setIsChangingPassword(true)}>
                Change Password
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isChangingPassword ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    className="pl-10 pr-10"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password (min. 8 characters)"
                    className="pl-10 pr-10"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="pl-10 pr-10"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? "Changing..." : "Change Password"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-muted-foreground">
              Click "Change Password" to update your password. Make sure to use a strong password with at least 8 characters.
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="financial-card border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Deactivate Account</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Deactivating your account will log you out and prevent you from accessing your data. 
              You can reactivate your account by logging in again.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleDeactivateAccount}
            >
              Deactivate Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;