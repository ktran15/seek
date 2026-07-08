import type { ExpoConfig } from 'expo/config';

// app-name.json is the single source of truth for the app name (spec §1:
// renaming touches exactly one place). src/config re-exports it for app code;
// this file can't import TS modules, hence JSON.
import { appName } from './app-name.json';

const expoConfig: ExpoConfig = {
  name: appName,
  slug: 'seek',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: appName.toLowerCase(),
  userInterfaceStyle: 'light',
  ios: {
    icon: './assets/expo.icon',
    supportsTablet: false,
    bundleIdentifier: 'com.smokeysummit.seek',
    usesAppleSignIn: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#F5ECE3',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    'expo-video',
    [
      'expo-camera',
      {
        cameraPermission:
          'Seek uses the camera to capture proof of your daily challenge.',
        microphonePermission:
          'Seek records audio with your challenge videos.',
        recordAudioAndroid: true,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Seek needs your photo library to upload challenge proof like screenshots and selfies.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F5ECE3',
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
      },
    ],
  ],
  extra: {
    eas: {
      // FOUNDER-SET (eas init, 2026-07-08): the EAS project id — an
      // identifier, not a secret. Remote push tokens (getExpoPushTokenAsync)
      // need it; without a dev build it stays a silent no-op and local
      // notifications still work.
      projectId: 'b37bbe6b-57bf-46bd-9f6b-e8a1839b7416',
    },
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default expoConfig;
