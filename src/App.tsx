import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import SharedChat from "./pages/SharedChat";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth route */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Shared chat route - no sidebar, no auth required */}
          <Route path="/chat/:conversationId" element={<SharedChat />} />
          
          {/* Main app with sidebar - protected */}
          <Route path="*" element={
            <ProtectedRoute>
              <SidebarProvider defaultOpen={true}>
                <div className="flex min-h-screen w-full overflow-hidden">
                  <AppSidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Routes>
                      <Route path="/" element={<ChatInterface />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
