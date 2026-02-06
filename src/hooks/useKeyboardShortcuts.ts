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
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                  navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
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
      e.stopPropagation();
      onSend?.();
      return;
    }

    // Cmd/Ctrl + K - Focus search/input (prevent browser default)
    if (cmdKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      e.stopPropagation();
      onFocusInput?.();
      return;
    }

    // Cmd/Ctrl + N - New chat (prevent browser new window)
    if (cmdKey && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      e.stopPropagation();
      onNewChat?.();
      return;
    }

    // Cmd/Ctrl + Shift + C - Copy last AI response
    if (cmdKey && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      e.stopPropagation();
      onCopyLastResponse?.();
      return;
    }
  }, [onSend, onNewChat, onFocusInput, onCopyLastResponse, onCancelGeneration, isLoading]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
