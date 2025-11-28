import { Plus, User, PanelLeft } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useConversations } from '@/features/chat/hooks/useConversations';
import { ConversationItem } from './ConversationItem';
import { isToday, isYesterday, format } from 'date-fns';

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { 
    clearMessages, 
    unlockModels, 
    setCurrentConversationId,
    currentConversationId,
    setMessages,
    lockModels
  } = useChatStore();
  const { 
    conversations, 
    isLoading, 
    loadConversation, 
    deleteConversation,
    refreshConversations
  } = useConversations();

  const handleNewChat = () => {
    clearMessages();
    unlockModels();
    setCurrentConversationId(null);
  };

  const handleLoadConversation = async (conversationId: string) => {
    const messages = await loadConversation(conversationId);
    setMessages(messages);
    setCurrentConversationId(conversationId);
    
    // Lock models if conversation has messages
    if (messages.length > 0) {
      lockModels();
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await deleteConversation(conversationId);
    if (currentConversationId === conversationId) {
      handleNewChat();
    }
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((acc, conv) => {
    const date = new Date(conv.updated_at);
    let label = '';
    
    if (isToday(date)) {
      label = 'TODAY';
    } else if (isYesterday(date)) {
      label = 'YESTERDAY';
    } else {
      label = format(date, 'MMMM d, yyyy').toUpperCase();
    }
    
    if (!acc[label]) {
      acc[label] = [];
    }
    acc[label].push(conv);
    return acc;
  }, {} as Record<string, typeof conversations>);

  if (isCollapsed) {
    return (
      <Sidebar className="w-[90px] border-r bg-background" collapsible="icon">
        <SidebarHeader className="p-4 flex flex-col items-center gap-4">
          <SidebarTrigger className="w-8 h-8" />
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleNewChat}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </SidebarHeader>

        <SidebarFooter className="p-4">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <User className="w-5 h-5" />
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-[280px] border-r bg-background" collapsible="icon">
      <SidebarHeader className="p-4 space-y-4">
        <div className="flex items-center">
          <SidebarTrigger className="w-6 h-6" />
        </div>
        
        <Button
          variant="ghost"
          className="w-full h-auto py-3 justify-start gap-3 hover:bg-accent rounded-lg"
          onClick={handleNewChat}
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-semibold">New Chat</span>
        </Button>
      </SidebarHeader>

      <ScrollArea className="flex-1">
        <SidebarContent className="px-3 pb-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedConversations).map(([label, convs]) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-muted-foreground uppercase">
                    <span>{label}</span>
                  </div>
                  <div className="space-y-0.5">
                    {convs.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        id={conv.id}
                        title={conv.title}
                        updatedAt={conv.updated_at}
                        isActive={currentConversationId === conv.id}
                        onClick={() => handleLoadConversation(conv.id)}
                        onDelete={() => handleDeleteConversation(conv.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SidebarContent>
      </ScrollArea>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium">user@example.com</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
