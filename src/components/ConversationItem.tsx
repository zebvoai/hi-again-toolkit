import { MoreVertical } from 'lucide-react';
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
  onStartGroupChat?: () => void;
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
  onStartGroupChat,
  onRename,
  onArchive,
}: ConversationItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(updatedAt), { addSuffix: true });

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all overflow-hidden ${
        isActive 
          ? 'bg-blue-50 border-l-4 border-blue-600 pl-2.5' 
          : 'hover:bg-accent/50 border-l-4 border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className={`text-sm truncate whitespace-nowrap overflow-hidden text-ellipsis ${isActive ? 'font-medium text-blue-600' : 'text-foreground'}`}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate whitespace-nowrap overflow-hidden text-ellipsis">
          {timeAgo}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-[22px] w-[22px] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms] rounded"
            onClick={(e) => e.stopPropagation()}
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px] bg-background border shadow-lg z-[200] rounded-lg">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onShare?.();
            }}
          >
            Share
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onStartGroupChat?.();
            }}
          >
            Start a group chat
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename?.();
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onArchive?.();
            }}
          >
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
