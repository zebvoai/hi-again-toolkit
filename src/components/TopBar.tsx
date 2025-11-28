import { Settings, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const tabs = ['Text'];

export function TopBar() {
  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      {/* Left: Tabs */}
      <div className="flex items-center gap-4 ml-2">
        
        <nav className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`text-sm font-medium transition-colors relative pb-1 ${
                tab === 'Text'
                  ? 'text-blue-600'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {tab === 'Text' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-foreground font-medium">Text</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">Chat</span>
        </div>
        
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Settings className="w-4 h-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Maximize2 className="w-4 h-4" />
        </Button>
        
        <Avatar className="w-8 h-8 bg-blue-600">
          <AvatarFallback className="bg-blue-600 text-white text-xs">
            KR
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
