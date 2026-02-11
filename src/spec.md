# Specification

## Summary
**Goal:** Restore the app’s stable dark card-game UI theme and make Quick Play for Spades and Pot Limit Omaha actually playable end-to-end without stuck or broken game states.

**Planned changes:**
- Remove/refactor global CSS overrides that break Shadcn/Tailwind component styling while keeping a coherent dark card-game aesthetic.
- Fix layout/styling regressions so core UI surfaces (header, tabs, cards, buttons, modals) render consistently on mobile and desktop without overlap or unclickable elements.
- Implement functional Quick Play game loops for Spades and Pot Limit Omaha (4-card), replacing any “Coming Soon”/placeholder gameplay with interactive state-driven UI.
- Wire the Quick Play frontend to deterministic game/session backend APIs (adding/adjusting backend endpoints as needed) so actions always return updated state, invalid actions return clear English errors, and the game does not deadlock.
- Ensure exiting a Quick Play game reliably returns the user to the “Game Lobbies” tab.

**User-visible outcome:** The app looks consistent again across tabs and devices, and users can start Quick Play Spades or Pot Limit Omaha, play through a basic hand/game with working actions and outcomes, then exit back to Game Lobbies without refreshing.
