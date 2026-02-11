# Specification

## Summary
**Goal:** Update Spades Quick Play so games play across multiple hands and end when a player reaches 500+ total points.

**Planned changes:**
- Change Quick Play end-of-game logic to trigger game over only when at least one player has 500+ total points after a completed hand.
- Implement per-hand scoring (based on each player’s bid and tricks won) and maintain persistent total scores across hands within the same Quick Play session.
- Update the UI to show each player’s running total score and display the win target (e.g., "Target: 500").
- When a hand ends and no player has reached 500, automatically start a new hand (fresh deal; reset bids/tricks/spadesBroken/current trick).
- Define deterministic winner selection when multiple players reach 500+ in the same hand (e.g., highest total points; deterministic tie handling).

**User-visible outcome:** Players can play Spades Quick Play as a full game to 500 points, see running total scores and the 500-point target, and continue seamlessly into new hands until the game ends at 500+.
