// src/screens/UniversityScreen.js
//
// University introduction page. Opens when a university name is tapped
// anywhere in the app. Shows where the university stands in QS, THE and
// ARWU (latest edition and history) and its key facts (fees, scholarships,
// admission, ...). Data comes from the existing researcher endpoints:
// /researcher/university-journey and /researcher/attributes.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bottomPadding } from '../utils/safeArea';
import { topBarPadding } from '../utils/safeArea';

import { Card, ErrorBox, LoadingBlock, SectionHeading } from '../components/researcher/ResearcherUI';
import { researcherStyles as styles } from '../styles/researcherStyles';
import { authTheme } from '../styles/authTheme';
import { fetchUniversityAttributes, fetchUniversityJourney } from '../services/researcherApi';

const DATASETS = [
  { key: 'qs', label: 'QS', color: '#008C8C' },
  { key: 'the', label: 'THE', color: '#55B947' },
  { key: 'arwu', label: 'ARWU', color: '#F59E0B' },
];

const FACTS = [
  { key: 'tuition_fee_international', label: 'Tuition (international)' },
  { key: 'tuition_fee_local', label: 'Tuition (local)' },
  { key: 'living_cost', label: 'Living cost' },
  { key: 'scholarship', label: 'Scholarship' },
  { key: 'cgpa_requirement', label: 'Minimum CGPA' },
  { key: 'acceptance_rate', label: 'Acceptance rate' },
  { key: 'employability_rate', label: 'Employability' },
  { key: 'internship', label: 'Internships' },
  { key: 'part_time_job', label: 'Part-time work' },
  { key: 'language', label: 'Teaching language' },
  { key: 'public_private', label: 'Type' },
  { key: 'degree_level', label: 'Degree levels' },
  { key: 'gender_equality', label: 'Gender ratio' },
];

function hasValue(value) {
  if (value === null || value === undefined) return false;
  const text = String(value).trim();
  return text !== '' && text.toLowerCase() !== 'nan' && text.toLowerCase() !== 'n/a';
}

function UniversityTopBar({ onBack }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={authTheme.gradients.button}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.topBar, topBarPadding(insets)]}
    >
      <StatusBar barStyle="light-content" />
      <TouchableOpacity style={styles.topButton} activeOpacity={0.82} onPress={onBack} accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.brandRow}>
        <Text style={styles.navBrand}>University</Text>
      </View>
      <View style={{ width: 34, height: 34 }} />
    </LinearGradient>
  );
}

// Latest ranked edition and best rank for one ranking system.
export function summariseDataset(points = []) {
  const ranked = points.filter((point) => Number.isFinite(point?.rank));
  if (!ranked.length) return null;

  const latest = ranked.reduce((a, b) => (b.year > a.year ? b : a));
  const best = ranked.reduce((a, b) => (b.rank < a.rank ? b : a));
  const previous = ranked.filter((point) => point.year < latest.year).sort((a, b) => b.year - a.year)[0];

  return {
    latest,
    best,
    // Positive = moved up since the previous edition.
    change: previous ? previous.rank - latest.rank : null,
    history: [...ranked].sort((a, b) => b.year - a.year),
  };
}

function RankCard({ dataset, summary, highlight }) {
  const [open, setOpen] = useState(false);
  const { latest, best, change, history } = summary;

  return (
    <View style={[styles.rowCard, highlight && styles.rowCardActive]}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen((value) => !value)} disabled={history.length < 2}>
        <View style={styles.rowTop}>
          <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: dataset.color, marginRight: 8 }} />
          <Text style={[styles.rowName, styles.flex1]}>
            {dataset.label} {latest.year}
          </Text>
          <Text style={[styles.rowScore, { fontSize: 16 }]}>#{latest.rank}</Text>
        </View>

        <View style={[styles.rowBetween, { marginTop: 6 }]}>
          <Text style={styles.rowSub}>
            Best: #{best.rank} ({best.year})
            {change ? `  ·  ${change > 0 ? '▲' : '▼'} ${Math.abs(change)} since last edition` : ''}
          </Text>
          {history.length > 1 && <Text style={styles.expandText}>{open ? 'Hide' : 'History'}</Text>}
        </View>
      </TouchableOpacity>

      {open &&
        history.map((point) => (
          <View key={point.year} style={[styles.rowBetween, { paddingVertical: 3 }]}>
            <Text style={styles.mutedText}>{point.year}</Text>
            <Text style={[styles.kvValue, { marginTop: 0 }]}>#{point.rank}</Text>
          </View>
        ))}
    </View>
  );
}

