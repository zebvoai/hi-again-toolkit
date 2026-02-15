/**
 * useRealtimeMessages — intentionally disabled.
 *
 * The Supabase realtime transformer (`@supabase/realtime-js`) calls
 * `JSON.parse` on every column value delivered via postgres_changes.
 * For columns of type `Json` (like `content` and `metadata` in the
 * `messages` table), the values are already parsed by PostgREST,
 * causing harmless but noisy "JSON parse error" console.log spam
 * on every message insert/update.
 *
 * Since all message state is managed optimistically by `useChat`
 * (addMessage, updateMessage, deleteMessage work on local Zustand
 * state and persist to DB in the background), the realtime
 * subscription was redundant for single-device usage and only
 * added console noise.
 *
 * If multi-device sync is needed in the future, consider:
 * 1. Upgrading @supabase/realtime-js (if the bug is patched)
 * 2. Using a custom channel with broadcast instead of postgres_changes
 * 3. Polling on tab-focus (already implemented via useTabFocusReload)
 */
export const useRealtimeMessages = () => {
  // No-op — see comment above
};
