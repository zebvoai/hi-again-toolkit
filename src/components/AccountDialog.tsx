import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { Separator } from '@/components/ui/separator';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountDialog({ open, onOpenChange }: AccountDialogProps) {
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with profile
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({ username: username.trim() || undefined });
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);
    await uploadAvatar(file);
    setIsUploading(false);

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Account Settings</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-border/50">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || 'User'} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-2xl font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground">Click to upload a photo</p>
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Display Name
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                This name will be displayed in your chats
              </p>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <div className="h-11 px-3 flex items-center rounded-xl bg-muted/50 text-sm text-muted-foreground">
                {profile?.email || 'No email'}
              </div>
            </div>

            {/* Admin Panel - Only visible to admin */}
            {isAdmin && (
              <>
                <Separator />
                <div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // TODO: Navigate to admin panel
                      console.log('Opening Admin Panel');
                    }}
                    className="w-full justify-start rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                    Manage users, settings, and platform configuration
                  </p>
                </div>
              </>
            )}

            {/* Logout */}
            <div className="pt-2 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 mr-2" />
                )}
                Log out
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isLoading}
            className="rounded-xl"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
