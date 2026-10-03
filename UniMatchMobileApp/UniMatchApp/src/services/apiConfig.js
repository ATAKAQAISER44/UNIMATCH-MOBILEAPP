// src/services/apiConfig.js
//
// Works out where the FastAPI backend is, so you no longer have to edit a
// hard-coded IP every time your Wi-Fi network changes.
//
// Order of priority:
//   1. EXPO_PUBLIC_API_BASE_URL in a .env file (manual override), e.g.
//        EXPO_PUBLIC_API_BASE_URL=http://192.168.1.8:8000
//   2. The laptop IP that Expo itself is using (the "exp://192.168.x.x:8081"
//      address shown under the QR code). The backend runs on the same laptop,
//      so we reuse that IP with port 8000.
//   3. Android emulator / simulator fallbacks.

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = 8000;

function stripTrailingSlash(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function getExpoHostIp() {
  // e.g. "192.168.131.162:8081"
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.expoGoConfig?.debuggerHost ||
    Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants?.manifest?.debuggerHost ||
    '';

  const host = String(hostUri).split(':')[0];

  // Tunnel mode gives a public *.exp.direct host that cannot reach your
  // local backend, so ignore it and fall through to the manual setting.
  if (!host || host.includes('exp.direct') || host.includes('ngrok')) {
    return null;
  }

  return host;
}

function resolveApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (fromEnv) {
    return stripTrailingSlash(fromEnv);
  }

  const expoHostIp = getExpoHostIp();

  if (expoHostIp) {
    return `http://${expoHostIp}:${BACKEND_PORT}`;
  }

  if (Platform.OS === 'android') {
    // Android emulator's alias for the laptop's localhost.
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  return `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

if (__DEV__) {
  console.log(`[API] Backend URL: ${API_BASE_URL}`);
}
