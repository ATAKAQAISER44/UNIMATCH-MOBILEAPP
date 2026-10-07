// src/components/UniversityLink.js
//
// A university name that opens the university's introduction page
// (UniversityScreen) when tapped. Used wherever a university name is shown,
// for students and researchers alike.

import React, { useCallback } from 'react';
import { Text } from './AppText';
import { useNavigation } from '@react-navigation/native';

import { authTheme } from '../styles/authTheme';

export const UNIVERSITY_ROUTE = 'University';

// Only small, serialisable values go into route params. currentRank / score
// (with scoreLabel) come from a results list (My Ranking, Smart Match) and
// show as "Selected result" on the university page.
export function universityParams({ name, country, dataset, rank, currentRank, score, scoreLabel } = {}) {
  const clean = (value) =>
    value === null || value === undefined || value === '' ? undefined : String(value);

  return {
    name: clean(name) || 'University',
    country: clean(country),
    dataset: clean(dataset),
    rank: clean(rank),
    currentRank: clean(currentRank),
    score: clean(score),
    scoreLabel: clean(scoreLabel),
  };
}

export function useOpenUniversity() {
  const navigation = useNavigation();

  return useCallback(
    (details) => {
      if (!details?.name) return;
      navigation.push(UNIVERSITY_ROUTE, universityParams(details));
    },
    [navigation]
  );
}

export default function UniversityLink({
  name,
  country,
  dataset,
  rank,
  currentRank,
  score,
  scoreLabel,
  style,
  numberOfLines,
  onBeforeOpen,
}) {
  const openUniversity = useOpenUniversity();

  const handlePress = () => {
    onBeforeOpen?.();
    openUniversity({ name, country, dataset, rank, currentRank, score, scoreLabel });
  };

  return (
    <Text
      style={[style, { color: authTheme.colors.brandTeal }]}
      numberOfLines={numberOfLines}
      onPress={handlePress}
      suppressHighlighting
      accessibilityRole="link"
      accessibilityHint="Opens the university's page"
    >
      {name}
    </Text>
  );
}
