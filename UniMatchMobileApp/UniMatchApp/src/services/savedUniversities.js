// src/services/savedUniversities.js
//
// Saved universities, kept on the phone (the web keeps them in the browser).
// Shared by Rankings, Smart Match, the university page, Saved Universities,
// Compare Universities and My Shortlist. Uses the same storage key the
// Rankings screen has always used, so existing saves are kept.

import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { SAVED_UNIVERSITIES_KEY } from '../constants/myRankingConstants';
import { getCountry, getUniName } from '../utils/rankingsUtils';
import { identityKey } from './universitySearch';

// Same university saved from QS, THE or ARWU counts as one.
const keyOf = (university) => identityKey(getUniName(university), getCountry(university));

const listeners = new Set();

export async function readSavedUniversities() {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(SAVED_UNIVERSITIES_KEY)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeSavedUniversities(items) {
  await AsyncStorage.setItem(SAVED_UNIVERSITIES_KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener(items));
}

// Keep what a later screen needs (name, country, ranks, dataset, raw fields).
export function toSavedItem(university, dataset) {
  const raw = university?.raw && typeof university.raw === 'object' ? university.raw : university || {};
  return {
    ...university,
    name: getUniName(university),
    country: getCountry(university),
    dataset: university?.dataset || university?.source_dataset || dataset || undefined,
    raw,
  };
}

export function useSavedUniversities() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    readSavedUniversities().then((list) => {
      setItems(list);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    listeners.add(setItems);
    return () => listeners.delete(setItems);
  }, []);

  useFocusEffect(reload);

  const keys = useMemo(() => new Set(items.map(keyOf)), [items]);
  const isSaved = useCallback((university) => keys.has(keyOf(university)), [keys]);

  const toggle = useCallback(async (university, dataset) => {
    const current = await readSavedUniversities();
    const key = keyOf(university);
    const exists = current.some((item) => keyOf(item) === key);
    const next = exists ? current.filter((item) => keyOf(item) !== key) : [...current, toSavedItem(university, dataset)];
    await writeSavedUniversities(next);
    return !exists;
  }, []);

  const remove = useCallback(async (university) => {
    const key = keyOf(university);
    const current = await readSavedUniversities();
    await writeSavedUniversities(current.filter((item) => keyOf(item) !== key));
  }, []);

  const clear = useCallback(() => writeSavedUniversities([]), []);

  // One object per change, so screens can list it in hook dependencies.
  return useMemo(
    () => ({ items, loaded, isSaved, toggle, remove, clear, reload }),
    [items, loaded, isSaved, toggle, remove, clear, reload]
  );
}
