// src/screens/researcher/ResearcherStatisticsScreen.js
//
// Researcher Statistical Summary (web: ResearcherStatisticsPage). Two views:
// "Summary" (mean / median / missing per indicator, in plain words) and
// "Relationships" (correlation heatmap).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import ResearcherLayout from '../../components/researcher/ResearcherLayout';
import CorrelationHeatmap from '../../components/researcher/CorrelationHeatmap';
import {
  Card,
  CollapsibleCard,
  DatasetYearBar,
  EmptyState,
  ErrorBox,
  FindingCards,
  GradientButton,
  LoadingBlock,
  PageHeader,
  ProgressBar,
  SectionHeading,
  SegmentedControl,
  SelectField,
  StatGrid,
  useLatestRequest,
  usePersistentToggle,
} from '../../components/researcher/ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import {
  RESEARCHER_DATASETS,
  officialMetricLabel,
  resolveDatasetKey,
  resolveYear,
} from '../../constants/researcherConstants';
import { fetchResearcherStatistics } from '../../services/researcherApi';
import { shareCSV } from '../../utils/researcherExport';
import { HIGH_MISSING_PCT, buildSummaryFindings, interpretRow } from '../../utils/researchInsights';

const VIEWS = [
  { value: 'summary', label: 'Summary', hint: 'average, middle, missing' },
  { value: 'relationships', label: 'Relationships', hint: 'which go together' },
];

function MissingBar({ missing, pct }) {
  const share = pct ?? 0;
  const high = share > HIGH_MISSING_PCT;

  return (
    <View>
      <Text style={[styles.kvValue, high && { color: '#D97706' }]}>
        {missing} <Text style={styles.kvLabel}>({share}%)</Text>
      </Text>
      <ProgressBar share={share} color={high ? '#F59E0B' : authTheme.colors.brandTeal} height={5} style={{ marginTop: 4 }} />
    </View>
  );
}

// Min-to-max track with the median (line) and mean (dot) placed on it.
function SpreadBar({ row }) {
  const { min, max, mean, median } = row;
  if (min == null || max == null || max === min) return null;

  const position = (value) => `${((value - min) / (max - min)) * 100}%`;

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.kvLabel}>Score range ( | = middle value   ● = average )</Text>
      <View style={{ height: 18, justifyContent: 'center', marginTop: 4, marginHorizontal: 6 }}>
        <View style={{ height: 8, borderRadius: 999, backgroundColor: '#CDEFE4' }} />
        {median != null && (
          <View
            style={{
              position: 'absolute',
              left: position(median),
              width: 3,
              height: 18,
              marginLeft: -1.5,
              backgroundColor: authTheme.colors.brandTeal,
            }}
          />
        )}
        {mean != null && (
          <View
            style={{
              position: 'absolute',
              left: position(mean),
              width: 12,
              height: 12,
              marginLeft: -6,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: '#FFFFFF',
              backgroundColor: '#F59E0B',
            }}
          />
        )}
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.kvLabel}>{min}</Text>
        <Text style={styles.kvLabel}>{max}</Text>
      </View>
    </View>
  );
}

