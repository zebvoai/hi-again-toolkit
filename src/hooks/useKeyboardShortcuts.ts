import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onSend?: () => void;
  onNewChat?: () => void;
  onFocusInput?: () => void;
  onCopyLastResponse?: () => void;
  onCancelGeneration?: () => void;
  isLoading?: boolean;
}

export const useKeyboardShortcuts = ({
  onSend,
  onNewChat,
  onFocusInput,
  onCopyLastResponse,
  onCancelGeneration,
  isLoading = false,
}: KeyboardShortcutsConfig) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    // Escape - Cancel generation
    if (e.key === 'Escape' && isLoading) {
      e.preventDefault();
      onCancelGeneration?.();
      return;
    }

    // Cmd/Ctrl + Enter - Send message
    if (cmdKey && e.key === 'Enter') {
      e.preventDefault();
      onSend?.();
      return;
    }

    // Cmd/Ctrl + K - Focus search/input
    if (cmdKey && e.key === 'k') {
      e.preventDefault();
      onFocusInput?.();
      return;
    }

    // Cmd/Ctrl + N - New chat
    if (cmdKey && e.key === 'n') {
      e.preventDefault();
      onNewChat?.();
      return;
    }

    // Cmd/Ctrl + Shift + C - Copy last AI response
    if (cmdKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      onCopyLastResponse?.();
      return;
    }
  }, [onSend, onNewChat, onFocusInput, onCopyLastResponse, onCancelGeneration, isLoading]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
