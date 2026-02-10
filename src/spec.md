# Specification

## Summary
**Goal:** Add an admin-only backend method to update canister build/deploy metadata so the Live Status UI can reliably verify the running version after publishing.

**Planned changes:**
- Add a new admin-only shared method in `backend/main.mo` to update `canisterBuildMetadata` fields: `commitHash`, `buildTime`, and `dfxVersion`.
- Enforce authorization: non-admin calls to the update method trap with an English "Unauthorized" message.
- Ensure `getCanisterBuildMetadata` remains a public query and always returns a valid `CanisterBuildMetadata` record with defaults when unset (`commitHash=""`, `buildTime=0`, `dfxVersion=""`).
- Keep candid/types compatible so the existing frontend hook `useGetCanisterBuildMetadata` continues to work without mismatches.

**User-visible outcome:** Live Status can consistently display/verify the currently running build version metadata after a Live publish, without breaking existing frontend metadata queries.
