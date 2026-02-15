# Specification

## Summary
**Goal:** Automatically restore an existing Internet Identity session on app load, routing returning users directly into the app while avoiding Auth-screen flicker.

**Planned changes:**
- Add an auth initialization/bootstrapping phase that checks for an existing Internet Identity session/delegation on startup.
- If a valid session exists, automatically route the user to `/chats` without requiring a “Sign In with Internet Identity” click.
- During initialization, show an explicit English loading/initializing state and avoid presenting “Sign In with Internet Identity” as the primary action until the session check completes.
- Ensure “Switch account”/sign-out clears any frontend “last account” indicators and prevents immediate auto-login until the user explicitly signs in again.

**User-visible outcome:** Returning users with an active Internet Identity session are taken straight to `/chats` on app open; new/expired sessions see the normal Auth screen after a brief initializing state, and signing out keeps the user on the Auth screen until they choose to sign in.
