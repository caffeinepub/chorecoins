# ChoreCoins

## Current State

- Parents can add/manage chores (name, amount, frequency, active/inactive) globally
- Children see ALL active chores -- no per-child assignment
- Children can tap "Done!" to submit a chore completion; parents approve/reject
- Approval credits the child's balance
- Parent can deduct money from a child with a note

## Requested Changes (Diff)

### Add
- `choreAssignments` storage: maps `choreId -> [childId]` (which children are assigned to a chore)
- Backend: `assignChoreToChildren(choreId, childIds)` -- sets the list of children assigned to a chore (admin only)
- Backend: `getChoreAssignments(choreId)` -- returns list of assigned child IDs (admin only)
- Backend: `getAllChoreAssignments()` -- returns all assignments as `[(choreId, [childId])]` (admin only)
- In `getChoresForChild(childId)`: filter to only return chores where childId is in the assignment list (or chore has no assignments = available to all)
- UI: In the Chores tab (parent), each chore card has an "Assign" button/section where the parent can check/uncheck which children the chore applies to
- Children's dashboard only shows chores they are assigned to (or all chores if a chore has no assignments)

### Modify
- `getChoresForChild(childId)`: filter chores so only assigned ones appear (if assignments exist for that chore)
- ChoresTab: add child assignment multi-select/checkbox UI per chore
- ChoreCompletion approval flow: unchanged (still works the same)

### Remove
- Nothing removed; backward-compatible (chores with no assignments still show to all children)

## Implementation Plan

1. **Backend (`main.mo`)**:
   - Add `choreAssignments` map: `Map<Nat, [Nat]>` (choreId -> list of childIds)
   - Add `assignChoreToChildren(choreId: Nat, childIds: [Nat]) : async Bool` (admin only)
   - Add `getChoreAssignments(choreId: Nat) : async [Nat]` (admin only)
   - Add `getAllChoreAssignments() : async [(Nat, [Nat])]` (admin only)
   - Update `getChoresForChild`: if `choreAssignments.get(choreId)` has entries, only include chore if childId is in the list; if no entries (empty/null), include for all children

2. **Frontend**:
   - Update `useQueries.ts` hooks: add `useAssignChoreToChildren`, `useGetAllChoreAssignments`
   - Update ChoresTab: after each chore card, show a collapsible "Who's this for?" section with checkboxes for each child; load children and assignments; save on change
   - ChildDashboard: `getChoresForChild` backend already handles filtering, so no change needed there
   - ApprovalsTab: show child name alongside chore name in pending approvals
