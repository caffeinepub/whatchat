# Specification

## Summary
**Goal:** Build the “Whatchat” WhatsApp-style messaging app shell with email-based accounts, non-real-time messaging, a cohesive theme, and clear guidance for the user to edit and redeploy the project.

**Planned changes:**
- Create core app navigation and screens: Auth, Chat List, Chat Thread, and Settings/Profile, showing the app name “Whatchat”.
- Implement email + password account flow: sign up (no duplicate emails), sign in, sign out, and session persistence across reloads; clearly indicate verified vs unverified email status (with copy noting no verification if applicable).
- Implement non-real-time 1:1 messaging: start/select conversations by email, send text messages, show chronological threads, and add an explicit Refresh action with UI messaging that chat is not real-time.
- Add “Developer Info” content: top-level documentation for running, building, deploying, and where to edit UI and backend logic; include an in-app Settings section that points to this guidance.
- Apply a distinct, consistent Whatchat visual theme across all screens (mobile-first), avoiding a blue/purple-dominant palette.

**User-visible outcome:** Users can create an account with email/password, sign in/out, view chats, start 1:1 conversations by email, send messages in threads, manually refresh for new messages, adjust profile/settings, and find clear instructions (in-app and in docs) for modifying and redeploying the app.
