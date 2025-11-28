import type { Message as MessageType } from '@/types';

interface MessageProps {
  message: MessageType;
}

export const Message = ({ message }: MessageProps) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          max-w-[70%] rounded-2xl px-5 py-3
          ${isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-foreground'
          }
        `}
      >
        {message.metadata?.imageUrl ? (
          <div className="space-y-3">
            <img 
              src={message.metadata.imageUrl} 
              alt="Generated" 
              className="rounded-lg w-full"
            />
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        )}
        
        {message.metadata?.model && (
          <p className="text-xs opacity-70 mt-2">
            {message.metadata.model} • {message.metadata.provider}
          </p>
        )}
      </div>
    </div>
  );
};
