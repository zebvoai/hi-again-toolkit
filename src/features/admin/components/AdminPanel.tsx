import { useState, useEffect } from 'react';
import { X, Bug, Lightbulb, ExternalLink, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Feedback {
  id: string;
  user_id: string;
  type: 'bug' | 'feature';
  description: string;
  image_urls: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bug' | 'feature'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback((data as Feedback[]) || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(prev => prev ? { ...prev, status: newStatus } : null);
      }
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteFeedback = async () => {
    if (!feedbackToDelete) return;

    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackToDelete.id);

      if (error) throw error;
      
      setFeedback(prev => prev.filter(f => f.id !== feedbackToDelete.id));
      if (selectedFeedback?.id === feedbackToDelete.id) {
        setSelectedFeedback(null);
      }
      toast.success('Feedback deleted');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    } finally {
      setFeedbackToDelete(null);
    }
  };

  const filteredFeedback = feedback.filter(f => {
    if (filter !== 'all' && f.type !== filter) return false;
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-3.5 h-3.5 text-primary" />;
      case 'in_progress':
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-primary" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'in_progress':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div>
          <h1 className="text-lg font-semibold">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">
            {feedback.length} feedback item{feedback.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full hover:bg-accent"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border/20">
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-32 h-8 text-xs rounded-lg">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="bug">Bugs</SelectItem>
            <SelectItem value="feature">Features</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-32 h-8 text-xs rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto border-r border-border/20">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">Loading...</div>
          ) : filteredFeedback.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No feedback found</div>
          ) : (
            <div className="divide-y divide-border/20">
              {filteredFeedback.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedFeedback(item)}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-accent/50 transition-colors",
                    selectedFeedback?.id === item.id && "bg-accent"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      item.type === 'bug' ? "bg-destructive/10" : "bg-primary/10"
                    )}>
                      {item.type === 'bug' ? (
                        <Bug className="w-4 h-4 text-destructive" />
                      ) : (
                        <Lightbulb className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getStatusColor(item.status))}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                        {item.image_urls.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {item.image_urls.length} image{item.image_urls.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(item.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedFeedback && (
          <div className="w-96 flex flex-col min-h-0 bg-card/50">
            <div className="p-4 border-b border-border/20">
              <div className="flex items-center gap-2 mb-2">
                {selectedFeedback.type === 'bug' ? (
                  <Bug className="w-5 h-5 text-destructive" />
                ) : (
                  <Lightbulb className="w-5 h-5 text-primary" />
                )}
                <span className="font-medium capitalize">{selectedFeedback.type} Report</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedFeedback.created_at), 'MMMM d, yyyy • h:mm a')}
              </p>
            </div>

            <ScrollArea className="flex-1 min-h-0 p-4">
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <Select
                    value={selectedFeedback.status}
                    onValueChange={(v) => updateStatus(selectedFeedback.id, v)}
                  >
                    <SelectTrigger className="w-full h-9 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <p className="text-sm leading-relaxed">{selectedFeedback.description}</p>
                </div>

                {/* Images */}
                {selectedFeedback.image_urls.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Screenshots</label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedFeedback.image_urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group block rounded-lg overflow-hidden border border-border"
                        >
                          <img
                            src={url}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* User ID */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">User ID</label>
                  <p className="text-xs font-mono bg-muted/50 px-2 py-1 rounded">
                    {selectedFeedback.user_id}
                  </p>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-4 border-t border-border/20">
              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2 rounded-xl"
                onClick={() => setFeedbackToDelete(selectedFeedback)}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!feedbackToDelete} onOpenChange={() => setFeedbackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this feedback item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteFeedback}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
