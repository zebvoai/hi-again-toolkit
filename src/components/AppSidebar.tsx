import { Plus, User, Search, Library, Folder, ChevronDown, ChevronRight, MoreVertical, Edit, Share, Trash2, LogOut, Settings, UserCircle, Sparkles } from "lucide-react";
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
import { useProjects } from "@/features/projects/hooks/useProjects";
import { ConversationItem } from "./ConversationItem";
import { RenameDialog } from "./RenameDialog";
import { isToday, isYesterday, format } from "date-fns";
import { exportAsMarkdown, exportAsJSON } from "@/lib/exportConversation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Message } from "@/types";

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  // On mobile, always show expanded content in the Sheet drawer
  const isCollapsed = !isMobile && state === "collapsed";
  const { clearMessages, setCurrentConversationId, currentConversationId, setMessages, selectedProjectId, setSelectedProjectId } =
    useChatStore();
  const { conversations, isLoading, loadConversation, deleteConversation, renameConversation, shareConversation, refreshConversations } = useConversations();
  const { projects, isLoading: projectsLoading, createProject, renameProject, deleteProject, duplicateProject } = useProjects();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  // Projects state
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [projectToRename, setProjectToRename] = useState<{ id: string; name: string } | null>(null);
  const [isProjectRenameDialogOpen, setIsProjectRenameDialogOpen] = useState(false);
  
  
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

  const handleNewChat = (projectId?: string | null) => {
    clearMessages();
    setCurrentConversationId(null);
    setSelectedProjectId(projectId || null);
    // Auto-close sidebar on mobile
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleProjectClick = (projectId: string) => {
    toggleProjectExpanded(projectId);
    setSelectedProjectId(projectId);
  };

  // Get conversations for a specific project
  const getProjectConversations = (projectId: string) => {
    return conversations.filter(conv => conv.project_id === projectId);
  };

  // Get standalone conversations (not in any project)
  const standaloneConversations = conversations.filter(conv => !conv.project_id);

  const handleLoadConversation = async (conversationId: string) => {
    const messages = await loadConversation(conversationId);
    setMessages(messages);
    setCurrentConversationId(conversationId);
    // Auto-close sidebar on mobile after selecting conversation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await deleteConversation(conversationId);
    if (currentConversationId === conversationId) {
      handleNewChat();
    }
  };

  const handleProjectAction = async (projectId: string, action: "rename" | "duplicate" | "archive" | "delete") => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    
    if (action === "delete") {
      await deleteProject(projectId);
    } else if (action === "duplicate") {
      await duplicateProject(projectId);
    } else if (action === "archive") {
      toast({ title: 'Archived', description: `Project "${project.name}" archived` });
    } else if (action === "rename") {
      setProjectToRename({ id: projectId, name: project.name });
      setIsProjectRenameDialogOpen(true);
    }
  };

  const handleProjectRenameSubmit = async (newName: string) => {
    if (projectToRename) {
      await renameProject(projectToRename.id, newName);
      setProjectToRename(null);
      setIsProjectRenameDialogOpen(false);
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

  const handleExportMarkdown = async (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;
    
    const messages = await loadConversation(conversationId);
    exportAsMarkdown(messages, conversation.title);
    toast({ title: 'Exported!', description: 'Conversation exported as Markdown' });
  };

  const handleExportJSON = async (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;
    
    const messages = await loadConversation(conversationId);
    exportAsJSON(messages, conversation.title);
    toast({ title: 'Exported!', description: 'Conversation exported as JSON' });
  };
  
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    await createProject(newProjectName.trim());
    setNewProjectName("");
    setIsNewProjectDialogOpen(false);
  };
  
  // Filter standalone conversations by search query
  const filteredConversations = standaloneConversations.filter(conv => 
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

  return (
    <Sidebar 
      className={`hidden md:flex border-r border-border/20 canvas-glass flex-col h-screen transition-all duration-300 ease-out ${
        isCollapsed ? 'w-[60px]' : 'w-[280px]'
      }`} 
      collapsible="icon"
    >
      <div className="flex-none overflow-hidden">
        <SidebarHeader className={`pt-3 pb-2 transition-all duration-300 ease-out ${
          isCollapsed ? 'px-3 flex flex-col items-center gap-2' : 'px-3 space-y-2.5'
        }`}>
          {/* Logo, Brand, and Toggle in same row when expanded */}
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between w-full'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              {!isCollapsed && (
                <span className="text-base font-semibold text-foreground tracking-tight">Zebvo Assist</span>
              )}
            </div>
            {/* Sidebar Toggle */}
            <SidebarTrigger className="w-8 h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 hover:bg-black/5 dark:hover:bg-white/10 text-[#8E8E93] hover:text-foreground rounded-full flex-shrink-0" />
          </div>

          {/* Collapsed: Icon-only New Chat button */}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              onClick={() => handleNewChat()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}

          {/* Expanded: Full New Chat button and other controls */}
          {!isCollapsed && (
            <>
              {/* New Chat */}
              <Button
                variant="ghost"
                className="w-full h-10 justify-start gap-2.5 px-2.5 bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-xl border border-border/20 shadow-sm hover:shadow-md overflow-hidden whitespace-nowrap"
                onClick={() => handleNewChat()}
              >
                <div className="w-7 h-7 rounded-full bg-[#007AFF] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Plus className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[13px] font-medium text-foreground truncate">New Chat</span>
              </Button>

              {/* Search Chats */}
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] pointer-events-none z-10" />
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 h-9 text-[13px] rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border-0 placeholder:text-[#8E8E93] focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-[#007AFF]/30"
                />
              </div>

              {/* Library */}
              <Button
                variant="ghost"
                className="w-full justify-between gap-2.5 px-2.5 h-9 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-xl overflow-hidden whitespace-nowrap cursor-default opacity-60"
                disabled
              >
                <div className="flex items-center gap-2.5">
                  <Library className="w-4 h-4 text-[#8E8E93] flex-shrink-0" />
                  <span className="text-[13px] text-foreground/80 truncate">Library</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">Soon</span>
              </Button>
            </>
          )}
        </SidebarHeader>
      </div>

      {/* Collapsed: Spacer to push footer down */}
      {isCollapsed && <div className="flex-grow" />}

      {/* Expanded: Scrollable content area */}
      {!isCollapsed && (
        <ScrollArea className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3">
          <SidebarContent className="pb-4 space-y-3">
            {/* Projects Section */}
            <div className="space-y-0.5">
              {/* Projects Header */}
              <button
                onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] hover:text-foreground rounded-lg transition-colors"
              >
                {isProjectsOpen ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span>Projects</span>
              </button>

              {/* Projects Content */}
              {isProjectsOpen && (
                <div className="space-y-0.5 pl-0.5">
                  {/* New Project */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2.5 px-2.5 h-9 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-xl"
                    onClick={() => setIsNewProjectDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 text-[#8E8E93]" />
                    <span className="text-[13px] text-foreground/70">New project</span>
                  </Button>

                  {/* Project List */}
                  {projects.map((project) => {
                    const projectChats = getProjectConversations(project.id);
                    const isExpanded = expandedProjects.has(project.id);
                    
                    return (
                      <div key={project.id} className="space-y-0.5">
                        <div
                          onClick={() => handleProjectClick(project.id)}
                          className={`group relative flex items-center gap-2 px-2.5 h-9 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-xl cursor-pointer overflow-hidden ${
                            selectedProjectId === project.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-[#8E8E93] flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-[#8E8E93] flex-shrink-0" />
                          )}
                          <Folder className={`w-4 h-4 flex-shrink-0 ${selectedProjectId === project.id ? 'text-primary' : 'text-[#8E8E93]'}`} />
                          <span className={`text-[13px] flex-1 truncate whitespace-nowrap overflow-hidden text-ellipsis ${selectedProjectId === project.id ? 'text-foreground font-medium' : 'text-foreground/80'}`}>
                            {project.name}
                          </span>
                          {projectChats.length > 0 && (
                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full mr-1">
                              {projectChats.length}
                            </span>
                          )}

                          {/* 3-dot menu - visible on hover */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-black/[0.06] dark:hover:bg-white/10 rounded-lg"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-3.5 h-3.5 text-[#8E8E93]" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={4} className="w-44 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-lg z-50 rounded-xl p-1">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProjectAction(project.id, "rename");
                                }}
                                className="gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer"
                              >
                                <Edit className="w-4 h-4 text-[#8E8E93]" />
                                <span className="text-[13px]">Rename</span>
                              </DropdownMenuItem>
                              <div className="h-px bg-border/30 my-1 mx-2" />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProjectAction(project.id, "delete");
                                }}
                                className="gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-[13px]">Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Project Chats - shown when expanded */}
                        {isExpanded && (
                          <div className="pl-6 space-y-0.5">
                            {/* New Chat under project */}
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-2 px-2.5 h-8 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-lg text-[12px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNewChat(project.id);
                              }}
                            >
                              <Plus className="w-3.5 h-3.5 text-[#8E8E93]" />
                              <span className="text-foreground/70">New chat</span>
                            </Button>
                            
                            {projectChats.length === 0 ? (
                              <div className="text-[11px] text-[#8E8E93] px-2.5 py-2">
                                No chats yet
                              </div>
                            ) : (
                              projectChats.map((conv) => (
                                <ConversationItem
                                  key={conv.id}
                                  id={conv.id}
                                  title={conv.title}
                                  updatedAt={conv.updated_at}
                                  isActive={currentConversationId === conv.id}
                                  onClick={() => handleLoadConversation(conv.id)}
                                  onRename={() => handleRename(conv.id)}
                                  onShare={() => handleShare(conv.id)}
                                  onExportMarkdown={() => handleExportMarkdown(conv.id)}
                                  onExportJSON={() => handleExportJSON(conv.id)}
                                  onArchive={() => handleArchive(conv.id)}
                                  onDelete={() => handleDeleteConversation(conv.id)}
                                />
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Standalone Chat History (chats not in any project) */}
            {isLoading ? (
              <div className="text-[13px] text-[#8E8E93] text-center py-6">Loading...</div>
            ) : standaloneConversations.length === 0 ? (
              <div className="text-[13px] text-[#8E8E93] text-center py-6">No standalone chats</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-[13px] text-[#8E8E93] text-center py-6">No chats found</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedConversations).map(([label, convs]) => (
                  <div key={label} className="space-y-0.5">
                    <div className="flex items-center gap-2 px-2.5 py-1 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                      <span>{label}</span>
                    </div>
                    <div className="space-y-0.5 pl-0.5">
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
                          onExportMarkdown={() => handleExportMarkdown(conv.id)}
                          onExportJSON={() => handleExportJSON(conv.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SidebarContent>
        </ScrollArea>
      )}

      {/* Footer - adapts to collapsed/expanded state */}
      <SidebarFooter className={`flex-none border-t border-border/20 mt-auto mb-4 transition-all duration-300 ease-out ${
        isCollapsed ? 'p-3 flex items-center justify-center' : 'px-2 py-3'
      }`}>
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-full bg-[#007AFF] hover:bg-[#0066DD] text-white shadow-sm"
          >
            <User className="w-4 h-4" />
          </Button>
        ) : (
          <DropdownMenu open={isProfileDropdownOpen} onOpenChange={setIsProfileDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] cursor-pointer transition-all duration-200 mx-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-[13px] font-medium flex-1 text-foreground truncate">{user?.email || 'User'}</span>
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
              <DropdownMenuItem 
                className="rounded-xl px-3 py-2.5 text-[13px] text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2.5" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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

      {/* Rename Conversation Dialog */}
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentTitle={conversationToRename?.title || ''}
        onRename={handleRenameSubmit}
      />

      {/* Rename Project Dialog */}
      <RenameDialog
        open={isProjectRenameDialogOpen}
        onOpenChange={setIsProjectRenameDialogOpen}
        currentTitle={projectToRename?.name || ''}
        onRename={handleProjectRenameSubmit}
      />
    </Sidebar>
  );
}
