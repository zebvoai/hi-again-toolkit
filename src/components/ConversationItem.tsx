import { MoreVertical, Share, Edit, Archive, Trash2 } from 'lucide-react';
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
}: ConversationItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(updatedAt), { addSuffix: true });

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer overflow-hidden transition-all duration-200 ${
        isActive 
          ? 'bg-white dark:bg-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.08)]' 
          : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.08] active:scale-[0.98]'
      }`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1">
          <p
            className={`text-[13px] flex-1 truncate whitespace-nowrap overflow-hidden text-ellipsis ${
              isActive ? 'font-medium text-[#007AFF]' : 'text-foreground/80'
            }`}
          >
            {title}
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 text-[#8E8E93] hover:bg-black/[0.06] dark:hover:bg-white/10 hover:text-foreground transition-all duration-150 rounded-md"
                onClick={(e) => e.stopPropagation()}
                aria-label="More options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[180px] bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl border-border/20 shadow-lg z-[200] rounded-2xl p-1.5"
            >
              <DropdownMenuItem
                className="rounded-xl px-3 py-2.5 text-[13px] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.();
                }}
              >
                <Share className="w-4 h-4 mr-2.5 text-[#8E8E93]" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-xl px-3 py-2.5 text-[13px] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onRename?.();
                }}
              >
                <Edit className="w-4 h-4 mr-2.5 text-[#8E8E93]" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-xl px-3 py-2.5 text-[13px] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive?.();
                }}
              >
                <Archive className="w-4 h-4 mr-2.5 text-[#8E8E93]" />
                Archive
              </DropdownMenuItem>
              <div className="h-px bg-border/20 my-1" />
              <DropdownMenuItem
                className="rounded-xl px-3 py-2.5 text-[13px] text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
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

        <p className="text-[11px] text-[#8E8E93] mt-0.5 truncate whitespace-nowrap overflow-hidden text-ellipsis">
          {timeAgo}
        </p>
      </div>
    </div>
  );
};
