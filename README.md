# KeySaver 🗝️

AI-powered key identification and management app for Android.

Photograph any key → Claude Vision AI identifies the type, keyway, and bitting code → Save and organize your keys.

## Project Structure

```
Keysaver/
├── mobile/          # React Native (Expo) Android app
└── web/             # Next.js landing page + API backend
```

## Quick Start

### Web / API (Vercel)

```bash
cd web
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Deploy to Vercel:
```bash
vercel --prod
# Set ANTHROPIC_API_KEY in Vercel environment variables
```

### Mobile App (Expo)

```bash
cd mobile
npm install
npx expo start
```

Build APK with EAS Build:
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

## Features

- 📷 Camera capture + photo library selection
- 🤖 Claude Vision AI key analysis
- 📊 Bitting code identification with visual chart
- ⚙️ Keyway profile identification
- 💾 Local device storage (no cloud account needed)
- 🔍 Search and filter saved keys

## Configuration

After deploying the web app to Vercel, update the `apiBaseUrl` in the mobile app's Settings screen to point to your Vercel deployment URL.

## Building the APK

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Build preview APK: `eas build --platform android --profile preview`
4. Upload the resulting APK to a GitHub Release on this repo

The landing page automatically fetches the latest APK from GitHub Releases.

## Disclaimer

KeySaver is intended for managing your own keys only. Bitting analysis accuracy depends on image quality and angle. Always verify with a licensed locksmith for critical security applications.
