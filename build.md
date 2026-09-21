# Android Build & APK Generation Guide — Hindustan Electricals Mobile

This document outlines the step-by-step procedures for building and generating installable Android APKs and Google Play bundles for the **Hindustan Electricals Winding Works** mobile application.

---

## 1. Prerequisites & Environment Configuration

### Backend URL Configuration
Ensure your environment variables are configured before creating a build. In `.env`:
```ini
EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP_OR_DOMAIN>:5000/api/v1
```
> **Note**: Devices cannot connect to `localhost`. Use your computer's local Wi-Fi IP (e.g. `http://192.168.1.15:5000/api/v1`) or production backend URL.

### Pre-Build Quality Verification
Always run typecheck and lint before starting a build:
```bash
# Typecheck
npx tsc --noEmit

# Lint
npm run lint
```

---

## 2. Option A: EAS Cloud Build (Recommended)

EAS Build compiles the app on Expo's cloud infrastructure and delivers a direct `.apk` download link and QR code to install on Android devices.

### Step 1: Install EAS CLI & Authenticate
```bash
npx eas-cli login
```

### Step 2: Initialize Project (One-time Setup)
Link your project to your Expo account:
```bash
npx eas-cli init
```

### Step 3: Generate Standalone APK
To generate an installable `.apk` for workshop technicians:
```bash
npx eas-cli build -p android --profile preview
```

### Step 4: Generate Production Bundle (Google Play Store)
To generate an `.aab` file for publishing to Google Play Console:
```bash
npx eas-cli build -p android --profile production
```

---

## 3. Configuration Details (`eas.json`)

The project's [eas.json](file:///s:/client-projects/Hindustan-Electricals/hindustan-motor-mobile/eas.json) defines the build profiles:

```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

- **`preview`**: Configured with `"buildType": "apk"` to produce standalone APK files.
- **`production`**: Configured with `"buildType": "apk"` for direct distribution (can be changed to `"app-bundle"` when deploying to the Google Play Store).

---

## 4. Option B: Local Gradle Build (Without Cloud)

If you have Android Studio, Android SDK, and Java JDK installed on your machine:

### Step 1: Generate Native Android Directory
```bash
npx expo prebuild --platform android
```

### Step 2: Build the Release APK
```bash
# Windows PowerShell
cd android
./gradlew assembleRelease
```

### Step 3: Locate the Output APK
The generated release APK will be located at:
```text
android/app/build/outputs/apk/release/app-release.apk
```

---

## 5. Important Settings in `app.json`

- **Package Name**: `com.hindustanelectricals.motorapp`
- **Cleartext Traffic**: `"usesCleartextTraffic": true` (Allows communicating with HTTP development server endpoints over local LAN).
- **Icons & Splash**: Configured in `./assets/images/`.
