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
import { RenameDialog } from "./RenameDialog";
import { isToday, isYesterday, format } from "date-fns";

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { clearMessages, setCurrentConversationId, currentConversationId, setMessages } =
    useChatStore();
  const { conversations, isLoading, loadConversation, deleteConversation, renameConversation, shareConversation, refreshConversations } = useConversations();

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
  
  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState<{ id: string; title: string } | null>(null);
  
  // Profile dropdown
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleNewChat = () => {
    clearMessages();
    setCurrentConversationId(null);
  };

  const handleLoadConversation = async (conversationId: string) => {
    const messages = await loadConversation(conversationId);
    setMessages(messages);
    setCurrentConversationId(conversationId);
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
    await shareConversation(conversationId);
  };

  const handleRename = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;
    setConversationToRename({ id: conversationId, title: conversation.title });
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = async (newTitle: string) => {
    if (conversationToRename) {
      await renameConversation(conversationToRename.id, newTitle);
      setConversationToRename(null);
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
      <Sidebar className="w-[60px] border-r border-border/30 bg-[#F8F8FA] dark:bg-[#1C1C1E] flex flex-col h-screen fixed" collapsible="icon">
        <div className="flex-none">
          <SidebarHeader className="px-3 pt-3 pb-2 flex flex-col items-center gap-2">
            <SidebarTrigger className="w-8 h-8 hover:bg-black/5 dark:hover:bg-white/10 text-[#8E8E93] hover:text-foreground transition-all duration-200 rounded-full" />
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              onClick={handleNewChat}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </SidebarHeader>
        </div>

        <div className="flex-grow" />

        <SidebarFooter className="flex-none p-3 w-full max-w-[60px] flex items-center justify-center mb-4 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full bg-[#007AFF] hover:bg-[#0066DD] text-white shadow-sm transition-all duration-200"
          >
            <User className="w-4 h-4" />
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-[280px] border-r border-border/30 bg-[#F8F8FA] dark:bg-[#1C1C1E] flex flex-col h-screen fixed" collapsible="icon">
      <div className="flex-none">
        <SidebarHeader className="px-3 pt-3 pb-2 space-y-2">
          <SidebarTrigger className="w-8 h-8 hover:bg-black/5 dark:hover:bg-white/10 text-[#8E8E93] hover:text-foreground transition-all duration-200 rounded-full" />

          {/* New Chat */}
          <Button
            variant="ghost"
            className="w-full h-11 justify-start gap-3 px-3 bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 active:scale-[0.98] rounded-2xl transition-all duration-200 border border-border/20 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            onClick={handleNewChat}
          >
            <div className="w-7 h-7 rounded-full bg-[#007AFF] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Plus className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[13px] font-medium text-foreground">New Chat</span>
          </Button>

          {/* Search Chats */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] pointer-events-none" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 h-9 text-[13px] rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border-0 placeholder:text-[#8E8E93] focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-[#007AFF]/30 transition-all duration-200"
            />
          </div>

          {/* Library */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 h-10 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-xl transition-all duration-200"
          >
            <Library className="w-[18px] h-[18px] text-[#8E8E93]" />
            <span className="text-[13px] text-foreground/80">Library</span>
          </Button>
        </SidebarHeader>
      </div>

      <ScrollArea className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2">
        <SidebarContent className="px-1 pb-4 space-y-4">
          {/* Projects Section */}
          <div className="space-y-1">
            {/* Projects Header */}
            <button
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] hover:text-foreground rounded-lg transition-colors"
            >
              {isProjectsOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>Projects</span>
            </button>

            {/* Projects Content */}
            {isProjectsOpen && (
              <div className="space-y-0.5">
                {/* New Project */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2.5 px-3 h-9 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-xl transition-all duration-200"
                  onClick={() => setIsNewProjectDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 text-[#8E8E93]" />
                  <span className="text-[13px] text-foreground/70">New project</span>
                </Button>

                {/* Project List */}
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group relative flex items-center gap-2.5 px-3 h-9 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-xl transition-all duration-200 cursor-pointer overflow-hidden"
                    onMouseEnter={() => setHoveredProject(project.id)}
                    onMouseLeave={() => setHoveredProject(null)}
                  >
                    <Folder className="w-4 h-4 text-[#8E8E93] flex-shrink-0" />
                    <span className="text-[13px] flex-1 truncate whitespace-nowrap overflow-hidden text-ellipsis text-foreground/80">
                      {project.name}
                    </span>

                    {/* 3-dot menu (visible on hover) */}
                    {hoveredProject === project.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 flex-shrink-0 hover:bg-black/[0.06] dark:hover:bg-white/10 rounded-md transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-[#8E8E93]" />
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
            <div className="text-[13px] text-[#8E8E93] text-center py-8">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-[13px] text-[#8E8E93] text-center py-8">No conversations yet</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-[13px] text-[#8E8E93] text-center py-8">No chats found</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedConversations).map(([label, convs]) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
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

      <SidebarFooter className="flex-none p-3 border-t border-border/20 mt-auto mb-4">
        <DropdownMenu open={isProfileDropdownOpen} onOpenChange={setIsProfileDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] cursor-pointer transition-all duration-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center flex-shrink-0 shadow-sm">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-[13px] font-medium flex-1 text-foreground truncate">user@example.com</span>
              <ChevronDown className={`w-4 h-4 text-[#8E8E93] transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52 rounded-2xl bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl border-border/20 shadow-lg p-1.5">
            <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-[13px] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors">
              <UserCircle className="w-4 h-4 mr-2.5 text-[#8E8E93]" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-[13px] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors">
              <User className="w-4 h-4 mr-2.5 text-[#8E8E93]" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-[13px] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors">
              <Settings className="w-4 h-4 mr-2.5 text-[#8E8E93]" />
              Settings
            </DropdownMenuItem>
            <div className="h-px bg-border/20 my-1" />
            <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-[13px] text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors">
              <LogOut className="w-4 h-4 mr-2.5" />
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

      {/* Rename Dialog */}
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentTitle={conversationToRename?.title || ''}
        onRename={handleRenameSubmit}
      />
    </Sidebar>
  );
}
