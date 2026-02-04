

## Make Model Rail Fixed to Top

The model selection rail currently uses `sticky top-0` positioning, but since it's inside a scrollable container, it scrolls away with the content. You want it to stay fixed at the top of the viewport at all times.

### What Will Change

1. **Model Rail becomes fixed** - The rail will be pinned to the top of the screen and won't scroll away
2. **Dynamic left offset** - The rail will automatically adjust its left position based on whether the sidebar is expanded (256px) or collapsed (48px)
3. **Content spacing** - The messages area will get top padding so content doesn't hide behind the fixed rail

### Visual Result
The model chips (GPT-5, Claude, Gemini, etc.) will always remain visible at the top as you scroll through your chat messages.

---

## Technical Details

### File: `src/features/chat/components/ModelRail.tsx`
- Accept new props: `sidebarWidth` to know sidebar state
- Change from `sticky top-0` to `fixed top-0`
- Add dynamic `left` style based on sidebar width
- Set explicit `right-0` to stretch across the viewport

### File: `src/components/ChatInterface.tsx`
- Pass sidebar state to ModelRail component
- Calculate appropriate left offset (256px expanded, 48px collapsed, 0 on mobile)
- Add top padding (~60px) to messages area when ModelRail is visible to prevent content overlap

