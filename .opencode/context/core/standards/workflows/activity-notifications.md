<!-- Context: standards/workflows/activity-notifications.md -->

# Activity Notification Standards

## Core Idea
Establish clear guidelines for when to create activity notifications to keep team members informed of important project changes without overwhelming them with trivial updates.

## Key Points
- **Purpose**: Activity notifications inform team members about significant project events via the bell icon notification dropdown
- **User Experience**: Notifications appear in real-time and are accessible from any page via the header bell icon
- **Balance**: Track important actions without creating notification fatigue
- **Discoverability**: All tracked activities appear in both the bell dropdown and the full Activity Feed page (`/activity`)

## When to Add Activity Tracking

### Always Track These Actions
**Major Collaborative Events** - Actions that affect the entire team or project structure:
- ✅ Project creation (`project_created`)
- ✅ Team member additions (`member_added`)
- ✅ Vibe (category) creation (`vibe_created`)
- ✅ Cut (track/version) creation (`cut_created`)

**Content & Collaboration** - Actions that represent meaningful creative work:
- ✅ File uploads (`file_uploaded`)
- ✅ File sharing externally (`file_shared`)
- ✅ Comments on cuts (`comment_added`)
- ✅ Lyrics updates (`lyrics_updated`)

### Decision Framework
When implementing a new feature, pause and consider:

1. **Is this action significant to other team members?**
   - If yes → likely needs activity tracking
   - If no → skip activity tracking

2. **Does this action represent a state change others need to know about?**
   - New content created → Track it
   - Settings/preferences changed → Usually skip
   - Content updated → Consider the significance

3. **Will this action be frequent and repetitive?**
   - Occasional (once per session) → Track it
   - Frequent (multiple times per minute) → Skip or batch

4. **Does this fit an existing activity type?**
   - Check `backend/src/services/activities.ts` for current types
   - Reuse existing types when possible
   - Only add new types for distinctly different actions

### Examples of What NOT to Track
❌ User authentication/logout  
❌ File downloads (passive consumption)  
❌ Page views or navigation  
❌ Auto-save operations  
❌ Real-time typing/editing (track only on save)  
❌ Filter/search actions  
❌ Settings/preferences updates  
❌ Profile photo changes  

## Implementation Pattern

### Backend Implementation
```typescript
// In your route handler (e.g., backend/src/routes/projects.ts)
import { createActivity } from '../services/activities';

// After successful operation
await createActivity({
  type: 'project_created', // Must match ActivityType enum
  userId: req.user!.id,    // Who performed the action
  projectId: project.id,    // Which project (for filtering)
  metadata: {               // Context-specific details
    projectName: name,
    // Add any relevant metadata
  },
  resourceLink: `/projects/${slug}`, // Where to navigate when clicked
});
```

### Activity Type Definition
```typescript
// In backend/src/services/activities.ts
export type ActivityType =
  | 'project_created'
  | 'member_added'
  | 'vibe_created'
  | 'cut_created'
  | 'file_uploaded'
  | 'file_shared'
  | 'comment_added'
  | 'lyrics_updated';
  // Add new types here when needed
```

### Real-time Broadcast
Activities are automatically broadcast via WebSocket after creation:
```typescript
// In backend/src/services/activities.ts (handled automatically)
io.to(`project:${projectId}`).emit('activity', activityWithUser);
```

### Frontend Display
Activities automatically appear in:
1. **Bell Icon Dropdown** (`frontend/src/components/layout/NotificationBell.tsx`) - First 10 activities
2. **Activity Feed Page** (`frontend/src/pages/activity/ActivityFeedPage.tsx`) - Full filterable list
3. **Dashboard Activity Card** (`frontend/src/components/dashboard/DashboardActivityCard.tsx`) - Recent 5 activities

## Agent Guidelines

When implementing a new feature, agents should:

1. **Pause and consider** if the action warrants activity tracking using the decision framework above
2. **Ask the user** if uncertain: "Should I add activity tracking for [action]? This would notify team members when [description]."
3. **Reuse existing types** when the action fits an existing category
4. **Propose new types** only when the action is distinctly different from existing types
5. **Include metadata** that provides context (names, descriptions, relevant IDs)
6. **Set proper resourceLink** so users can navigate to the related content

## Testing Checklist

After adding activity tracking:
- [ ] Activity appears in bell dropdown immediately after action
- [ ] Activity shows unread indicator (blue dot) for other users
- [ ] Clicking activity navigates to correct resource
- [ ] Activity includes helpful metadata in description
- [ ] Activity is associated with correct project for filtering
- [ ] WebSocket broadcasts to all project members
- [ ] Mark as read functionality works

## Related
- code-quality.md
- task-delegation.md
- code-review.md

📂 Codebase References
- backend/src/services/activities.ts - Activity service & types
- backend/src/routes/activities.ts - Activity API endpoints
- frontend/src/components/layout/NotificationBell.tsx - Bell dropdown UI
- frontend/src/pages/activity/ActivityFeedPage.tsx - Full activity page
- frontend/src/api/activities.ts - Activity API client
- frontend/src/context/SocketContext.tsx - WebSocket & activity state
