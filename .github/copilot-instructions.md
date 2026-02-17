# BandMate AI Coding Instructions

## Project Overview

**BandMate** is a self-hosted music collaboration platform where bands organize projects, share audio files and stems, leave timestamped feedback, and collaborate in real-time.

### Architecture: Full-Stack TypeScript

- **Backend**: Express.js + TypeScript with Prisma ORM, SQLite database
- **Frontend**: React 18 + TypeScript with Vite, Tailwind CSS, Radix UI components
- **Real-time**: Socket.io for WebSocket-powered live updates
- **Auth**: JWT (access + refresh tokens), supports local and Google OAuth

## Data Model (Prisma Schema)

The core hierarchy is **Project → Vibe → Cut** (tracks):

- **Project**: Band's collection of work; contains members with role-based permissions
- **Vibe**: Groups cuts by mood/theme; filesystem-safe slugs are immutable identifiers
- **Cut**: Individual track; stores BPM, time signature, optional JSON lyrics
- **ManagedFile**: Uploaded audio files with metadata (duration, waveform data); supports public sharing with `shareToken`
- **Comment**: Timestamped feedback on files; supports nested replies via `parentId`
- **User**: Local/OAuth accounts; tracks `lastLogin` and `role` (ADMIN or MEMBER)

**Key Convention**: Slugs (`project.slug`, `vibe.slug`, `cut.slug`) are immutable, URL-safe identifiers used for filesystem organization. Never modify slugs on update.

## Development Workflow

### Quick Start

**Development (hot reload)**:
```bash
./dev.sh  # Auto-installs deps, starts both servers concurrently
# Backend: http://localhost:3000 | Frontend: http://localhost:5173
```

**Docker/Production**:
```bash
./build.sh  # Builds image, starts container
docker-compose up -d  # Uses compose file
```

### Backend Structure

```
backend/src/
├── config/env.ts          # Environment variables (all config centralized here)
├── middleware/
│   ├── auth.ts            # JWT validation + user context injection
│   ├── error.ts           # Global error handler
│   ├── admin.ts           # Admin role checks
│   └── rateLimit.ts       # Rate limiting
├── routes/                # REST endpoints (activities, auth, cuts, files, etc.)
├── services/              # Business logic
│   ├── socket.ts          # Socket.io event handlers
│   ├── activities.ts      # Activity creation + broadcast (core pattern)
│   ├── auth.ts            # JWT + password hashing
│   └── [others].ts
└── tests/
    ├── setup.ts           # DB cleanup per test run
    └── *.test.ts          # Vitest suite (sequential, no parallelism)
```

### Frontend Structure

```
frontend/src/
├── api/                   # Axios client + endpoint abstractions
├── pages/                 # Route components
├── components/            # Radix UI + custom components
├── context/               # Global state (auth, user, project)
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript interfaces
```

### Testing

- **Framework**: Vitest (run tests sequentially to avoid SQLite locking)
- **Command**: `npm run test` (or `npm run test:watch`)
- **Pattern**: Tests clean the database in `setup.ts` and verify API responses via supertest

## Critical Patterns & Conventions

### Activity System (Real-Time Broadcasting)

Activities are immutable audit logs broadcast to all project members via Socket.io:

```typescript
// Service creates activity + broadcasts
await createActivity({
  type: 'file_uploaded',
  userId: user.id,
  projectId: project.id,
  metadata: { filename, duration },
  resourceLink: `/projects/${projectSlug}/vibes/${vibeSlug}/cuts/${cutSlug}`,
});

// Socket handler: emitToProject(projectId, 'activity:created', activity)
```

**When to use**: File uploads, cut creation, member invites, comment additions, lyrics updates. Activities drive the notification system and activity feed.

### Authentication Flow

1. **Local**: Email + hashed password (bcryptjs) → access/refresh JWT tokens
2. **Google OAuth**: Social login → user created/updated with `providerId` and `avatarUrl`
3. **Middleware**: `authMiddleware` extracts token from cookies or `Authorization: Bearer` header; attaches user to `req.user`
4. **Socket.io**: Same token validation; tracks multi-tab sessions via `userSockets` map

### File Organization on Disk

```
uploads/
├── {projectSlug}/
│   └── {vibeSlug}/
│       ├── {cutSlug}/        # Audio files for this cut
│       └── {other cuts}/
```

Path is derived from project/vibe/cut slugs; file metadata stored in `ManagedFile` table.

### Socket.io Event Patterns

- **Authentication**: Token passed in handshake or cookies; fails silently if invalid
- **Broadcasting**: Use `emitToProject(projectId, 'event', data)` to notify all members of a project
- **Rate limiting**: Some socket events have built-in rate checks
- **User tracking**: `userSockets` map stores active connections per user ID

### Error Handling

Global `errorHandler` middleware catches Express errors. Return status codes:
- **400**: Bad request (validation, file too large)
- **401**: Unauthenticated (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found
- **500**: Server error (logged to console)

## Common Tasks

### Adding a New API Endpoint

1. Create route handler in `routes/{feature}.ts`
2. Use `authMiddleware` to protect; check `req.user.id`
3. Fetch/validate data via Prisma in service or route
4. Broadcast activity if user action: call `createActivity()`
5. Return 200 with data or 400+ error

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Create migration: `npm run db:migrate` (auto-generates migration files)
3. Update services/routes that interact with changed models
4. Update tests if necessary

### Real-Time Updates

1. Emit via Socket.io in service after state change: `emitToProject(projectId, 'event:name', data)`
2. Frontend subscribes in `useEffect` via `socket.on('event:name', handler)`
3. Update React state; no manual refetch needed

### File Uploads

- Multer middleware handles multipart/form-data
- Audio files: extracted to `{projectSlug}/{vibeSlug}/{cutSlug}/` directory
- Stems (zips): extracted; metadata stored in ManagedFile
- All uploads validated by MIME type; size limits enforced

## Environment Variables (config/env.ts)

Key variables for development:
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (required; dev defaults provided)
- `EMAIL_ENABLED`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` (optional)
- `GOOGLE_OAUTH_ENABLED`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional)
- `UPLOADS_*_PATH` (optional; defaults to `./uploads/{images,audio,stems}`)
- `DATABASE_URL` (default: SQLite at `file:./data/bandmate.db`)

## Performance Considerations

- **SQLite**: Single-threaded; tests run sequentially to avoid lock contention
- **Waveform caching**: `ManagedFile.waveformData` stores cached visualization data to avoid re-computation
- **Activity limits**: Query includes pagination; older activities cleaned up periodically
- **Socket connections**: Tracked per user to avoid broadcast storms
