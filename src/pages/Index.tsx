import { ChatProvider } from '@/contexts/ChatContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ChatContainer } from '@/components/chat/ChatContainer';

const Index = () => {
  return (
    <SettingsProvider>
      <ChatProvider>
        <ChatContainer />
      </ChatProvider>
    </SettingsProvider>
  );
};

export default Index;
