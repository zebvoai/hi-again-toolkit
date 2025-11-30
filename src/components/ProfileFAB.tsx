import { User } from 'lucide-react';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ProfileFAB() {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 400);
    // TODO: Open profile menu/modal
    console.log('Profile FAB clicked');
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={`
              fixed bottom-6 right-6 z-50
              w-12 h-12 rounded-full
              bg-[#5B9FFF] text-white
              flex items-center justify-center
              transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              shadow-[0_4px_12px_rgba(91,159,255,0.3)]
              hover:scale-[1.15] hover:shadow-[0_8px_20px_rgba(91,159,255,0.45)] hover:rotate-[5deg]
              animate-fab-entrance animate-fab-float
              ${isClicked ? 'animate-fab-click' : ''}
            `}
          >
            <User className="w-5 h-5" />
            
            {/* Ripple effect on click */}
            {isClicked && (
              <span className="absolute inset-0 rounded-full bg-white/30 animate-ripple" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white">
          <p>Profile</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