function IndicatorCard({ row }) {
  const meaning = interpretRow(row);
  const items = [
    ['Average (mean)', row.mean],
    ['Middle value (median)', row.median],
    ['Lowest (min)', row.min],
    ['Highest (max)', row.max],
    ['Spread (std dev)', row.std],
  ];

  return (
    <View style={[styles.rowCard, row.isOverall && styles.rowCardActive]}>
      <View style={styles.rowBetween}>
        <Text style={[styles.rowName, styles.flex1]}>{row.label}</Text>
        <Text style={styles.rowScoreLabel}>{row.available} have a score</Text>
      </View>

      <View style={{ marginTop: 8 }}>
        <Text style={styles.kvLabel}>No score (value not published)</Text>
        <MissingBar missing={row.missing} pct={row.missing_pct} />
      </View>

      {row.available > 0 ? (
        <>
          <View style={styles.kvGrid}>
            {items.map(([label, value], index) => (
              <View key={label} style={styles.kvItem}>
                <Text style={styles.kvLabel}>{label}</Text>
                <Text style={[styles.kvValue, index === 0 && { color: authTheme.colors.brandTeal }]}>
                  {value ?? 'N/A'}
                </Text>
                {label.startsWith('Highest') && row.max_university ? (
                  <Text style={styles.kvLabel} numberOfLines={2}>
                    {row.max_university}
                  </Text>
                ) : null}
                {label.startsWith('Lowest') && row.min_university ? (
                  <Text style={styles.kvLabel} numberOfLines={2}>
                    {row.min_university}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
          <SpreadBar row={row} />
        </>
      ) : null}

      <Text
        style={[
          styles.bodyText,
          { marginTop: 9, fontSize: 12 },
          meaning.tone === 'warning' && { color: '#B45309', fontWeight: '700' },
          meaning.tone === 'muted' && { color: '#94A3B8' },
        ]}
      >
        {meaning.text}
      </Text>
    </View>
  );
}

const EXAMPLE_SCORES = [
  ['University A', 10],
  ['University B', 20],
  ['University C', 30],
  ['University D', 40],
  ['University E', 100],
  ['University F', null],
];

const TERMS = [
  ['Have a score = 5', 'Universities A to E were given a score.'],
  [
    'No score = 1',
    'University F was not given a score. When many are missing, the numbers describe only part of the universities.',
  ],
  ['Average (mean) = 40', 'Add all scores and divide by how many: (10 + 20 + 30 + 40 + 100) ÷ 5 = 40.'],
  ['Middle value (median) = 30', 'Sort the scores: 10, 20, 30, 40, 100. The one in the middle is 30.'],
  ['Lowest = 10, Highest = 100', 'The smallest and the biggest score.'],
  [
    'Spread (standard deviation)',
    'How different the scores are. Small = universities score close to each other. Big = large differences.',
  ],
];

function HowToRead() {
  const [open, toggle] = usePersistentToggle('researcher-statistics-how-to-read-open');

  return (
    <CollapsibleCard eyebrow="New to statistics?" title="How to read this page" open={open} onToggle={toggle}>
      <Text style={[styles.mutedText, { marginBottom: 6 }]}>Example: the research score of 6 universities</Text>
      <View style={[styles.table, { marginBottom: 10 }]}>
        {EXAMPLE_SCORES.map(([name, score], index) => (
          <View key={name} style={[styles.rowBetween, { paddingHorizontal: 10, paddingVertical: 6, borderTopWidth: index ? 1 : 0, borderTopColor: '#E8F3EE', backgroundColor: '#FFFFFF' }]}>
            <Text style={styles.tableCellText}>{name}</Text>
            <Text style={[styles.tableCellText, { fontWeight: '900', color: score == null ? '#94A3B8' : authTheme.colors.gray900 }]}>
              {score ?? 'no score'}
            </Text>
          </View>
        ))}
      </View>

      {TERMS.map(([name, text]) => (
        <View key={name} style={[styles.finding, { borderColor: authTheme.colors.brandBorder, backgroundColor: '#F3FBF8' }]}>
          <Text style={styles.findingTitle}>{name}</Text>
          <Text style={styles.findingText}>{text}</Text>
        </View>
      ))}

      <View style={[styles.finding, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB', marginBottom: 0 }]}>
        <Text style={styles.findingTitle}>Why compare the average with the middle value?</Text>
        <Text style={styles.findingText}>
          Here the average (40) is higher than the middle value (30) because one university (E = 100) scores far
          above the rest. So on this page: when the average is clearly above the middle value, a few top
          universities are far ahead and most universities score lower.
        </Text>
      </View>
    </CollapsibleCard>
  );
}

export default function ResearcherStatisticsScreen({ navigation, route }) {
  const params = route.params || {};
  const datasetKey = resolveDatasetKey(params.dataset);
  const datasetInfo = RESEARCHER_DATASETS[datasetKey];
  const analysisView = params.view === 'relationships' ? 'relationships' : 'summary';

  const year = resolveYear(params.year, datasetKey);
  const [availableYears, setAvailableYears] = useState([datasetInfo.defaultYear]);
  const [country, setCountry] = useState('All');
  const [countries, setCountries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const startRequest = useLatestRequest();

  useEffect(() => {
    setCountry('All');
  }, [datasetKey, year]);

  useEffect(() => {
    const isCurrent = startRequest();

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await fetchResearcherStatistics(datasetKey, { year, country });
        if (!isCurrent()) return;
        setStats(data);
        setCountries(data.countries || []);
        setAvailableYears(data.available_years || [data.year]);
      } catch (loadError) {
        if (!isCurrent()) return;
        setStats(null);
        setError(loadError.message);
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    load();
  }, [datasetKey, year, country, reloadKey, startRequest]);

  const rows = useMemo(() => {
    if (!stats) return [];
    const list = stats.indicators.map((item) => ({ ...item, label: officialMetricLabel(datasetKey, item.key) }));
    if (stats.overall) list.push({ ...stats.overall, label: 'Overall Score', isOverall: true });
    return list;
  }, [stats, datasetKey]);

  const indicatorsWithMissing = rows.filter((row) => !row.isOverall && row.missing > 0).length;
  const keyFindings = useMemo(() => buildSummaryFindings(rows, stats?.total_universities ?? 0), [rows, stats]);

  const labelFor = useCallback(
    (key) => (key === stats?.overall?.key ? 'Overall Score' : officialMetricLabel(datasetKey, key)),
    [stats, datasetKey]
  );

  const countryOptions = useMemo(
    () => [{ value: 'All', label: 'All Countries' }, ...countries.map((item) => ({ value: item, label: item }))],
    [countries]
  );

  const changeDataset = (nextDataset) => {
    if (nextDataset === datasetKey) return;
    navigation.setParams({ dataset: nextDataset, year: RESEARCHER_DATASETS[nextDataset].defaultYear });
  };

  const changeYear = (nextYear) => {
    navigation.setParams({ year: Number(nextYear) });
  };

  const countryPart = country === 'All' ? 'all-countries' : country.toLowerCase().replace(/\s+/g, '-');

  const exportStatistics = () => {
    if (analysisView === 'relationships') {
      const { keys = [], matrix = [] } = stats?.correlation || {};
      shareCSV(
        ['Indicator', ...keys.map(labelFor)],
        keys.map((key, i) => [labelFor(key), ...matrix[i].map((value) => value ?? '')]),
        `correlation-${datasetKey}-${year}-${countryPart}.csv`
      );
      return;
    }

    const headers = [
      'Indicator',
      'Available',
      'Missing',
      'Missing %',
      'Mean',
      'Median',
      'Min',
      'Max',
      'Std Dev',
      'Lowest University',
      'Highest University',
      'What This Means',
    ];

    const dataRows = rows.map((row) => [
      row.label,
      row.available,
      row.missing,
      row.missing_pct ?? '',
      row.mean ?? '',
      row.median ?? '',
      row.min ?? '',
      row.max ?? '',
      row.std ?? '',
      row.min_university ?? '',
      row.max_university ?? '',
      interpretRow(row).text,
    ]);

    shareCSV(headers, dataRows, `statistics-${datasetKey}-${year}-${countryPart}.csv`);
  };

  return (
    <ResearcherLayout
      navigation={navigation}
      activeKey={analysisView === 'relationships' ? 'relationships' : 'statistics'}
      context={{ dataset: datasetKey, year }}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        setReloadKey((value) => value + 1);
      }}
    >
      <PageHeader
        eyebrow="Researcher Statistical Summary"
        title={`${datasetInfo.title} ${year}`}
        subtitle="Summary of every ranking indicator, and which indicators go up and down together."
      />

      <DatasetYearBar
        datasetKey={datasetKey}
        onDatasetChange={changeDataset}
        year={year}
        years={availableYears}
        onYearChange={changeYear}
      />

      <Card>
        <SelectField label="Country" title="Country" value={country} options={countryOptions} onChange={setCountry} />
        <Text style={[styles.mutedText, { marginVertical: 8 }]}>
          Pick a country to see the summary for its universities only. All numbers use the scores exactly as the
          ranking published them.
        </Text>
        <GradientButton title="Export CSV" icon="▧" onPress={exportStatistics} disabled={!rows.length} />
      </Card>

      <SegmentedControl
        options={VIEWS}
        value={analysisView}
        onChange={(view) => navigation.setParams({ view })}
      />

      <ErrorBox message={error} onRetry={() => setReloadKey((value) => value + 1)} />

      {analysisView === 'relationships' ? (
        error ? null : loading || !stats ? (
          <Card>
            <LoadingBlock text="Calculating relationships..." />
          </Card>
        ) : (
          <CorrelationHeatmap
            key={`${datasetKey}-${year}-${country}`}
            correlation={stats.correlation}
            labelFor={labelFor}
            overallKey={stats.overall?.key}
            totalUniversities={stats.total_universities}
          />
        )
      ) : (
        <>
          <StatGrid
            items={[
              { label: 'Universities', hint: 'in this selection', value: stats?.total_universities ?? '-' },
              { label: 'Indicators', hint: 'scores the ranking is built from', value: stats?.indicators?.length ?? '-' },
              { label: 'Indicators with gaps', hint: 'some universities have no score', value: stats ? indicatorsWithMissing : '-' },
              {
                label: 'Exact overall scores',
                hint: 'the rest are missing or a range',
                value: stats?.overall ? `${stats.overall.available} / ${stats.overall.total}` : '-',
              },
            ]}
          />

          <HowToRead />

          {!loading && !error && keyFindings.length > 0 && (
            <Card>
              <SectionHeading
                eyebrow="Key findings"
                title={`What stands out in ${datasetInfo.shortName} ${year}${country !== 'All' ? ` — ${country}` : ''}`}
              />
              <FindingCards findings={keyFindings} />
            </Card>
          )}

          <Card>
            <SectionHeading
              eyebrow="Indicator by indicator"
              title="Summary of every score"
              subtitle="Each card is one indicator. The last line explains its numbers in plain words."
            />

            {loading ? (
              <LoadingBlock text="Calculating statistics..." />
            ) : rows.length === 0 ? (
              !error && <EmptyState text="No universities found." />
            ) : (
              rows.map((row) => <IndicatorCard key={row.key} row={row} />)
            )}

            <Text style={styles.noteText}>
              Orange = more than {HIGH_MISSING_PCT}% of universities have no score for that indicator.
            </Text>
          </Card>
        </>
      )}
    </ResearcherLayout>
  );
}
