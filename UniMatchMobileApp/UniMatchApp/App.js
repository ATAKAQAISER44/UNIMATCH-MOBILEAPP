// App.js

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Dimensions } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';

// Expo Go does not allow customizing the splash screen at runtime, so
// SplashScreen.setOptions() is only called in development/production builds.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  try {
    SplashScreen.setOptions({
      duration: 700,
      fade: true,
    });
  } catch (e) {
    // Ignore: splash options are a visual nicety, never block app start.
  }
}

// Tablets (shortest side 600pt or more) can rotate freely; phones stay in
// portrait, which is what every phone layout is designed for.
const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
const isTablet = Math.min(screenWidth, screenHeight) >= 600;

ScreenOrientation.lockAsync(
  isTablet
    ? ScreenOrientation.OrientationLock.DEFAULT
    : ScreenOrientation.OrientationLock.PORTRAIT_UP
).catch(() => {});

// Keep the native splash visible until the app is ready to render.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
