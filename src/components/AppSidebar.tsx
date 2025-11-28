import { Plus, User } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className="p-3 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-10 hover:bg-accent"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Conversation history will go here */}
      </SidebarContent>

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
