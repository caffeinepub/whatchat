# Specification

## Summary
**Goal:** Add 1:1 voice and video calling to Whatchat using a non-real-time (polling/manual refresh) WebRTC signaling flow.

**Planned changes:**
- Add “Voice call” and “Video call” actions to the 1:1 chat thread header, including disabled/error behavior when the recipient cannot be determined.
- Implement a call UI (modal or full-screen) that shows call type and the other participant identifier, with controls to start/accept/end and handle permission/device errors.
- Add backend call signaling/session APIs (create/start, get session, post offer/answer, post ICE candidates, end) with strict auth and participant-only access for 1:1 sessions.
- Add React Query hooks for call signaling and implement polling and/or a visible manual refresh while the call UI is open; stop polling/refresh when the call ends/close, and explain that calling is not real-time.

**User-visible outcome:** In a 1:1 chat, users can start a voice or video call, grant mic/camera permissions, and connect via a simple call screen that progresses via polling/refresh (no real-time signaling).
