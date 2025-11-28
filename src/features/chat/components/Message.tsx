import type { Message as MessageType } from '@/types';

interface MessageProps {
  message: MessageType;
}

export const Message = ({ message }: MessageProps) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div
        className={`
          max-w-[75%] rounded-2xl px-5 py-4 shadow-sm
          ${isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-card text-card-foreground border border-border'
          }
        `}
      >
        {message.metadata?.imageUrl ? (
          <div className="space-y-3">
            <img 
              src={message.metadata.imageUrl} 
              alt="Generated" 
              className="rounded-lg w-full max-w-md"
            />
            {message.content && (
              <p className="text-sm leading-relaxed">{message.content}</p>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        )}
        
        {message.metadata?.model && !isUser && (
          <p className="text-xs opacity-60 mt-3 pt-2 border-t border-border/50">
            {message.metadata.model}
          </p>
        )}
      </div>
    </div>
  );
};
