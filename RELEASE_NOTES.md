# BandMate Release Notes

Complete release history for the BandMate project - a collaborative music production platform for bands and musicians.

---

## Table of Contents

- [Overview](#overview)
- [v1.4.0 (Latest) - 2026-02-10](#v140-latest---2026-02-10)
- [v1.3.0 - 2026-02-09](#v130---2026-02-09)
- [v1.2.0 - 2026-02-06](#v120---2026-02-06)
- [v1.1.0 - 2026-02-04](#v110---2026-02-04)
- [v1.0.0 - 2026-02-02](#v100---2026-02-02)
- [v0.9.0 - 2026-02-01](#v090---2026-02-01)
- [v0.8.0 - 2026-01-31](#v080---2026-01-31)
- [Project Inception - 2026-01-30](#project-inception---2026-01-30)

---

## Overview

BandMate is a full-stack collaborative music production platform designed to help bands and musicians organize, share, and collaborate on their music projects. The application provides a structured way to manage musical projects through Projects → Vibes → Cuts hierarchy.

### Key Technologies
- **Frontend:** React, TypeScript, Tailwind CSS, WaveSurfer.js
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL
- **Real-time:** Socket.io for live updates and notifications
- **Authentication:** OAuth (Google), JWT
- **File Storage:** Local filesystem with upload management
- **Deployment:** Docker, Docker Compose

---

## v1.4.0 (Latest) - 2026-02-10

### 🚀 New Features

#### Stem ZIP Upload Support
- **Commit:** 30430c1
- **Description:** Users can now upload stem ZIP files directly from the cut files tab
- **Changes:**
  - Updated file input to accept `.zip` files alongside audio files
  - Automatic file type detection (audio → CUT type, ZIP → STEM type)
  - Updated UI button label to "Upload Audio or Stems"

---

## v1.3.0 - 2026-02-09

### 🚀 New Features

#### Activity Dismissal & Deep Linking
- **Commit:** 490b89b
- **Description:** Enhanced activity feed with dismissal capabilities and deep linking
- **Features:**
  - Activity dismissal with undo functionality
  - Bulk dismissal operations
  - Deep linking to specific comments from notifications
  - Cut moving activities tracked and displayed

#### Drag-and-Drop Cut Moving
- **Commit:** 05e2c02
- **Description:** Implemented drag-and-drop functionality for moving cuts between vibes
- **Benefits:** Improved workflow for reorganizing cuts within projects

### 🐛 Bug Fixes

#### Build Fix
- **Commit:** 7d3948b
- **Description:** Removed unused `dismissActivity` import that was breaking the build

---

## v1.2.0 - 2026-02-06

### 🚀 New Features

#### Mobile-Friendly ActionSheet Menus
- **Commit:** 83939b6
- **Description:** Implemented responsive ActionSheet component for mobile devices
- **Benefits:** Better user experience on mobile with touch-friendly menu interactions

### ⚡ Performance Improvements

#### Backend Optimization
- **Commit:** aecb593
- **Description:** Major performance improvements to backend infrastructure
- **Changes:**
  - Implemented Prisma singleton pattern for database connections
  - Added rate limiting to API endpoints for security
  - Consolidated access checks for better security and performance

### 🔧 Infrastructure

#### Test File Management
- **Commit:** a4a0ebd
- **Description:** Added configuration to ignore test upload files from backend tests

#### CI/CD Adjustments
- **Commit:** da13448
- **Description:** Removed CI workflow configuration temporarily

---

## v1.1.0 - 2026-02-04

### 🚀 New Features

#### Activity Feed System
- **Commits:** 31542ba, 7277311, 76e1f0f
- **Description:** Comprehensive activity tracking and notification system
- **Components:**
  - **Backend (31542ba):** Database model, service layer, API endpoints, and activity creation hooks
  - **Frontend (7277311):** Activity feed UI in sidebar with real-time updates via WebSocket
  - **Testing (76e1f0f):** Comprehensive test coverage and bug fixes

### 🐛 Bug Fixes

#### OAuth Authentication
- **Commit:** 2612605
- **Description:** Fixed OAuth user activity notifications
- **Technical Details:** Changed from localStorage-based to cookie-based authentication for WebSocket connections

### 📚 Documentation

#### Mobile App Development Guide
- **Commit:** 4e069fa
- **Description:** Added comprehensive mobile app development guide for future mobile application

### 🔧 Infrastructure

#### CI/CD Updates
- **Commits:** 93ab5b5, 27868d7, 4d1c803
- **Description:** Temporarily disabled backend tests in CI to resolve build issues while tests are being refactored

---

## v1.0.0 - 2026-02-02

### 🚀 New Features

#### Media Session API Support
- **Commit:** 189e099
- **Description:** Added Media Session API support for lock screen media controls
- **Benefits:** Users can control playback from device lock screen and see now-playing information

### 🐛 Bug Fixes

#### Audio Player Fixes
- **Commit:** 5734a95
- **Description:** Fixed audio continuing to play when navigating away from FileExplorer

#### Shared File Links
- **Commit:** da4be0f
- **Description:** Fixed shared file links to work in incognito mode

#### Code Quality Improvements
- **Commits:** c7309c6, 8c1ea02, 34a47de
- **Description:** 
  - Addressed code review feedback on ref capture timing
  - Fixed Sonar warnings (readonly props, parseFloat/isFinite, globalThis)
  - Ensured WaveSurfer properly pauses/destroys and closes AudioContext on unmount

### ✨ UI Updates
- **Commit:** 4d180d3
- **Description:** General UI improvements and refinements

---

## v0.9.0 - 2026-02-01

### 🚀 New Features

#### Storage Display & Avatar Support
- **Commit:** 7afdee1
- **Description:** Added storage display in sidebar and avatar support throughout the app
- **Features:**
  - Storage usage indicator in sidebar
  - User avatars displayed across the application
  - Profile image support

#### Admin Storage Dashboard
- **Commits:** a6fa47d, 776545a
- **Description:** 
  - Admins can see total site storage usage
  - Users see only their own upload storage

### 🐛 Bug Fixes

#### Auth Context Fixes
- **Commits:** 343e54d, 165978f, dbe97d9
- **Description:**
  - Fixed infinite re-render loop in AuthContext and SocketContext
  - Prevented auth refresh loop on login page
  - Ensured storage refresh is called on auth initialization

---

## v0.8.0 - 2026-01-31

### 🚀 New Features

#### Configuration & Infrastructure
- **Commits:** 71705f1, cd463de
- **Description:** 
  - Simplified configuration management
  - Added reverse proxy support for deployment flexibility
  - Environment-based configuration

#### Invitations & OAuth
- **Description:** 
  - User invitation system for project collaboration
  - OAuth integration (Google) for authentication
  - Email-based invitation flow

### 📚 Documentation

#### README Updates
- **Commits:** a817308, 9080778
- **Description:** 
  - Revamped README with branding and feature details
  - Added project introduction with images
  - Comprehensive setup instructions

---

## Project Inception - 2026-01-30

### 🎉 Initial Commit
- **Commit:** e0486b0
- **Date:** 2026-01-30
- **Description:** Initial project setup with basic structure

### 📚 Documentation
- **Commit:** 65cf03b
- **Description:** Added README.md with project description and setup instructions

---

## Feature Highlights by Category

### 🎵 Audio Features
- Multi-track audio playback with WaveSurfer.js
- Waveform visualization with comment markers
- Media Session API integration (lock screen controls)
- Audio file upload and management
- Comment timestamps linked to audio positions
- Lyrics editor synchronized with audio playback

### 📁 File Management
- Hierarchical organization: Projects → Vibes → Cuts
- Support for audio files (MP3, WAV, etc.) and ZIP stem packages
- File upload with drag-and-drop
- Public/private sharing with tokenized links
- Storage usage tracking and quotas

### 👥 Collaboration
- User authentication (OAuth + JWT)
- Project invitations and member management
- Role-based access control (Admin, Member)
- Real-time notifications via WebSocket
- Activity feed with dismissal and deep linking
- Comment system with replies and timestamps

### 📱 Mobile Experience
- Responsive design with Tailwind CSS
- Mobile-friendly ActionSheet menus
- Touch-optimized interactions
- Mobile-specific UI components

### 🔒 Security
- Rate limiting on API endpoints
- Consolidated access checks
- Secure file sharing with expiring tokens
- Cookie-based authentication for WebSocket

### ⚡ Performance
- Prisma singleton for database optimization
- Lazy loading of audio components
- Optimized re-renders in React components
- Efficient file upload handling

---

## Version History Summary

| Version | Date | Key Features |
|---------|------|--------------|
| v1.4.0 | 2026-02-10 | Stem ZIP upload support |
| v1.3.0 | 2026-02-09 | Activity dismissal, drag-and-drop, deep linking |
| v1.2.0 | 2026-02-06 | Mobile ActionSheet, backend optimization |
| v1.1.0 | 2026-02-04 | Activity feed system, OAuth fixes |
| v1.0.0 | 2026-02-02 | Media Session API, audio fixes |
| v0.9.0 | 2026-02-01 | Storage display, avatars, auth fixes |
| v0.8.0 | 2026-01-31 | Configuration, invitations, OAuth |
| v0.1.0 | 2026-01-30 | Initial project setup |

---

## Contributors

- **@Grimothy** - Project Creator & Lead Developer

---

## Links

- **Repository:** https://github.com/Grimothy/BandMate
- **Documentation:** See README.md
- **Issues:** https://github.com/Grimothy/BandMate/issues

---

**Thank you for using BandMate! 🎵 Keep creating music together.**

*Last Updated: 2026-02-10*
