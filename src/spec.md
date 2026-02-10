# Specification

## Summary
**Goal:** Make the public Internet Computer gateway link (https://&lt;canister-id&gt;.ic0.app) easy to find and copy from the main UI, alongside live deployment metadata.

**Planned changes:**
- Add a visible entry point in the main navigation/tab layout that exposes the existing Live App Status UI (LivePublishStatus) to all users.
- Update the Live App Status UI to show “Current Site Origin” (from `window.location.origin`) with a one-click copy action and English success/failure toasts.
- Update the Live App Status UI to show “Public ICP Link” as `https://<canister-id>.ic0.app` when a canister ID is available; otherwise show an English “Not available” state without crashing; include one-click copy and English success/failure toasts when available.
- Add a “Go Live / Get ICP App Link” help section adjacent to (or in the same place as) Live App Status explaining, in English, how to publish Draft → Live in Caffeine and where to find/copy the resulting public link format.

**User-visible outcome:** Users can reach Live App Status in ≤1 click from the main screen, copy the current site origin and (when available) the public ICP gateway URL with clear English feedback, and read English guidance on publishing Draft to Live and finding the public app link.