export default function UniversityScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const params = route?.params || {};
  const name = params.name || 'University';
  const [journey, setJourney] = useState(null);
  const [attributes, setAttributes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      // Both lookups run together; a university can have one without the other.
      const [journeyResult, attributeResult] = await Promise.allSettled([
        fetchUniversityJourney(name),
        fetchUniversityAttributes(name, params.country),
      ]);

      if (!active) return;

      const nextJourney = journeyResult.status === 'fulfilled' ? journeyResult.value : null;
      const nextAttributes = attributeResult.status === 'fulfilled' ? attributeResult.value : null;

      setJourney(nextJourney);
      setAttributes(nextAttributes);

      // A 404 just means "not in the rankings"; anything else is a real error.
      const journeyError = journeyResult.status === 'rejected' ? journeyResult.reason?.message || '' : '';
      if (!nextJourney && !nextAttributes && journeyError && !/not found/i.test(journeyError)) {
        setError(journeyError);
      }

      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [name, params.country, reloadKey]);

  const rankSummaries = useMemo(
    () =>
      DATASETS.map((dataset) => ({
        dataset,
        summary: summariseDataset(journey?.datasets?.[dataset.key]),
      })).filter((item) => item.summary),
    [journey]
  );

  const facts = useMemo(
    () => FACTS.filter((fact) => hasValue(attributes?.[fact.key])).map((fact) => ({ ...fact, value: String(attributes[fact.key]) })),
    [attributes]
  );

  const country = journey?.country || params.country;
  const region = hasValue(attributes?.region) ? attributes.region : '';
  const location = [country, region].filter(Boolean).join(' · ');

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Dashboard');
  }, [navigation]);

  const contextLine = [
    params.dataset ? String(params.dataset).toUpperCase() : '',
    params.rank ? `#${String(params.rank).replace(/^#/, '')}` : '',
    params.score ? `score ${params.score}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.screen}>
      <UniversityTopBar onBack={goBack} />

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, bottomPadding(insets, 32)]} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{journey?.name || name}</Text>
          {!!location && <Text style={styles.heroSubtitle}>📍 {location}</Text>}
          {!!contextLine && (
            <View style={[styles.pill, { marginTop: 8, borderColor: authTheme.colors.brandBorder, backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.pillText, { color: authTheme.colors.brandTeal }]}>{contextLine}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <Card>
            <LoadingBlock />
          </Card>
        ) : error ? (
          <ErrorBox message={error} onRetry={() => setReloadKey((value) => value + 1)} />
        ) : (
          <>
            <Card>
              <SectionHeading title="World rankings" />
              {rankSummaries.length === 0 ? (
                <Text style={styles.mutedText}>Not listed in QS, THE or ARWU.</Text>
              ) : (
                rankSummaries.map(({ dataset, summary }) => (
                  <RankCard
                    key={dataset.key}
                    dataset={dataset}
                    summary={summary}
                    highlight={String(params.dataset || '').toLowerCase() === dataset.key}
                  />
                ))
              )}
            </Card>

            <Card>
              <SectionHeading title="Key facts" />
              {facts.length === 0 ? (
                <Text style={styles.mutedText}>No fee or admission details on file yet.</Text>
              ) : (
                <View style={[styles.kvGrid, { marginTop: 0 }]}>
                  {facts.map((fact) => (
                    <View key={fact.key} style={styles.kvItem}>
                      <Text style={styles.kvLabel}>{fact.label}</Text>
                      <Text style={styles.kvValue} numberOfLines={4}>
                        {fact.value}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}
