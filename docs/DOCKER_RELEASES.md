# Docker Release Guide

This guide explains when Docker images are pushed to Docker Hub and how to trigger releases.

## Docker Image Location

All images are pushed to: `grimothy/bandmate`

---

## When Images Are Pushed

| Trigger | Docker Tag | Updates `latest`? | How to do it |
|---------|------------|-------------------|--------------|
| Push to `develop` branch | `grimothy/bandmate:develop` | No | `git push origin develop` |
| Push to `experimental` branch | `grimothy/bandmate:experimental` | No | `git push origin experimental` |
| Push to `release/*` branch | `grimothy/bandmate:release-X.X` | No | `git push origin release/1.0` |
| Create GitHub Release | `grimothy/bandmate:X.X.X` | **Yes** | See below |
| Manual workflow trigger | `grimothy/bandmate:<your-tag>` | No | See below |

---

## How to Create a Production Release

This is the official way to release a new version. It updates the `latest` tag.

1. Go to https://github.com/Grimothy/BandMatev2/releases
2. Click **"Create a new release"**
3. Click **"Choose a tag"** and type a new version (e.g., `v1.0.0`)
4. Click **"Create new tag: v1.0.0 on publish"**
5. Fill in release title and description
6. Click **"Publish release"**

GitHub Actions will automatically:
- Build the Docker image
- Push `grimothy/bandmate:1.0.0`
- Push `grimothy/bandmate:latest`

---

## How to Push an Experimental Image Manually

Use this to test a Docker build without creating a release.

1. Go to https://github.com/Grimothy/BandMatev2/actions
2. Click **"Release"** in the left sidebar
3. Click **"Run workflow"**
4. Enter a tag name (e.g., `dev`, `beta`, `test-fix`)
5. Click **"Run workflow"**

This pushes `grimothy/bandmate:<your-tag>` without affecting `latest`.

---

## How to Pull Images

```bash
# Latest stable release
docker pull grimothy/bandmate:latest

# Specific version
docker pull grimothy/bandmate:1.0.0

# Development version
docker pull grimothy/bandmate:develop

# Experimental version
docker pull grimothy/bandmate:experimental
```

---

## Running the Image

```bash
docker run -d \
  --name bandmate \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  -e JWT_ACCESS_SECRET="your-secret-here" \
  -e JWT_REFRESH_SECRET="your-refresh-secret-here" \
  grimothy/bandmate:latest
```

Or use docker-compose:

```bash
docker-compose up -d
```
