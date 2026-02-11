<p align="center">
  <img width="248" height="248" alt="BandMate Logo" src="https://github.com/user-attachments/assets/6b2d886d-a530-4315-8e68-dc4671a8fe42" />
</p>

<h1 align="center">BandMate</h1>

<p align="center">
  <strong>Your Band's Digital Studio</strong>
</p>

<p align="center">
  A self-hosted platform where bands organize projects, share audio files and stems, leave timestamped feedback, and collaborate in real-time — all from a single dashboard.
</p>

<p align="center">
  <a href="https://grimothy.github.io/BandMate_site/">Website</a> •
  <a href="https://grimothy.github.io/BandMate_site/docs/intro">Documentation</a> •
  <a href="https://ko-fi.com/mrgrimothy">Support</a>
</p>

---

## Features

### Projects, Vibes & Cuts
Organize your music into a natural hierarchy. Projects hold your band's work, Vibes group songs by mood or theme, and Cuts are your individual tracks.

### Waveform Player
Built-in audio player powered by WaveSurfer.js with interactive waveform visualization. Supports MP3, WAV, FLAC, OGG, AAC, and M4A.

### Timestamped Comments
Drop comments at the exact moment in a track. Markers appear on the waveform so your bandmates know precisely what you're talking about.

### Real-Time Collaboration
WebSocket-powered live updates keep everyone in sync. See uploads, comments, and activity from your bandmates the moment they happen.

### File Management
Drag-and-drop uploads for audio files, stem ZIPs up to 500MB, and cover images. Share files publicly with tokenized links.

### Invite Your Band
Send email invitations with role-based permissions. Supports Google OAuth for quick onboarding and admin controls for managing your team.

---

## Quick Start

### Up and Running in 60 Seconds

**1. Pull & Run**

A single Docker command gets BandMate running with SQLite, ready to use out of the box.

```bash
docker run -d \
  --name bandmate \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  -e JWT_ACCESS_SECRET="your-secret-here" \
  -e JWT_REFRESH_SECRET="your-refresh-secret" \
  grimothy/bandmate:latest
```

**2. Login**

Open http://localhost:3000 and sign in with the default admin account:
- Email: `admin@bandmate.local`
- Password: `admin`

Then create users or enable Google OAuth for your team.

**3. Create & Collaborate**

Create a project, invite your bandmates, upload tracks, and start collaborating in real-time.

### Docker Compose

```bash
git clone https://github.com/Grimothy/BandMate.git
cd BandMate
docker-compose up -d
```

### Local Development

```bash
# Backend
cd backend
npm install
cp ../.env.example .env
npm run db:push && npm run db:seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `JWT_ACCESS_SECRET` | Secret for signing access tokens. Use a random string. |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens. Use a different random string. |

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |
| `NODE_ENV` | `development` | Set to `production` for deployments |
| `DATABASE_URL` | `file:./data/bandmate.db` | SQLite database path |

### Admin User

Initial admin credentials (used when seeding the database):

| Variable | Default |
|----------|---------|
| `ADMIN_EMAIL` | `admin@bandmate.local` |
| `ADMIN_PASSWORD` | `admin` |

### Reverse Proxy

If running behind nginx, Traefik, or another reverse proxy:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_URL` | `http://localhost:3000` | Your public-facing URL. Used for email links and OAuth redirects. |

Example for a reverse proxy setup:
```bash
-e APP_URL="https://bandmate.yourdomain.com"
```

### Email Notifications (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_ENABLED` | `false` | Set to `true` to enable |
| `EMAIL_HOST` | `smtp.example.com` | SMTP server |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_SECURE` | `false` | `true` for port 465 (SSL) |
| `EMAIL_USER` | - | SMTP username |
| `EMAIL_PASS` | - | SMTP password |
| `EMAIL_FROM` | `BandMate <noreply@bandmate.local>` | Sender address |

### Google OAuth (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_OAUTH_ENABLED` | `false` | Set to `true` to enable |
| `GOOGLE_CLIENT_ID` | - | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | - | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3000/api/auth/google/callback` | OAuth callback URL |

---

## File Upload Limits

These limits are built into the application:

| File Type | Max Size | Formats |
|-----------|----------|---------|
| Images | 5 MB | JPEG, PNG, GIF, WebP |
| Audio | 100 MB | MP3, WAV, OGG, FLAC, AAC, M4A |
| Stems (ZIP) | 500 MB | ZIP |

---

## Data Persistence

Mount these volumes to persist data:

```yaml
volumes:
  - ./data:/app/data      # SQLite database
  - ./uploads:/app/uploads # Uploaded files
```

---

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Radix UI, Socket.io, Wavesurfer.js

**Backend:** Node.js, Express, TypeScript, Prisma (SQLite), Socket.io, JWT auth

---

## Documentation

- [Getting Started](https://grimothy.github.io/BandMate_site/docs/intro)
- [Installation Guide](https://grimothy.github.io/BandMate_site/docs/installation)
- [Configuration](https://grimothy.github.io/BandMate_site/docs/configuration)
- [User Guide](https://grimothy.github.io/BandMate_site/docs/category/user-guide)
- [Deployment](https://grimothy.github.io/BandMate_site/docs/deployment)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See the [Contributing Guide](https://grimothy.github.io/BandMate_site/docs/contributing) for more details.

## Support

If you find BandMate useful, consider supporting the project:

[☕ Buy Me a Coffee](https://ko-fi.com/mrgrimothy)

## License

MIT
