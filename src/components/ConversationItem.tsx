import { useState } from 'react';
import { MoreVertical, Share, Edit, Archive, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
}: ConversationItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(updatedAt), { addSuffix: true });

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-white dark:bg-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.08)]' 
          : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.08] active:scale-[0.98]'
      }`}
      onClick={onClick}
    >
      {/* Content area with fixed width to prevent layout shift */}
      <div className="flex-1 min-w-0 pr-7">
        <p
          className={`text-[13px] truncate ${
            isActive ? 'font-medium text-primary' : 'text-foreground/80'
          }`}
        >
          {title}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {timeAgo}
        </p>
      </div>

      {/* Three-dots menu - absolutely positioned to prevent layout shift */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-lg transition-all duration-200 ease-out
                ${isOpen 
                  ? 'opacity-100 bg-black/[0.06] dark:bg-white/10' 
                  : 'opacity-0 group-hover:opacity-100'
                }
                hover:bg-black/[0.08] dark:hover:bg-white/[0.12]
                text-muted-foreground hover:text-foreground
                focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20
              `}
              onClick={(e) => e.stopPropagation()}
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={4}
            className="min-w-[160px] bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl 
              border border-border/20 shadow-lg shadow-black/[0.08] dark:shadow-black/20
              z-[200] rounded-xl p-1
              animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out 
              data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
              data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          >
            <DropdownMenuItem
              className="rounded-lg px-3 py-2 text-[13px] cursor-pointer
                hover:bg-black/[0.04] dark:hover:bg-white/[0.08] 
                focus:bg-black/[0.04] dark:focus:bg-white/[0.08]
                transition-colors duration-150"
              onClick={(e) => {
                e.stopPropagation();
                onRename?.();
              }}
            >
              <Edit className="w-4 h-4 mr-2.5 text-muted-foreground" />
              Rename
            </DropdownMenuItem>
            
            <DropdownMenuItem
              className="rounded-lg px-3 py-2 text-[13px] cursor-pointer
                hover:bg-black/[0.04] dark:hover:bg-white/[0.08] 
                focus:bg-black/[0.04] dark:focus:bg-white/[0.08]
                transition-colors duration-150"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
              }}
            >
              <Copy className="w-4 h-4 mr-2.5 text-muted-foreground" />
              Duplicate
            </DropdownMenuItem>

            <DropdownMenuItem
              className="rounded-lg px-3 py-2 text-[13px] cursor-pointer
                hover:bg-black/[0.04] dark:hover:bg-white/[0.08] 
                focus:bg-black/[0.04] dark:focus:bg-white/[0.08]
                transition-colors duration-150"
              onClick={(e) => {
                e.stopPropagation();
                onShare?.();
              }}
            >
              <Share className="w-4 h-4 mr-2.5 text-muted-foreground" />
              Share
            </DropdownMenuItem>

            <DropdownMenuItem
              className="rounded-lg px-3 py-2 text-[13px] cursor-pointer
                hover:bg-black/[0.04] dark:hover:bg-white/[0.08] 
                focus:bg-black/[0.04] dark:focus:bg-white/[0.08]
                transition-colors duration-150"
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
              className="rounded-lg px-3 py-2 text-[13px] cursor-pointer
                text-destructive hover:bg-destructive/10 
                focus:bg-destructive/10 focus:text-destructive
                transition-colors duration-150"
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
    </div>
  );
};
