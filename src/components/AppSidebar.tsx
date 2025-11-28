import { Plus, User, Calendar } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
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
    deleteConversation 
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
      <Sidebar className="w-14" collapsible="icon">
        <SidebarHeader className="p-3 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-10 hover:bg-accent"
            onClick={handleNewChat}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </SidebarHeader>

        <SidebarFooter className="p-3 border-t">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-10 hover:bg-accent"
          >
            <User className="w-5 h-5" />
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-64" collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <Button
          variant="ghost"
          className="w-full h-12 justify-start gap-3 hover:bg-blue-600 hover:text-white transition-colors"
          onClick={handleNewChat}
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-medium">New Chat</span>
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-3 overflow-y-auto">
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
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{label}</span>
                </div>
                <div className="space-y-1">
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

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium">user@example.com</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
