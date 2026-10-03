// src/utils/researcherExperiments.js
//
// Saved weight experiments (UC-R-03). The web app keeps them in the browser's
// localStorage; the mobile app keeps them on the phone with AsyncStorage,
// using the same key and the same experiment shape.

import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPERIMENTS_STORAGE_KEY = 'unimatch_researcher_experiments';

export async function loadSavedExperiments() {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(EXPERIMENTS_STORAGE_KEY)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function storeSavedExperiments(experiments) {
  try {
    await AsyncStorage.setItem(EXPERIMENTS_STORAGE_KEY, JSON.stringify(experiments));
    return true;
  } catch {
    return false;
  }
}

export function createExperimentId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
