# Release Notes - v1.3.4

**Release Date:** 2026-02-10  
**Previous Version:** v1.3.3

---

## 🚀 New Features

### Upload Stem ZIP Files from Cut Files Tab
- **PR:** #30430c1
- **Description:** Users can now upload stem ZIP files directly from the cut files tab
- **Changes:**
  - Updated file input to accept `.zip` files alongside audio files (`accept="audio/*,.zip"`)
  - Added automatic file type detection to route uploads correctly
  - Audio files are uploaded as `CUT` type (playable in the audio player)
  - ZIP files are uploaded as `STEM` type (displayed with ZIP icon)
  - Updated button label from "Upload File" to "Upload Audio or Stems" for clarity

### Drag-and-Drop Cut Moving
- **Commit:** 05e2c02
- **Description:** Implemented drag-and-drop functionality for moving cuts between vibes
- **Benefits:** Improved workflow for reorganizing cuts within projects

### Activity Feed System
- **Commits:** 31542ba, 7277311, 490b89b
- **Description:** Comprehensive activity tracking and notification system
- **Features:**
  - Activity tracking backend with database model and service layer
  - Activity feed UI in the sidebar with real-time updates
  - Activity dismissal with undo/bulk actions
  - Deep linking to specific comments from activity notifications
  - Cut moving activities tracked and displayed

### Mobile-Friendly ActionSheet Menus
- **Commit:** 83939b6
- **Description:** Implemented responsive ActionSheet component for mobile devices
- **Benefits:** Better user experience on mobile with touch-friendly menu interactions

---

## 🐛 Bug Fixes

### OAuth Authentication Fix
- **Commit:** 2612605
- **Description:** Fixed OAuth user activity notifications by updating socket authentication
- **Technical Details:** Changed from localStorage-based to cookie-based authentication for WebSocket connections

### Activity System Bug Fixes
- **Commit:** 76e1f0f
- **Description:** Fixed various bugs in the activity system with comprehensive test coverage

### Build Fix
- **Commit:** 7d3948b
- **Description:** Removed unused `dismissActivity` import that was breaking the build

---

## ⚡ Performance Improvements

### Backend Optimization
- **Commit:** aecb593
- **Description:** Major performance improvements to backend
- **Changes:**
  - Implemented Prisma singleton pattern for database connections
  - Added rate limiting to API endpoints
  - Consolidated access checks for better security and performance

---

## 🔧 Infrastructure & DevOps

### CI/CD Updates
- **Commit:** da13448
- **Description:** Removed CI workflow configuration (temporary)
- **Commits:** 4d1c803, 27868d7, 93ab5b5
- **Description:** Temporarily disabled backend tests in CI to resolve build issues while tests are being refactored

---

## 📁 File Changes

```
frontend/src/pages/cuts/CutDetail.tsx    | 11 +++++++++--
[Plus other files from previous commits]
```

---

## 📝 Migration Notes

No database migrations required for this release.

---

## 🔗 Links

- **Full Changelog:** [Compare v1.3.3...v1.3.4](https://github.com/Grimothy/BandMate/compare/V1.3.3...HEAD)
- **Issues Closed:** N/A
- **Documentation:** See README.md for updated usage instructions

---

**Contributors:** @Grimothy

**Happy collaborating! 🎵**
