// src/services/compareList.js
//
// The student's compare selection (up to 3 universities), shared by Saved
// Universities, Compare Universities, Smart Match and the university page,
// so a university added on one screen is still selected on the next.
// Kept in memory for the session, like the web keeps it per page.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { getCountry, getUniName } from '../utils/rankingsUtils';
import { identityKey } from './universitySearch';

// Same university from QS, THE or ARWU counts as one.
const keyOf = (university) => identityKey(getUniName(university), getCountry(university));

export const MAX_COMPARE = 3;

let items = [];
const listeners = new Set();

function publish(next) {
  items = next;
  listeners.forEach((listener) => listener(next));
}

export function useCompareList() {
  const [list, setList] = useState(items);

  useEffect(() => {
    listeners.add(setList);
    setList(items);
    return () => listeners.delete(setList);
  }, []);

  const keys = useMemo(() => new Set(list.map(keyOf)), [list]);
  const isCompared = useCallback((university) => keys.has(keyOf(university)), [keys]);

  const add = useCallback((university) => {
    const key = keyOf(university);
    if (items.some((item) => keyOf(item) === key)) return true;
    if (items.length >= MAX_COMPARE) {
      Alert.alert('Compare is full', `You can compare up to ${MAX_COMPARE} universities. Remove one first.`);
      return false;
    }
    publish([...items, university]);
    return true;
  }, []);

  const remove = useCallback((university) => {
    const key = keyOf(university);
    publish(items.filter((item) => keyOf(item) !== key));
  }, []);

  const toggle = useCallback(
    (university) => (keys.has(keyOf(university)) ? (remove(university), false) : add(university)),
    [add, keys, remove]
  );

  const clear = useCallback(() => publish([]), []);

  return useMemo(
    () => ({ items: list, isCompared, add, remove, toggle, clear, full: list.length >= MAX_COMPARE }),
    [list, isCompared, add, remove, toggle, clear]
  );
}
