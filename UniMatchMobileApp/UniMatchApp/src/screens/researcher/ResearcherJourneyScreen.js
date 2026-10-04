// src/screens/researcher/ResearcherJourneyScreen.js
//
// Researcher University Journey (web: ResearcherUniversityJourney). Search a
// university and see how its rank moved across QS, THE and ARWU editions.
// The line chart is drawn with plain Views (no extra chart library).

import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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
import { shareCSV } from '../../utils/researcherExport';

const DATASET_ORDER = ['qs', 'the', 'arwu'];
const DATASET_STYLE = {
  qs: { label: 'QS', color: '#008C8C' },
  the: { label: 'THE', color: '#55B947' },
  arwu: { label: 'ARWU', color: '#F59E0B' },
};

const CHART_HEIGHT = 230;
const PAD_LEFT = 44;
const PAD_RIGHT = 18;
const PAD_TOP = 22;
const PAD_BOTTOM = 30;

function useChartGeometry(datasets, width) {
  return useMemo(() => {
    if (!datasets || !width) return null;

    const allYears = new Set();
    const allRanks = [];

    Object.values(datasets).forEach((points) => {
      (points || []).forEach((point) => {
        if (point.rank === null || point.rank === undefined) return;
        allYears.add(point.year);
        allRanks.push(point.rank);
      });
    });

    if (!allYears.size || !allRanks.length) return null;

    const years = Array.from(allYears).sort((a, b) => a - b);
    const minRank = Math.min(...allRanks);
    const maxRank = Math.max(...allRanks);
    const rankPad = Math.max(1, Math.round((maxRank - minRank) * 0.2));
    const rankTop = Math.max(1, minRank - rankPad);
    const rankBottom = maxRank + rankPad;

    const plotWidth = width - PAD_LEFT - PAD_RIGHT;
    const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

    const xForYear = (year) =>
      years.length === 1 ? PAD_LEFT + plotWidth / 2 : PAD_LEFT + (years.indexOf(year) / (years.length - 1)) * plotWidth;
    const yForRank = (rank) => PAD_TOP + ((rank - rankTop) / (rankBottom - rankTop || 1)) * plotHeight;

    return { years, rankTop, rankBottom, xForYear, yForRank, plotHeight, width };
  }, [datasets, width]);
}

function Segment({ x1, y1, x2, y2, color }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  return (
    <View
      style={{
        position: 'absolute',
        left: (x1 + x2) / 2 - length / 2,
        top: (y1 + y2) / 2 - 1.25,
        width: length,
        height: 2.5,
        backgroundColor: color,
        transform: [{ rotate: `${angle}rad` }],
      }}
    />
  );
}

function JourneyChart({ journey, geometry }) {
  const { years, rankTop, rankBottom, xForYear, yForRank, plotHeight, width } = geometry;
  const gridValues = Array.from({ length: 5 }, (_, index) =>
    Math.round(rankTop + ((rankBottom - rankTop) * index) / 4)
  );

  return (
    <View style={{ width, height: CHART_HEIGHT }}>
      {gridValues.map((value, index) => (
        <View key={`${value}-${index}`} style={{ position: 'absolute', left: 0, right: 0, top: yForRank(value) - 7 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ width: PAD_LEFT - 6, textAlign: 'right', fontSize: 9.5, fontWeight: '700', color: '#64748B' }}>
              #{value}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0', marginLeft: 6, marginRight: PAD_RIGHT }} />
          </View>
        </View>
      ))}

      {years.map((year) => (
        <Text
          key={year}
          style={{
            position: 'absolute',
            top: PAD_TOP + plotHeight + 10,
            left: xForYear(year) - 20,
            width: 40,
            textAlign: 'center',
            fontSize: 10.5,
            fontWeight: '800',
            color: authTheme.colors.gray900,
          }}
        >
          {year}
        </Text>
      ))}

      {DATASET_ORDER.map((key) => {
        const points = (journey.datasets[key] || []).filter((point) => point.rank !== null && point.rank !== undefined);
        if (!points.length) return null;
        const color = DATASET_STYLE[key].color;

        return (
          <React.Fragment key={key}>
            {points.slice(1).map((point, index) => (
              <Segment
                key={`${key}-line-${point.year}`}
                x1={xForYear(points[index].year)}
                y1={yForRank(points[index].rank)}
                x2={xForYear(point.year)}
                y2={yForRank(point.rank)}
                color={color}
              />
            ))}
            {points.map((point) => (
              <React.Fragment key={`${key}-${point.year}`}>
                <View
                  style={{
                    position: 'absolute',
                    left: xForYear(point.year) - 5,
                    top: yForRank(point.rank) - 5,
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    borderWidth: 2.5,
                    borderColor: color,
                    backgroundColor: '#FFFFFF',
                  }}
                />
                <Text
                  style={{
                    position: 'absolute',
                    left: xForYear(point.year) - 22,
                    top: yForRank(point.rank) - 20,
                    width: 44,
                    textAlign: 'center',
                    fontSize: 9.5,
                    fontWeight: '900',
                    color,
                  }}
                >
                  #{point.rank}
                </Text>
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function Legend() {
  return (
    <View style={{ flexDirection: 'row', gap: 14, marginBottom: 8 }}>
      {DATASET_ORDER.map((key) => (
        <View key={key} style={styles.rowTop}>
          <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: DATASET_STYLE[key].color, marginRight: 5 }} />
          <Text style={[styles.kvValue, { marginTop: 0 }]}>{DATASET_STYLE[key].label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ResearcherJourneyScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [journey, setJourney] = useState(null);
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
      if (isCurrent()) setJourney(data);
    } catch (loadError) {
      if (!isCurrent()) return;
      setJourney(null);
      setError(loadError.message);
    } finally {
      if (isCurrent()) setJourneyLoading(false);
    }
  }

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
      <PageHeader title="University Journey" subtitle="How a university's rank moved across QS, THE and ARWU editions." />

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
            <OutlineButton
              title="University profile"
              small
              onPress={() => openUniversity({ name: journey.name, country: journey.country })}
              style={{ alignSelf: 'flex-start', marginBottom: 10 }}
            />
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
