import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatProvider } from '@/contexts/ChatContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ModeSelector } from '@/components/mode-selector/ModeSelector';
import { ModelSelector } from '@/components/model-selector/ModelSelector';
import { ApiKeyManager } from '@/components/settings/ApiKeyManager';
import { MessageSquare, Settings, LogOut } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function IndexContent() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SettingsProvider>
      <ChatProvider>
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h1 className="text-xl font-bold">Zebvo Assist</h1>
                </div>
                <ModeSelector />
                <ModelSelector />
              </div>
              
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle>Settings</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <ApiKeyManager />
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Button variant="outline" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          <main className="container py-6">
            <ChatContainer />
          </main>
        </div>
      </ChatProvider>
    </SettingsProvider>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <IndexContent />
    </AuthProvider>
  );
}
