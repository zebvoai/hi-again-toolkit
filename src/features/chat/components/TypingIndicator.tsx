export const TypingIndicator = ({ models }: { models?: string[] }) => {
  return (
    <div className="flex justify-start mb-4 appear-smooth">
      <div className="flex gap-2 max-w-[75%]">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center shadow-sm flex-shrink-0 transition-transform duration-normal ease-spring hover:scale-hover">
          <span className="text-blue-700 font-semibold text-sm">Z</span>
        </div>
        
        {/* Thinking bubble with Apple-style wave dots */}
        <div className="rounded-[18px_18px_18px_4px] px-5 py-3.5 bg-[#F0F0F0] shadow-sm transition-all duration-normal">
          <div className="flex items-center gap-[5px]">
            <span 
              className="w-[7px] h-[7px] rounded-full bg-gray-400 animate-thinking-dot"
              style={{ animationDelay: '0ms' }}
            />
            <span 
              className="w-[7px] h-[7px] rounded-full bg-gray-400 animate-thinking-dot"
              style={{ animationDelay: '160ms' }}
            />
            <span 
              className="w-[7px] h-[7px] rounded-full bg-gray-400 animate-thinking-dot"
              style={{ animationDelay: '320ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
