import { Plus, User, Search, Library, Folder, ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/features/chat/store/chatStore";
import { useConversations } from "@/features/chat/hooks/useConversations";
import { ConversationItem } from "./ConversationItem";
import { isToday, isYesterday, format } from "date-fns";

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { clearMessages, unlockModels, setCurrentConversationId, currentConversationId, setMessages, lockModels } =
    useChatStore();
  const { conversations, isLoading, loadConversation, deleteConversation, refreshConversations } = useConversations();

  // Projects state
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [projects, setProjects] = useState([
    { id: 1, name: "Queries" },
    { id: 2, name: "Zebvo" },
  ]);
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);

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

  const handleProjectAction = (projectId: number, action: "rename" | "duplicate" | "archive" | "delete") => {
    console.log(`Project ${projectId} - ${action}`);
    // TODO: Implement project actions
    if (action === "delete") {
      setProjects(projects.filter((p) => p.id !== projectId));
    }
  };

  const handleShare = async (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: conversation.title,
          text: `Check out this conversation: ${conversation.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleStartGroupChat = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    alert(`Starting group chat based on: ${conversation?.title}`);
    // TODO: Open group chat modal with this conversation preselected
  };

  const handleRename = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    const newTitle = prompt("Enter new conversation title:", conversation.title);
    if (newTitle && newTitle.trim() && newTitle !== conversation.title) {
      // TODO: Call API to rename conversation
      console.log(`Renaming conversation ${conversationId} to: ${newTitle}`);
      refreshConversations();
    }
  };

  const handleArchive = async (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    // TODO: Call API to archive conversation
    console.log(`Archiving conversation: ${conversationId}`);
    alert(`Archived: ${conversation.title}`);

    // If this was the current conversation, start a new chat
    if (currentConversationId === conversationId) {
      handleNewChat();
    }

    refreshConversations();
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce(
    (acc, conv) => {
      const date = new Date(conv.updated_at);
      let label = "";

      if (isToday(date)) {
        label = "TODAY";
      } else if (isYesterday(date)) {
        label = "YESTERDAY";
      } else {
        label = format(date, "MMMM d, yyyy").toUpperCase();
      }

      if (!acc[label]) {
        acc[label] = [];
      }
      acc[label].push(conv);
      return acc;
    },
    {} as Record<string, typeof conversations>,
  );

  if (isCollapsed) {
    return (
      <Sidebar className="w-[60px] border-r bg-background flex flex-col h-screen fixed" collapsible="icon">
        <div className="flex-none">
          <SidebarHeader className="p-4 flex flex-col items-center gap-4">
            <SidebarTrigger className="w-8 h-8 hover:bg-[#F3F4F6] hover:text-[#374151] hover:scale-[1.08] active:scale-[0.92] transition-all duration-150 ease-in-out rounded-full" />
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleNewChat}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </SidebarHeader>
        </div>

        <div className="flex-grow" />

        <SidebarFooter className="flex-none p-0 w-full max-w-[60px] flex items-center justify-center mb-5 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150"
          >
            <User className="w-5 h-5" />
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-[280px] border-r bg-background flex flex-col h-screen fixed" collapsible="icon">
      <div className="flex-none">
        <SidebarHeader className="p-4 space-y-2">
          <div className="flex items-center mb-2">
            <SidebarTrigger className="w-6 h-6 hover:bg-[#F3F4F6] hover:text-[#374151] hover:scale-[1.08] active:scale-[0.92] transition-all duration-150 ease-in-out rounded-full" />
          </div>

          {/* New Chat */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-accent rounded-lg hover:scale-[1.06] hover:shadow-[0_6px_20px_rgba(91,159,255,0.45)] active:scale-[0.94] transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            onClick={handleNewChat}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium">New Chat</span>
          </Button>

          {/* Search Chats */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-accent rounded-lg transition-colors"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Search chats</span>
          </Button>

          {/* Library */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-accent rounded-lg transition-colors"
          >
            <Library className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Library</span>
          </Button>
        </SidebarHeader>
      </div>

      <ScrollArea className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <SidebarContent className="px-3 pb-4 space-y-6 pr-[6px]">
          {/* Projects Section */}
          <div className="space-y-2">
            {/* Projects Header */}
            <button
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-accent rounded-lg transition-colors"
            >
              {isProjectsOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              <span>Projects</span>
            </button>

            {/* Projects Content */}
            {isProjectsOpen && (
              <div className="space-y-1">
                {/* New Project */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 py-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">New project</span>
                </Button>

                {/* Project List */}
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group relative flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-lg transition-colors cursor-pointer overflow-hidden"
                    onMouseEnter={() => setHoveredProject(project.id)}
                    onMouseLeave={() => setHoveredProject(null)}
                  >
                    <Folder className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                      {project.name}
                    </span>

                    {/* 3-dot menu (visible on hover) */}
                    {hoveredProject === project.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 flex-shrink-0 opacity-100 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectAction(project.id, "rename");
                            }}
                          >
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectAction(project.id, "duplicate");
                            }}
                          >
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectAction(project.id, "archive");
                            }}
                          >
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectAction(project.id, "delete");
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat History */}
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-8">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">No conversations yet</div>
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
                        onShare={() => handleShare(conv.id)}
                        onStartGroupChat={() => handleStartGroupChat(conv.id)}
                        onRename={() => handleRename(conv.id)}
                        onArchive={() => handleArchive(conv.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SidebarContent>
      </ScrollArea>

      <SidebarFooter className="flex-none p-4 border-t mt-auto mb-5">
        <div className="group flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 bg-white shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium flex-1">user@example.com</span>
          <svg className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
