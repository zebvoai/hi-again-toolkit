import { useState } from 'react';
import { Pencil, Edit, Share, Copy, Download, FileText, FileJson, Archive, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatActionsMenuProps {
  onRename?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
  onExportMarkdown?: () => void;
  onExportJSON?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export function ChatActionsMenu({
  onRename,
  onShare,
  onDuplicate,
  onExportMarkdown,
  onExportJSON,
  onArchive,
  onDelete,
  disabled = false,
}: ChatActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (disabled) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-9 h-9 rounded-full",
            isOpen ? 'bg-accent' : 'hover:bg-accent/80',
            "text-muted-foreground hover:text-foreground",
            "hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]",
            "active:scale-[0.92] transition-all duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          )}
          aria-label="Chat options"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(
          "min-w-[160px] bg-popover/95 backdrop-blur-xl",
          "border border-border/30 shadow-lg shadow-black/[0.08] dark:shadow-black/20",
          "z-[200] rounded-xl p-1"
        )}
      >
        <DropdownMenuItem
          className="rounded-lg px-3 py-2 text-[13px] cursor-pointer"
          onClick={onRename}
        >
          <Edit className="w-4 h-4 mr-2.5 text-muted-foreground" />
          Rename
        </DropdownMenuItem>

        <DropdownMenuItem
          className="rounded-lg px-3 py-2 text-[13px] cursor-pointer"
          onClick={onDuplicate}
        >
          <Copy className="w-4 h-4 mr-2.5 text-muted-foreground" />
          Duplicate
        </DropdownMenuItem>

        <DropdownMenuItem
          className="rounded-lg px-3 py-2 text-[13px] cursor-pointer"
          onClick={onShare}
        >
          <Share className="w-4 h-4 mr-2.5 text-muted-foreground" />
          Share
        </DropdownMenuItem>

        {/* Export submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="rounded-lg px-3 py-2 text-[13px] cursor-pointer">
            <Download className="w-4 h-4 mr-2.5 text-muted-foreground" />
            Export
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-[140px] bg-popover/95 backdrop-blur-xl border border-border/30 shadow-lg rounded-xl p-1">
            <DropdownMenuItem
              className="rounded-lg px-3 py-2 text-[13px] cursor-pointer"
              onClick={onExportMarkdown}
            >
              <FileText className="w-4 h-4 mr-2.5 text-muted-foreground" />
              Markdown
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg px-3 py-2 text-[13px] cursor-pointer"
              onClick={onExportJSON}
            >
              <FileJson className="w-4 h-4 mr-2.5 text-muted-foreground" />
              JSON
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem
          className="rounded-lg px-3 py-2 text-[13px] cursor-pointer"
          onClick={onArchive}
        >
          <Archive className="w-4 h-4 mr-2.5 text-muted-foreground" />
          Archive
        </DropdownMenuItem>

        <div className="h-px bg-border/30 my-1 mx-2" />

        <DropdownMenuItem
          className="rounded-lg px-3 py-2 text-[13px] cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 mr-2.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
