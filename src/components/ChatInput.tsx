import { useRef, useCallback, useEffect, memo, forwardRef, useImperativeHandle } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled: boolean;
  maxLength?: number;
}

export interface ChatInputHandle {
  focus: () => void;
}

export const ChatInput = memo(forwardRef<ChatInputHandle, ChatInputProps>(
  ({ value, onChange, onSubmit, placeholder, disabled, maxLength = 4000 }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    // Use a ref to track the latest value for the keydown handler
    // This avoids re-creating the handler on every keystroke
    const valueRef = useRef(value);
    valueRef.current = value;

    const onSubmitRef = useRef(onSubmit);
    onSubmitRef.current = onSubmit;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    }, [onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (valueRef.current.trim()) {
          onSubmitRef.current();
        }
      }
    }, []);

    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="w-full bg-transparent border-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 text-[15px] sm:text-[17px] font-medium placeholder:text-muted-foreground/70 disabled:opacity-50 text-foreground resize-none overflow-y-auto leading-[1.5] py-[6px] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
        style={{ height: '38px' }}
        maxLength={maxLength}
      />
    );
  }
));

ChatInput.displayName = 'ChatInput';
