# Mobile App Guide

BandMate is a web application built with React and a REST + WebSocket API backend. There are several approaches to bring BandMate to Android and iOS devices, ranging from zero code changes to building a fully native app.

---

## Option 1: Progressive Web App (PWA)

**Effort: Low** · **Code Changes: Minimal** · **Platforms: Android + iOS**

BandMate includes a web app manifest that allows users to "install" it directly from the browser. On Android this uses Chrome's Add to Home Screen; on iOS it uses Safari's Share → Add to Home Screen. The installed app runs full-screen without browser chrome and behaves like a native app.

### What You Get

- Home screen icon and splash screen
- Full-screen app experience (no browser URL bar)
- Works on both Android and iOS
- No app store required
- Automatic updates (always serves the latest version)

### Limitations

- iOS Safari has limited background audio and push notification support
- No access to native APIs beyond what the browser exposes
- Not listed in Google Play or the Apple App Store

This is the recommended starting point for most self-hosted deployments.

---

## Option 2: Capacitor (Recommended for Native Wrapper)

**Effort: Medium** · **Code Changes: Small** · **Platforms: Android + iOS**

[Capacitor](https://capacitorjs.com/) wraps the existing React frontend in a native WebView container and produces real Android (APK/AAB) and iOS (IPA) apps. Since BandMate is already a single-page React app, most of the UI works inside a Capacitor shell with minimal changes.

### Steps

1. **Install Capacitor** in the frontend directory:

   ```bash
   cd frontend
   npm install @capacitor/core @capacitor/cli
   npx cap init BandMate com.bandmate.app --web-dir dist
   ```

2. **Add platforms**:

   ```bash
   npx cap add android
   npx cap add ios
   ```

3. **Configure the server URL** in `capacitor.config.ts` so the app points at your BandMate backend:

   ```ts
   import type { CapacitorConfig } from '@capacitor/cli';

   const config: CapacitorConfig = {
     appId: 'com.bandmate.app',
     appName: 'BandMate',
     webDir: 'dist',
     server: {
       url: 'https://bandmate.yourdomain.com',
       cleartext: true,
     },
   };

   export default config;
   ```

   For local development, point the URL at your development server.

4. **Build and sync**:

   ```bash
   npm run build
   npx cap sync
   ```

5. **Open in native IDE**:

   ```bash
   npx cap open android   # Opens Android Studio
   npx cap open ios       # Opens Xcode
   ```

### What You Get

- Real apps for Google Play and the Apple App Store
- Access to native plugins (push notifications, camera, filesystem, etc.)
- Reuses the entire existing React frontend — no rewrite needed
- Hot-reload during development via `npx cap run`

### Considerations

- Requires Android Studio and/or Xcode for building
- iOS builds require a Mac and an Apple Developer account ($99/year)
- Performance depends on the device's WebView — usually fine for UI-driven apps like BandMate
- Native plugin integration (e.g., push notifications) requires additional Capacitor plugins

---

## Option 3: React Native

**Effort: High** · **Code Changes: Full Rewrite** · **Platforms: Android + iOS**

[React Native](https://reactnative.dev/) builds truly native apps using React. This requires rewriting the entire frontend since React Native uses native components (`<View>`, `<Text>`) instead of HTML/CSS. However, the backend API and WebSocket layer remain unchanged.

### What You Would Reuse

- **Backend API** — all REST endpoints work as-is with `fetch` or Axios
- **Socket.io** — the `socket.io-client` package works in React Native
- **Authentication flow** — JWT tokens stored in secure storage instead of cookies
- **TypeScript types** — shared interfaces for API responses

### What You Would Rebuild

- All UI components (replace Radix UI + Tailwind with React Native equivalents)
- Navigation (React Navigation instead of React Router)
- Audio player (replace WaveSurfer.js with `react-native-track-player` or `expo-av`)
- File uploads (use `react-native-document-picker` or `expo-document-picker`)
- State management and hooks (mostly portable with minor adjustments)

### Recommended Libraries

| Feature | Library |
|---------|---------|
| Navigation | [React Navigation](https://reactnavigation.org/) |
| Audio playback | [react-native-track-player](https://github.com/doublesymmetry/react-native-track-player) |
| File picking | [react-native-document-picker](https://github.com/rnmods/react-native-document-picker) |
| Secure storage | [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| WebSocket | [socket.io-client](https://socket.io/docs/v4/client-api/) (works directly) |

This approach makes sense if you want a fully native experience with access to all device APIs, but it is a significant development effort.

---

## Backend Considerations

Regardless of which approach you choose, the backend needs minimal changes:

### CORS

If the mobile app connects to the backend from a different origin, make sure CORS is configured to allow requests from the app. For Capacitor apps, the origin will be `capacitor://localhost` (iOS) or `http://localhost` (Android).

### Authentication

- **PWA / Capacitor**: Cookie-based auth works in WebViews. No changes needed if the app loads from the server URL.
- **React Native**: Use the `Authorization: Bearer <token>` header instead of cookies. The backend already supports this — see `authMiddleware` in `backend/src/middleware/auth.ts`.

### WebSocket

Socket.io works across all approaches. The client passes the JWT token in the handshake, which works identically in browsers, WebViews, and React Native.

### File Uploads

Multipart form-data uploads work the same way from all clients. No backend changes are needed.

---

## Recommendation

For most teams, the fastest path to mobile is:

1. **Start with the PWA** — BandMate already includes a web app manifest. Install it from the browser and test the experience on your devices.
2. **Move to Capacitor** if you need app store distribution or native features like push notifications. This wraps the existing frontend with minimal code changes.
3. **Consider React Native** only if you need a fully native UI experience and are prepared for a full frontend rewrite.
