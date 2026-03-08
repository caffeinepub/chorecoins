# ChoreCoins

## Current State

The app has a full chore tracking system with:
- `RoleSelection` page showing children as clickable cards, and a Parent Login button
- `ChildDashboard` page with chores list, "Done!" buttons to submit completions, pending/approved states, and recent earnings
- `ParentDashboard` with Children, Chores, and Approvals tabs
- `ApprovalsTab` showing pending completions with Approve/Reject buttons
- Backend: `getChildren()` requires admin auth, `getChildrenPublic()` does not exist yet
- Backend: `getChoresForChild()`, `submitChoreCompletion()`, `getChildCompletions()`, `getChildInfo()` are all public (no auth required)
- Backend: `approveCompletion()` and `rejectCompletion()` require admin

## Requested Changes (Diff)

### Add
- A public `getChildrenPublic()` backend function that returns all children without requiring admin auth, so the role selection screen can list children without the admin token

### Modify
- `useGetChildren()` hook: split into two -- keep the admin version for the parent dashboard, add a new `useGetChildrenPublic()` hook that doesn't require auth and uses the public backend endpoint
- `RoleSelection.tsx`: use `useGetChildrenPublic()` instead of `useGetChildren()` so children can see and tap their name without the admin token
- `ChildrenTab.tsx` (parent dashboard): continues to use the admin `useGetChildren()` hook

### Remove
- Nothing

## Implementation Plan

1. Add `getChildrenPublic()` to `main.mo` -- public query, no assertAdmin, returns same data as `getChildren()`
2. Regenerate backend types / update `backend.d.ts` to include `getChildrenPublic(): Promise<Array<Child>>`
3. Add `useGetChildrenPublic()` hook to `useQueries.ts` using the new endpoint
4. Update `RoleSelection.tsx` to call `useGetChildrenPublic()` instead of `useGetChildren()`
5. Validate and deploy
