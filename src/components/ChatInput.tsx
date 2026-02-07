import { useState, useRef, useCallback, memo, forwardRef, useImperativeHandle } from 'react';

interface ChatInputProps {
  onSubmit: (value: string) => void;
  onContentChange?: (hasContent: boolean) => void;
  placeholder: string;
  disabled: boolean;
  maxLength?: number;
}

export interface ChatInputHandle {
  focus: () => void;
  getValue: () => string;
  clear: () => void;
  getLength: () => number;
}

export const ChatInput = memo(forwardRef<ChatInputHandle, ChatInputProps>(
  ({ onSubmit, onContentChange, placeholder, disabled, maxLength = 4000 }, ref) => {
    // Input state is fully internal — typing never re-renders the parent
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Stable refs for callbacks to avoid re-creating handlers
    const onSubmitRef = useRef(onSubmit);
    onSubmitRef.current = onSubmit;
    const onContentChangeRef = useRef(onContentChange);
    onContentChangeRef.current = onContentChange;

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      getValue: () => value,
      clear: () => {
        setValue('');
        onContentChangeRef.current?.(false);
      },
      getLength: () => value.length,
    }), [value]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      // Notify parent only about boolean hasContent — not the full string
      onContentChangeRef.current?.(newValue.trim().length > 0);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const textarea = e.currentTarget;
        const currentValue = textarea.value;
        if (currentValue.trim()) {
          onSubmitRef.current(currentValue);
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
