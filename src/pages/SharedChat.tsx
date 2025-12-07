import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/features/chat/components/Message';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExternalLink, MessageSquare } from 'lucide-react';
import type { Message as MessageType } from '@/types';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export default function SharedChat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId) {
        setError('Invalid conversation link');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch conversation
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (convError || !convData) {
          setError('Conversation not found');
          setIsLoading(false);
          return;
        }

        setConversation(convData);

        // Fetch messages
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (msgError) {
          setError('Failed to load messages');
          setIsLoading(false);
          return;
        }

        const formattedMessages: MessageType[] = (msgData || []).map((msg) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content as string | Record<string, string>,
          timestamp: new Date(msg.created_at).getTime(),
          metadata: msg.metadata as MessageType['metadata'],
        }));

        setMessages(formattedMessages);
      } catch (err) {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
          <div className="space-y-4">
            <Skeleton className="h-20 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-2/3 ml-auto" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">{error}</h1>
          <p className="text-muted-foreground mb-6">
            This conversation may have been deleted or the link is invalid.
          </p>
          <Button asChild>
            <Link to="/">
              Go to Zebvo AI
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground truncate max-w-md">
              {conversation?.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Shared conversation • {messages.length} messages
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              Open in Zebvo AI
              <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto py-8">
        <div className="max-w-[800px] mx-auto px-6">
          {messages.map((message) => (
            <Message key={message.id} message={message} allMessages={messages} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-4">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            This is a read-only view of a shared conversation.{' '}
            <Link to="/" className="text-primary hover:underline">
              Start your own chat
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
