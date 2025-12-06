import { Plus, User, Search, Library, Folder, ChevronDown, ChevronRight, MoreVertical, Edit, MessageSquarePlus, Share, FileDown, Archive, Trash2, LogOut, Settings, UserCircle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // New project dialog
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  
  // Profile dropdown
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

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
  
  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject = {
      id: projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
      name: newProjectName.trim()
    };
    
    setProjects([...projects, newProject]);
    setNewProjectName("");
    setIsNewProjectDialogOpen(false);
  };
  
  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by date (using filtered list)
  const groupedConversations = filteredConversations.reduce(
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
    {} as Record<string, typeof filteredConversations>,
  );

  if (isCollapsed) {
    return (
      <Sidebar className="w-[60px] border-r border-border/50 glass-panel flex flex-col h-screen fixed" collapsible="icon">
        <div className="flex-none">
          <SidebarHeader className="p-4 flex flex-col items-center gap-4">
            <SidebarTrigger className="w-8 h-8 hover:bg-muted hover:text-foreground hover:scale-[1.08] active:scale-[0.92] transition-all duration-[220ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] rounded-full" />
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground apple-interactive"
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
            className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-[220ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          >
            <User className="w-5 h-5" />
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-[280px] border-r border-border/50 glass-panel flex flex-col h-screen fixed" collapsible="icon">
      <div className="flex-none">
        <SidebarHeader className="p-4 space-y-2">
          <div className="flex items-center mb-2">
            <SidebarTrigger className="w-6 h-6 hover:bg-muted hover:text-foreground hover:scale-[1.08] active:scale-[0.92] transition-all duration-[220ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] rounded-full" />
          </div>

          {/* New Chat */}
          <Button
            variant="ghost"
            className="w-full h-[44px] justify-start gap-3 px-3 bg-transparent hover:bg-primary/5 hover:border hover:border-border active:bg-primary/10 active:scale-[0.99] rounded-xl transition-all duration-[220ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] border border-transparent"
            onClick={handleNewChat}
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">New Chat</span>
          </Button>

          {/* Search Chats */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl bg-card/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-[220ms]"
            />
          </div>

          {/* Library */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted rounded-xl transition-all duration-[220ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
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
                  onClick={() => setIsNewProjectDialogOpen(true)}
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
                        <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50 rounded-[20px]">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectAction(project.id, "rename");
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Rename project
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Add new chat to project", project.id);
                            }}
                          >
                            <MessageSquarePlus className="w-4 h-4 mr-2" />
                            Add new chat to project
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Share project", project.id);
                            }}
                          >
                            <Share className="w-4 h-4 mr-2" />
                            Share project
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Export project", project.id);
                            }}
                          >
                            <FileDown className="w-4 h-4 mr-2" />
                            Export project
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectAction(project.id, "archive");
                            }}
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive project
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectAction(project.id, "delete");
                            }}
                            className="focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" style={{ color: '#D92D20' }} />
                            <span style={{ color: '#D92D20' }}>Delete project</span>
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
          ) : filteredConversations.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">No chats found</div>
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

      <SidebarFooter className="flex-none p-4 border-t border-border/50 mt-auto mb-5">
        <DropdownMenu open={isProfileDropdownOpen} onOpenChange={setIsProfileDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-all duration-[220ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] glass-panel-hover">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium flex-1 text-foreground">user@example.com</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-[220ms] ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-[18px] glass-panel border-border/50">
            <DropdownMenuItem>
              <UserCircle className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      
      {/* New Project Dialog */}
      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <Input
            type="text"
            placeholder="Enter project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateProject();
              }
            }}
            className="w-full"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
