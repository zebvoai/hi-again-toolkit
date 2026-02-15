import { useState } from 'react';
import { Pencil, Share, Edit, Archive, Trash2, Copy, Download, FileJson, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface ConversationItemProps {
  id: string;
  title: string;
  updatedAt: string;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onShare?: () => void;
  onRename?: () => void;
  onArchive?: () => void;
  onDuplicate?: () => void;
  onExportMarkdown?: () => void;
  onExportJSON?: () => void;
}

export const ConversationItem = ({
  title,
  updatedAt,
  isActive,
  onClick,
  onDelete,
  onShare,
  onRename,
  onArchive,
  onDuplicate,
  onExportMarkdown,
  onExportJSON,
}: ConversationItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const timeAgo = formatDistanceToNow(new Date(updatedAt), { addSuffix: true });

  return (
    <div
      className={cn(
        "group relative px-2 py-1.5 rounded-xl cursor-pointer overflow-hidden transition-all duration-fast ease-gentle",
        isActive 
          ? 'bg-white dark:bg-white/8 shadow-sm dark:shadow-md border border-transparent dark:border-border/10' 
          : 'hover:bg-muted/50 dark:hover:bg-white/[0.05]'
      )}
      onClick={onClick}
    >
      {/* Pencil menu - top right corner */}
      <div className="absolute top-1 right-1 z-10">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-5 w-5 rounded-md",
                isOpen ? 'bg-muted dark:bg-white/10' : 'hover:bg-muted/80 dark:hover:bg-white/10',
                "text-muted-foreground hover:text-foreground",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              )}
              onClick={(e) => e.stopPropagation()}
              aria-label="Edit options"
            >
              <Pencil className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={4}
            className={cn(
              "min-w-[160px] bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl",
              "border border-border/20 shadow-lg shadow-black/[0.08] dark:shadow-black/20",
              "z-[200] rounded-xl p-1",
              "animate-scale-in"
            )}
          >
            <DropdownMenuItem
              className={cn(
                "rounded-lg px-3 py-2 text-[13px] cursor-pointer",
                "hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                "focus:bg-black/[0.04] dark:focus:bg-white/[0.08]",
                "transition-colors duration-fast ease-gentle"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onRename?.();
              }}
            >
              <Edit className="w-4 h-4 mr-2.5 text-muted-foreground" />
              Rename
            </DropdownMenuItem>
            
            <DropdownMenuItem
              className="rounded-lg px-3 py-2 text-[13px] cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.08] focus:bg-black/[0.04] dark:focus:bg-white/[0.08] transition-colors duration-fast ease-gentle"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
              }}
            >
              <Copy className="w-4 h-4 mr-2.5 text-muted-foreground" />
              Duplicate
            </DropdownMenuItem>

            <DropdownMenuItem
              className="rounded-lg px-3 py-2 text-[13px] cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.08] focus:bg-black/[0.04] dark:focus:bg-white/[0.08] transition-colors duration-fast ease-gentle"
              onClick={(e) => {
                e.stopPropagation();
                onShare?.();
              }}
            >
              <Share className="w-4 h-4 mr-2.5 text-muted-foreground" />
              Share
            </DropdownMenuItem>

            {/* Export submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="rounded-lg px-3 py-2 text-[13px] cursor-pointer transition-colors duration-fast ease-gentle">
                <Download className="w-4 h-4 mr-2.5 text-muted-foreground" />
                Export
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-[140px] bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl border border-border/20 shadow-lg rounded-xl p-1 animate-scale-in">
                <DropdownMenuItem
                  className="rounded-lg px-3 py-2 text-[13px] cursor-pointer transition-colors duration-fast ease-gentle"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExportMarkdown?.();
                  }}
                >
                  <FileText className="w-4 h-4 mr-2.5 text-muted-foreground" />
                  Markdown
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg px-3 py-2 text-[13px] cursor-pointer transition-colors duration-fast ease-gentle"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExportJSON?.();
                  }}
                >
                  <FileJson className="w-4 h-4 mr-2.5 text-muted-foreground" />
                  JSON
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem
              className="rounded-lg px-3 py-2 text-[13px] cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.08] focus:bg-black/[0.04] dark:focus:bg-white/[0.08] transition-colors duration-fast ease-gentle"
              onClick={(e) => {
                e.stopPropagation();
                onArchive?.();
              }}
            >
              <Archive className="w-4 h-4 mr-2.5 text-muted-foreground" />
              Archive
            </DropdownMenuItem>

            <div className="h-px bg-border/30 my-1 mx-2" />
            
            <DropdownMenuItem
              className="rounded-lg px-3 py-2 text-[13px] cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition-colors duration-fast ease-gentle"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4 mr-2.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content area */}
      <div className="min-w-0 flex-1 pr-6">
        <p
          className={cn(
            "text-[12.5px] truncate leading-snug",
            isActive ? 'font-medium text-primary' : 'text-foreground/90 dark:text-foreground/80'
          )}
        >
          {title.length > 30 ? `${title.slice(0, 30)}…` : title}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {timeAgo}
        </p>
      </div>
    </div>
  );
};
