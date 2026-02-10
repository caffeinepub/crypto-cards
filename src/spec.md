# Specification

## Summary
**Goal:** Remove deployment-blocking backend/frontend API mismatches and make backend connectivity + build metadata reporting resilient so the app builds and runs cleanly during deployment troubleshooting.

**Planned changes:**
- Align backend candid/API and frontend calls for saving the caller user profile so `useSaveCallerUserProfile` no longer triggers method-not-found errors, and ensure saved profiles can be fetched back via `getCallerUserProfile`.
- Implement real retry/error tracking in `frontend/src/hooks/useActorWithRetry.ts` (without changing any immutable hook/UI paths) so actor creation failures set `isError`/`error` and retries reflect `retryCount`/`isRetrying`.
- Make `backend/main.mo` `getCanisterBuildMetadata` always return a valid `CanisterBuildMetadata` record with safe default values (empty strings, `buildTime = 0`) instead of trapping.

**User-visible outcome:** The app builds successfully, saving a user profile works end-to-end in “Play for Real” mode, the backend connectivity indicator accurately shows connection failures with a meaningful English error message, and the Live App Status section loads without runtime errors even when metadata is missing or the backend is unreachable.
