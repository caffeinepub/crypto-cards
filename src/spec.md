# Specification

## Summary
**Goal:** Make the app’s global background noticeably more colorful while preserving readable contrast in both light and dark modes.

**Planned changes:**
- Replace the current subtle global background gradient (used by the main app container and loading screen) with a richer multi-stop gradient derived from existing theme colors (primary/secondary/accent).
- Ensure foreground text and UI elements maintain strong contrast across the full gradient in both `:root` (light) and `.dark` (dark) modes.
- Apply the updated background consistently to the main app shell and loading screen without any backend changes.

**User-visible outcome:** The loading screen and main app background look more vibrant and colorful, while all text and UI remain clearly legible in both light and dark modes.
