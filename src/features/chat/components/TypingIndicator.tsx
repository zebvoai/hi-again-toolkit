export const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[75%] rounded-2xl px-5 py-4 shadow-sm bg-card text-card-foreground border border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-muted-foreground">Thinking...</span>
        </div>
      </div>
    </div>
  );
};
