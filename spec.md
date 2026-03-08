# ChoreCoins

## Current State
The app has a parent dashboard with Children, Chores, and Approvals tabs. Parents log in via Internet Identity. The backend has `getCallerUserProfile` and `saveCallerUserProfile` endpoints that store a `UserProfile { name: Text }` per principal. The frontend does not use these profile endpoints -- parents land directly on the dashboard after login, with no profile setup step.

## Requested Changes (Diff)

### Add
- A profile setup/edit screen that appears for parents who haven't set a name yet (after login, before dashboard)
- A `useGetCallerUserProfile` query hook and `useSaveCallerUserProfile` mutation hook in `useQueries.ts`
- A `ProfileSetup` page component that prompts the parent to enter their name
- A profile display in the `ParentDashboard` header showing the parent's name (instead of just the truncated principal)
- A "Edit Profile" option accessible from the parent dashboard header or a menu so the parent can update their name later

### Modify
- `App.tsx`: add a `profile` view state so after login, if no profile exists, the app shows the profile setup screen before the dashboard
- `RoleSelection.tsx`: after login success, check for profile instead of going directly to parent dashboard; flow: login -> check profile -> if none, show ProfileSetup -> then ParentDashboard
- `ParentDashboard.tsx`: show parent's name from profile in the header instead of (or alongside) the principal string; add ability to edit profile

### Remove
- Nothing removed

## Implementation Plan
1. Add `useGetCallerUserProfile` and `useSaveCallerUserProfile` hooks to `useQueries.ts`
2. Create `ProfileSetup.tsx` page -- a simple form asking for parent's name with a save button
3. Update `App.tsx` to add a `{ mode: "profile" }` view state
4. Update `RoleSelection.tsx`: after login success, navigate to profile-check view (App handles this)
5. In `App.tsx` after login: fetch profile, if missing show ProfileSetup, else go to ParentDashboard
6. Update `ParentDashboard.tsx` header to show parent's name from profile and add edit profile trigger (small button or inline edit)
