// src/screens/researcher/ResearcherDatasetComparisonScreen.js
//
// Researcher Dataset Comparison (web: ResearcherDatasetComparison). Three
// columns do not fit on a phone, so the screen shows:
//   1. a "position in each ranking" strip for the searched university, and
//   2. one dataset list at a time (QS / THE / ARWU tabs), each with its own
//      edition selector and pages through every university.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import ResearcherLayout from '../../components/researcher/ResearcherLayout';
import UniversityLink from '../../components/UniversityLink';
import {
  Card,
  CollapsibleCard,
  EmptyState,
  ErrorBox,
  GradientButton,
  InlineLoader,
  LoadingBlock,
  MethodologyPanel,
  PageHeader,
  Pagination,
  RankPill,
  SearchInput,
  SectionHeading,
  SegmentedControl,
  SelectField,
  useDebouncedValue,
} from '../../components/researcher/ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import {
  RESEARCHER_DATASETS,
  RESEARCHER_DATASET_KEYS,
  RESEARCHER_METHODOLOGY,
} from '../../constants/researcherConstants';
import { fetchResearcherDataset } from '../../services/researcherApi';
import { shareCSV } from '../../utils/researcherExport';

const PAGE_SIZE = 25;

const TAB_OPTIONS = RESEARCHER_DATASET_KEYS.map((key) => ({ value: key, label: RESEARCHER_DATASETS[key].shortName }));

function initialColumns() {
  return Object.fromEntries(
    RESEARCHER_DATASET_KEYS.map((key) => [
      key,
      {
        year: RESEARCHER_DATASETS[key].defaultYear,
        availableYears: [RESEARCHER_DATASETS[key].defaultYear],
        rows: [],
        page: 1,
        totalPages: 1,
        totalCount: 0,
        loading: true,
        error: '',
      },
    ])
  );
}

function Dot({ color }) {
  return <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: color, marginRight: 6 }} />;
}

export default function ResearcherDatasetComparisonScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('qs');
  const [showMethodology, setShowMethodology] = useState(false);
  const [columns, setColumns] = useState(initialColumns);
  const [refreshing, setRefreshing] = useState(false);
  const requestIds = useRef(Object.fromEntries(RESEARCHER_DATASET_KEYS.map((key) => [key, 0])));
  const yearsRef = useRef(Object.fromEntries(RESEARCHER_DATASET_KEYS.map((key) => [key, RESEARCHER_DATASETS[key].defaultYear])));

  const debouncedSearch = useDebouncedValue(search.trim());

  const loadColumn = useCallback(
    async (datasetKey, year, searchText, page = 1) => {
      const requestId = ++requestIds.current[datasetKey];
      const isCurrent = () => requestId === requestIds.current[datasetKey];

      setColumns((current) => ({
        ...current,
        [datasetKey]: { ...current[datasetKey], year, page, loading: true, error: '' },
      }));

      try {
        const data = await fetchResearcherDataset(datasetKey, {
          year,
          page,
          page_size: PAGE_SIZE,
          search: searchText,
        });
        if (!isCurrent()) return;

        setColumns((current) => ({
          ...current,
          [datasetKey]: {
            year: Number(data.year || year),
            availableYears: data.available_years || [year],
            rows: data.results || [],
            page: data.page || page,
            totalPages: data.total_pages || 1,
            totalCount: data.total_count || 0,
            loading: false,
            error: '',
          },
        }));
      } catch (loadError) {
        if (!isCurrent()) return;
        setColumns((current) => ({
          ...current,
          [datasetKey]: { ...current[datasetKey], rows: [], loading: false, error: loadError.message },
        }));
      } finally {
        if (isCurrent()) setRefreshing(false);
      }
    },
    []
  );

  const loadAll = useCallback(
    (searchText) => {
      RESEARCHER_DATASET_KEYS.forEach((key) => loadColumn(key, yearsRef.current[key], searchText));
    },
    [loadColumn]
  );

  useEffect(() => {
    loadAll(debouncedSearch);
  }, [debouncedSearch, loadAll]);

  const changeColumnYear = (datasetKey, nextYear) => {
    yearsRef.current[datasetKey] = Number(nextYear);
    loadColumn(datasetKey, Number(nextYear), debouncedSearch);
  };

  const searchKey = debouncedSearch.toLowerCase();

  const exportComparison = () => {
    const rows = [];
    RESEARCHER_DATASET_KEYS.forEach((key) => {
      columns[key].rows.forEach((row) => {
        rows.push([
          RESEARCHER_DATASETS[key].shortName,
          columns[key].year,
          row.official_rank,
          row.name,
          row.country,
          row.overall_score ?? '',
        ]);
      });
    });
    shareCSV(['Dataset', 'Year', 'Rank', 'University', 'Country', 'Overall Score'], rows, 'dataset-comparison.csv');
  };

  const active = columns[activeTab];
  const activeInfo = RESEARCHER_DATASETS[activeTab];
  const yearOptions = active.availableYears.map((item) => ({ value: item, label: String(item) }));

  return (
    <ResearcherLayout
      navigation={navigation}
      activeKey="datasetComparison"
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadAll(debouncedSearch);
      }}
    >
      <PageHeader
        title="Dataset Comparison"
        subtitle="QS, THE and ARWU side by side"
      />

      <Card>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search university or country..." />
        <GradientButton title="Export CSV" icon="▧" onPress={exportComparison} />
      </Card>

      {!!searchKey && (
        <Card>
          <SectionHeading title="Position in each ranking" />
          {RESEARCHER_DATASET_KEYS.map((key) => {
            const column = columns[key];
            const match = column.rows.find((row) => row.name?.toLowerCase().includes(searchKey)) || column.rows[0];

            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.85}
                onPress={() => setActiveTab(key)}
                style={[styles.rowCard, activeTab === key && styles.rowCardActive]}
              >
                <View style={styles.rowTop}>
                  <Dot color={RESEARCHER_DATASETS[key].color} />
                  <Text style={[styles.kvValue, { width: 74, marginTop: 0 }]}>
                    {RESEARCHER_DATASETS[key].shortName} {column.year}
                  </Text>
                  {column.loading ? (
                    <InlineLoader style={{ padding: 0 }} />
                  ) : match ? (
                    <>
                      <RankPill rank={match.official_rank} />
                      <View style={styles.flex1}>
                        <UniversityLink
                          name={match.name}
                          country={match.country}
                          dataset={key}
                          rank={match.official_rank}
                          style={[styles.rowName, { fontSize: 12 }]}
                          numberOfLines={2}
                        />
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.mutedText, styles.flex1]}>Not found in this edition</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>
      )}

      <CollapsibleCard
        title="Why the rankings differ"
        open={showMethodology}
        onToggle={() => setShowMethodology((value) => !value)}
      >
        {RESEARCHER_DATASET_KEYS.map((key) => (
          <View key={key} style={[styles.rowCard, { marginBottom: 10 }]}>
            <View style={[styles.rowTop, { marginBottom: 6 }]}>
              <Dot color={RESEARCHER_DATASETS[key].color} />
              <Text style={styles.rowName}>{RESEARCHER_METHODOLOGY[key].title}</Text>
            </View>
            <MethodologyPanel datasetKey={key} showDescription={false} />
          </View>
        ))}
      </CollapsibleCard>

      <SegmentedControl options={TAB_OPTIONS} value={activeTab} onChange={setActiveTab} />

      <Card>
        <View style={[styles.rowBetween, { marginBottom: 10 }]}>
          <View style={styles.rowTop}>
            <Dot color={activeInfo.color} />
            <Text style={styles.sectionTitle}>{activeInfo.shortName}</Text>
          </View>
          <View style={{ width: 110 }}>
            <SelectField
              title={`${activeInfo.shortName} edition`}
              value={active.year}
              options={yearOptions}
              onChange={(year) => changeColumnYear(activeTab, year)}
              disabled={yearOptions.length <= 1}
            />
          </View>
        </View>

        <ErrorBox message={active.error} onRetry={() => loadColumn(activeTab, active.year, debouncedSearch, active.page)} />

        {active.loading ? (
          <LoadingBlock />
        ) : active.rows.length === 0 ? (
          !active.error && <EmptyState text="No universities found." />
        ) : (
          active.rows.map((row) => {
            const isMatch = !!searchKey && row.name?.toLowerCase().includes(searchKey);
            const rank = Number(String(row.official_rank || '').match(/\d+/)?.[0]);

            return (
              <View
                key={row.university_id || `${row.name}-${row.official_rank}`}
                style={[styles.rowCard, isMatch && { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}
              >
                <View style={styles.rowTop}>
                  <RankPill rank={row.official_rank} highlight={Number.isFinite(rank) && rank <= 3} />
                  <View style={styles.flex1}>
                    <UniversityLink
                      name={row.name}
                      country={row.country}
                      dataset={activeTab}
                      rank={row.official_rank}
                      score={row.overall_score}
                      style={[styles.rowName, isMatch && { fontWeight: '900', textDecorationLine: 'underline' }]}
                      numberOfLines={2}
                    />
                    <Text style={styles.rowSub}>{row.country || 'N/A'}</Text>
                  </View>
                  <View style={styles.rowScoreBox}>
                    <Text style={styles.rowScore}>{row.overall_score ?? 'N/A'}</Text>
                    <Text style={styles.rowScoreLabel}>Overall</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <Pagination
          page={active.page}
          totalPages={active.totalPages}
          onPageChange={(nextPage) => loadColumn(activeTab, active.year, debouncedSearch, nextPage)}
        />

        {!active.loading && active.totalCount > 0 && (
          <Text style={styles.noteText}>
            {active.totalCount} {searchKey ? 'matches' : 'universities'} in {activeInfo.title} {active.year}.
          </Text>
        )}
      </Card>
    </ResearcherLayout>
  );
}
