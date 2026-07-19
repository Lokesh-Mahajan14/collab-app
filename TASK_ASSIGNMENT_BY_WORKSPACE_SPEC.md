# Workspace Task Assignment Feature Spec

## Goal

When a user opens a selected workspace, only the workspace creator should be able to assign tasks to members.

Non-creators should still be able to view the workspace task board, but they should not see the task creation and assignment controls.

## Current Behavior

- `components/tasks/CreateTaskDialog.tsx` loads all workspace members and shows them in the assignee dropdown.
- `app/api/workspaces/[workspaceId]/tasks/route.ts` already blocks task creation for non-creators.
- The task creation page is rendered from `app/workspace/[workspaceId]/projects/page.tsx`.
- The dialog currently calls `/api/workspace/${workspaceId}/members`, but there is no matching API route in the current workspace tree.

## Desired Behavior

1. If the current user is the workspace creator:
   - show the task creation button and dialog
   - allow choosing any member of that workspace as the assignee
   - keep the server-side ownership check in place

2. If the current user is not the workspace creator:
   - hide the task creation button and dialog
   - show the task list only
   - do not expose the assignee dropdown

3. Task visibility stays workspace-scoped:
   - all workspace members can see tasks for that workspace
   - only the creator can create and assign tasks

## Proposed Folder Structure

Keep the feature close to the current task and workspace pages so the change stays localized:

- `app/workspace/[workspaceId]/projects/page.tsx`
  - fetch workspace ownership and task data
  - decide whether to render the create-task action

- `app/api/workspaces/[workspaceId]/tasks/route.ts`
  - keep the creator-only authorization check
  - validate `assignedToId` belongs to the same workspace before task creation

- `app/api/workspaces/[workspaceId]/members/route.ts`
  - add a workspace-member lookup endpoint if the UI needs it

- `components/tasks/CreateTaskDialog.tsx`
  - render the assign-to selector only for the workspace creator
  - fall back to a read-only task form or no-op state for non-creators if needed

- `components/tasks/TaskBoard.tsx` or `components/tasks/TaskList.tsx`
  - keep task rendering separate from creation controls if the page needs a cleaner split

## Implementation Notes

- The workspace creator should be derived from the workspace record, not from client-side state.
- The assignee list should be limited to users who are actual members of the selected workspace.
- The API should reject assignments to users outside the workspace, even if the client UI is bypassed.
- If the page is server-rendered, pass an `isOwner` flag into the task creation component rather than re-deriving it in the client.

## Validation Checklist

- Workspace creator can see the task creation UI and assign any member.
- Non-creators can open the workspace and see tasks, but not the create-task UI.
- API rejects task creation from non-creators.
- API rejects task assignment to users who are not members of the selected workspace.
- The task board still refreshes after a successful task creation.

## Open Questions

- Should non-creators be able to suggest tasks, or should they only view the board?
- Should the assignee dropdown show only active members, or all members including owners/admins?
- Do you want the task create button hidden entirely for non-creators, or visible but disabled with an explanation?