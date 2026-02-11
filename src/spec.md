# Specification

## Summary
**Goal:** Publish/deploy the current draft build (Version 163) to the Live (public) ICP canister so it is accessible via the public ic0.app gateway URL.

**Planned changes:**
- Publish Version 163 from draft/preview to the Live (public) canister deployment.
- Ensure Admin Settings exposes a non-empty “Public ICP Link” pointing to `https://<canister-id>.ic0.app`.
- Ensure deployment metadata shown in the app reflects the newly published Version 163 build after refresh.

**User-visible outcome:** The app loads successfully from `https://<canister-id>.ic0.app` in a new browser session, and Admin Settings shows the correct Public ICP Link and updated deployment metadata.
