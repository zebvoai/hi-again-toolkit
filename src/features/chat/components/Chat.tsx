import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChat } from '../hooks/useChat';

export const Chat = () => {
  const { messages, sendMessage, isLoading } = useChat();
  
  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <div className="p-6">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};
