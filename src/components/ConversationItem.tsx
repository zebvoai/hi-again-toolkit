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
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ease-out overflow-hidden ${
        isActive 
          ? 'bg-white border-l-[3px] border-[#5B9FFF] pl-2.5 shadow-sm' 
          : 'hover:bg-[#F0F5FF] hover:border hover:border-[#E5E7EB] border-l-[3px] border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1">
          <p
            className={`text-sm flex-1 truncate whitespace-nowrap overflow-hidden text-ellipsis ${
              isActive ? 'font-medium text-blue-600' : 'text-foreground'
            }`}
          >
            {title}
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 flex-shrink-0 text-muted-foreground hover:bg-accent transition-all duration-150 rounded"
                onClick={(e) => e.stopPropagation()}
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[180px] bg-popover border shadow-lg z-[200] rounded-[20px]"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.();
                }}
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRename?.();
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive?.();
                }}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                className="focus:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" style={{ color: '#D92D20' }} />
                <span style={{ color: '#D92D20' }}>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 truncate whitespace-nowrap overflow-hidden text-ellipsis">
          {timeAgo}
        </p>
      </div>
    </div>
  );
};
