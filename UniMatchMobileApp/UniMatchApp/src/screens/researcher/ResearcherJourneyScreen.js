// src/screens/researcher/ResearcherJourneyScreen.js
//
// Researcher University Journey (web: ResearcherUniversityJourney). Search a
// university and see how its rank moved across QS, THE and ARWU editions.
// The line chart is drawn with plain Views (no extra chart library).

import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../components/AppText';

import ResearcherLayout from '../../components/researcher/ResearcherLayout';
import { useOpenUniversity } from '../../components/UniversityLink';
import {
  Card,
  EmptyState,
  ErrorBox,
  InlineLoader,
  LoadingBlock,
  OutlineButton,
  PageHeader,
  SearchInput,
  SectionHeading,
  useDebouncedValue,
  useLatestRequest,
} from '../../components/researcher/ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { fetchUniversityJourney, searchJourneyUniversities } from '../../services/researcherApi';
import { DATASET_ORDER, DATASET_STYLE, JourneyChart, Legend, useChartGeometry } from '../../components/RankJourneyChart';
import { shareCSV } from '../../utils/researcherExport';
import { RESEARCHER_ROUTES } from '../../constants/researcherConstants';

// Last journey shown, so coming back to this screen keeps it.
let lastJourney = null;

function normalName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export default function ResearcherJourneyScreen({ navigation, route }) {
  const requested = route?.params?.university;
  const [query, setQuery] = useState(lastJourney?.name || '');
  const [selectedName, setSelectedName] = useState(lastJourney?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [journey, setJourney] = useState(lastJourney);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartWidth, setChartWidth] = useState(0);

  const debouncedQuery = useDebouncedValue(query.trim());
  const openUniversity = useOpenUniversity();
  const startSearch = useLatestRequest();
  const startJourney = useLatestRequest();

  React.useEffect(() => {
    const isCurrent = startSearch();

    if (!debouncedQuery || debouncedQuery === selectedName) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    searchJourneyUniversities(debouncedQuery)
      .then((data) => isCurrent() && setSuggestions(data.results || []))
      .catch(() => isCurrent() && setSuggestions([]))
      .finally(() => isCurrent() && setSearchLoading(false));
  }, [debouncedQuery, selectedName, startSearch]);

  async function selectUniversity(item) {
    setQuery(item.name);
    setSelectedName(item.name);
    setSuggestions([]);

    const isCurrent = startJourney();
    setJourneyLoading(true);
    setError('');

    try {
      const data = await fetchUniversityJourney(item.key);
      if (isCurrent()) {
        lastJourney = data;
        setJourney(data);
      }
    } catch (loadError) {
      if (!isCurrent()) return;
      setJourney(null);
      setError(loadError.message);
    } finally {
      if (isCurrent()) setJourneyLoading(false);
    }
  }

  // Opened from Compare (or elsewhere) with a university already chosen.
  const requestedName = requested?.name;
  React.useEffect(() => {
    if (!requestedName) return;
    navigation.setParams({ university: undefined });
    if (normalName(requestedName) === normalName(lastJourney?.name)) return;
    setQuery(requestedName);
    setSelectedName(requestedName);
    setJourneyLoading(true);
    searchJourneyUniversities(requestedName)
      .then((data) => {
        const rows = data.results || [];
        const wanted = normalName(requestedName);
        const match = rows.find((row) => normalName(row.name) === wanted) || rows[0];
        if (match) selectUniversity(match);
        else {
          setJourneyLoading(false);
          setError('No ranking history found for this university.');
        }
      })
      .catch((loadError) => {
        setJourneyLoading(false);
        setError(loadError.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedName]);

  const geometry = useChartGeometry(journey?.datasets, chartWidth);
  const datasetsWithData = journey ? DATASET_ORDER.filter((key) => (journey.datasets[key] || []).length > 0) : [];
  const datasetsWithoutData = journey ? DATASET_ORDER.filter((key) => (journey.datasets[key] || []).length === 0) : [];
  const showSuggestions = !!query.trim() && query.trim() !== selectedName;

  function exportJourney() {
    const rows = [];
    DATASET_ORDER.forEach((key) => {
      (journey.datasets[key] || []).forEach((point) => {
        rows.push([DATASET_STYLE[key].label, point.year, point.rank ?? '', point.overall_score ?? '']);
      });
    });
    shareCSV(['Dataset', 'Year', 'Rank', 'Overall Score'], rows, `university-journey-${journey.key}.csv`);
  }

  return (
    <ResearcherLayout navigation={navigation} activeKey="journey">
      <PageHeader title="University Journey" subtitle="Rank over the years" />

      <Card>
        <SearchInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (text.trim() !== selectedName) setSelectedName('');
          }}
          placeholder="e.g. Massachusetts Institute of Technology"
        />

        {showSuggestions && (
          <View style={styles.suggestionBox}>
            {searchLoading || query.trim() !== debouncedQuery ? (
              <InlineLoader />
            ) : suggestions.length === 0 ? (
              <Text style={[styles.mutedText, { padding: 12 }]}>No university found.</Text>
            ) : (
              suggestions.map((item) => (
                <TouchableOpacity key={item.key} style={styles.suggestionRow} onPress={() => selectUniversity(item)}>
                  <View style={styles.flex1}>
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    {!!item.country && <Text style={styles.suggestionSub}>{item.country}</Text>}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <ErrorBox message={error} />

        {journeyLoading ? (
          <LoadingBlock />
        ) : !journey ? (
          !error && <EmptyState text="Search for a university to see its journey." />
        ) : (
          <View>
            <SectionHeading
              title={journey.name}
              subtitle={journey.country}
              right={<OutlineButton title="CSV" small onPress={exportJourney} />}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <OutlineButton
                title="University profile"
                small
                onPress={() => openUniversity({ name: journey.name, country: journey.country })}
              />
              <OutlineButton
                title="Add to Compare"
                small
                onPress={() =>
                  navigation.navigate(
                    RESEARCHER_ROUTES.compare,
                    { dataset: datasetsWithData[0] || 'qs', add: journey.name },
                    { pop: true }
                  )
                }
              />
            </View>
            <Legend />

            <View
              style={{ borderRadius: 16, borderWidth: 1, borderColor: authTheme.colors.brandBorder, backgroundColor: '#FFFFFF', paddingVertical: 6 }}
              onLayout={(event) => setChartWidth(Math.floor(event.nativeEvent.layout.width))}
            >
              {geometry ? (
                <JourneyChart journey={journey} geometry={geometry} />
              ) : chartWidth ? (
                <Text style={[styles.mutedText, { padding: 20, textAlign: 'center' }]}>
                  No ranked editions found for this university.
                </Text>
              ) : null}
            </View>

            {datasetsWithoutData.length > 0 && (
              <Text style={styles.noteText}>
                Not ranked in: {datasetsWithoutData.map((key) => DATASET_STYLE[key].label).join(', ')}.
              </Text>
            )}

            {datasetsWithData.map((key) => (
              <View key={key} style={[styles.rowCard, { marginTop: 10, marginBottom: 0 }]}>
                <View style={[styles.rowTop, { marginBottom: 6 }]}>
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: DATASET_STYLE[key].color, marginRight: 6 }} />
                  <Text style={styles.rowName}>{DATASET_STYLE[key].label}</Text>
                </View>
                <View style={[styles.rowBetween, { marginBottom: 3 }]}>
                  <Text style={[styles.kvLabel, styles.flex1]}>Year</Text>
                  <Text style={[styles.kvLabel, styles.flex1, { textAlign: 'center' }]}>Rank</Text>
                  <Text style={[styles.kvLabel, styles.flex1, { textAlign: 'right' }]}>Overall score</Text>
                </View>
                {journey.datasets[key].map((point) => (
                  <View key={point.year} style={[styles.rowBetween, { paddingVertical: 3 }]}>
                    <Text style={[styles.mutedText, styles.flex1]}>{point.year}</Text>
                    <Text style={[styles.kvValue, styles.flex1, { textAlign: 'center', marginTop: 0 }]}>
                      #{point.rank ?? 'N/A'}
                    </Text>
                    <Text style={[styles.mutedText, styles.flex1, { textAlign: 'right' }]}>
                      {point.overall_score !== null ? point.overall_score : 'N/A'}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </Card>
    </ResearcherLayout>
  );
}
