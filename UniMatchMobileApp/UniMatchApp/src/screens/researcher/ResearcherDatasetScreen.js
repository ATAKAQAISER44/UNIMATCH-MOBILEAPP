// src/screens/researcher/ResearcherDatasetScreen.js
//
// Researcher Dataset Explorer (web: ResearcherDatasetPage). Browse a ranking
// edition with every indicator as published (original) and 0-1 normalized.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../components/AppText';

import ResearcherLayout from '../../components/researcher/ResearcherLayout';
import UniversityLink from '../../components/UniversityLink';
import {
  Card,
  DatasetYearBar,
  EmptyState,
  ErrorBox,
  GradientButton,
  LoadingBlock,
  MethodologyPanel,
  PageHeader,
  Pagination,
  RankPill,
  SearchInput,
  SectionHeading,
  SegmentedControl,
  SelectField,
  StatGrid,
  chooseExportScope,
  useDebouncedValue,
  useLatestRequest,
} from '../../components/researcher/ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import {
  PAGE_SIZE_OPTIONS,
  RESEARCHER_DATASETS,
  RESEARCHER_METHODOLOGY,
  officialMetricLabel,
  resolveDatasetKey,
  resolveYear,
} from '../../constants/researcherConstants';
import { fetchAllPages, fetchResearcherDataset } from '../../services/researcherApi';
import { shareCSV } from '../../utils/researcherExport';

const VIEW_MODES = [
  { value: 'original', label: 'Original' },
  { value: 'normalized', label: 'Normalized (0–1)' },
];

const PAGE_SIZE_SELECT = PAGE_SIZE_OPTIONS.map((value) => ({ value, label: `${value} per page` }));

function IndicatorValue({ values, mode }) {
  if (!values) return <Text style={styles.kvValue}>N/A</Text>;

  const original = values.original ?? 'N/A';
  const normalized = values.normalized ?? 'N/A';

  if (mode === 'normalized') {
    return <Text style={[styles.kvValue, { color: styles.rowScore.color }]}>{normalized}</Text>;
  }

  return <Text style={styles.kvValue}>{original}</Text>;
}

const UniversityRow = React.memo(function UniversityRow({ row, metrics, datasetKey, mode, expanded, onToggle }) {
  const rankNumber = Number(String(row.official_rank || '').match(/\d+/)?.[0]);

  return (
    <TouchableOpacity activeOpacity={0.86} style={styles.rowCard} onPress={onToggle}>
      <View style={styles.rowTop}>
        <RankPill rank={row.official_rank} highlight={Number.isFinite(rankNumber) && rankNumber <= 3} />
        <View style={styles.flex1}>
          <UniversityLink
            name={row.name}
            country={row.country}
            dataset={datasetKey}
            rank={row.official_rank}
            score={row.overall_score}
            style={styles.rowName}
            numberOfLines={2}
          />
          <Text style={styles.rowSub}>
            {row.country || 'N/A'}
            {row.previous_rank ? ` · Previous rank ${row.previous_rank}` : ''}
          </Text>
        </View>
        <View style={styles.rowScoreBox}>
          <Text style={styles.rowScore}>{row.overall_score ?? 'N/A'}</Text>
          <Text style={styles.rowScoreLabel}>Overall</Text>
        </View>
      </View>

      {expanded ? (
        <View style={styles.kvGrid}>
          {metrics.map((key) => (
            <View key={key} style={styles.kvItem}>
              <Text style={styles.kvLabel} numberOfLines={2}>
                {officialMetricLabel(datasetKey, key)}
              </Text>
              <IndicatorValue values={row.indicators?.[key]} mode={mode} />
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.expandText}>{expanded ? 'Hide indicators ▲' : `Show ${metrics.length} indicators ▼`}</Text>
    </TouchableOpacity>
  );
});

export default function ResearcherDatasetScreen({ navigation, route }) {
  const params = route.params || {};
  const datasetKey = resolveDatasetKey(params.dataset);
  const datasetInfo = RESEARCHER_DATASETS[datasetKey];

  // The edition lives in the route params, so a dataset switch changes both
  // at once (no request for a year the new dataset does not have).
  const year = resolveYear(params.year, datasetKey);
  const [availableYears, setAvailableYears] = useState([datasetInfo.defaultYear]);
  const [summary, setSummary] = useState(null);
  const [countries, setCountries] = useState(['All']);
  const [country, setCountry] = useState('All');
  const [search, setSearch] = useState(params.searchText || '');
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [rows, setRows] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [viewMode, setViewMode] = useState('original');
  const [expanded, setExpanded] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebouncedValue(search);
  const startRequest = useLatestRequest();

  // Dataset / year / search can change through the menu or the dashboard.
  useEffect(() => {
    setCountry('All');
    setSearch(params.searchText || '');
    setPage(1);
    setExpanded({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetKey, params.year, params.searchNonce]);

  useEffect(() => {
    const isCurrent = startRequest();

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await fetchResearcherDataset(datasetKey, {
          year,
          page,
          page_size: pageSize,
          country,
          search: debouncedSearch.trim(),
        });

        if (!isCurrent()) return;

        setSummary(data.summary || null);
        setCountries(['All', ...(data.countries || [])]);
        setAvailableYears(data.available_years || [data.year]);
        setMetrics(data.metrics || []);
        setRows(data.results || []);
        setPage(data.page || 1);
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 1);
      } catch (loadError) {
        if (!isCurrent()) return;
        setSummary(null);
        setRows([]);
        setMetrics([]);
        setTotalCount(0);
        setTotalPages(1);
        setError(loadError.message);
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    load();
  }, [datasetKey, year, country, debouncedSearch, page, pageSize, reloadKey, startRequest]);

  const countryOptions = useMemo(
    () => countries.map((item) => ({ value: item, label: item === 'All' ? 'All Countries' : item })),
    [countries]
  );

  const changeDataset = (nextDataset) => {
    if (nextDataset === datasetKey) return;
    navigation.setParams({
      dataset: nextDataset,
      year: RESEARCHER_DATASETS[nextDataset].defaultYear,
      searchText: '',
      searchNonce: Date.now(),
    });
  };

  const changeYear = (nextYear) => {
    setCountry('All');
    setPage(1);
    // Keep the year in the params so the menu opens other tools for it.
    navigation.setParams({ year: Number(nextYear) });
  };

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const exportRows = useCallback(
    (rowsToExport, prefix) => {
      const headers = [
        'Rank',
        'University',
        'Country',
        'Overall Score',
        ...metrics.map((key) => officialMetricLabel(datasetKey, key)),
      ];

      const dataRows = rowsToExport.map((row) => [
        row.official_rank,
        row.name,
        row.country,
        row.overall_score ?? '',
        ...metrics.map((key) => row.indicators?.[key]?.original ?? ''),
      ]);

      return shareCSV(headers, dataRows, `${prefix}-${datasetKey}-${year}.csv`);
    },
    [datasetKey, metrics, year]
  );

  const exportComplete = useCallback(async () => {
    try {
      setExporting(true);
      const allRows = await fetchAllPages((requestPage, requestPageSize) =>
        fetchResearcherDataset(datasetKey, {
          year,
          page: requestPage,
          page_size: requestPageSize,
          country,
          search: search.trim(),
        })
      );
      await exportRows(allRows, 'dataset-complete-filtered');
    } catch (exportError) {
      setError(exportError.message || 'Complete dataset export failed.');
    } finally {
      setExporting(false);
    }
  }, [country, datasetKey, exportRows, search, year]);

  const toggleAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    setExpanded(next ? Object.fromEntries(rows.map((row, index) => [row.university_id || index, true])) : {});
  };

  const firstResult = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastResult = Math.min(page * pageSize, totalCount);

  return (
    <ResearcherLayout
      navigation={navigation}
      activeKey="dataset"
      context={{ dataset: datasetKey, year }}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        setReloadKey((value) => value + 1);
      }}
    >
      <PageHeader title={`${datasetInfo.title} ${year}`} />

      <DatasetYearBar
        datasetKey={datasetKey}
        onDatasetChange={changeDataset}
        year={year}
        years={availableYears}
        onYearChange={changeYear}
      />

      <StatGrid
        items={[
          { label: 'Universities', value: summary?.total_universities ?? '-' },
          { label: 'Countries', value: summary?.total_countries ?? '-' },
          { label: 'Indicators', value: summary?.total_parameters ?? '-' },
          { label: 'Edition', value: summary?.edition ?? year },
        ]}
      />

      <Card>
        <SearchInput value={search} onChangeText={changeFilter(setSearch)} placeholder="Search university..." />

        <View style={[styles.twoCol, styles.fieldGap]}>
          <SelectField
            style={styles.flex1}
            label="Country"
            title="Country"
            value={country}
            options={countryOptions}
            onChange={changeFilter(setCountry)}
          />
          <SelectField
            style={styles.flex1}
            label="Rows"
            title="Rows per page"
            value={pageSize}
            options={PAGE_SIZE_SELECT}
            onChange={changeFilter((value) => setPageSize(Number(value)))}
          />
        </View>

        <GradientButton
          title="Export CSV"
          icon="▧"
          loading={exporting}
          onPress={() => chooseExportScope(() => exportRows(rows, 'dataset-current-page'), exportComplete)}
        />
      </Card>

      <Card>
        <SectionHeading
          title={loading ? 'Universities' : `${firstResult}–${lastResult} of ${totalCount} universities`}
          right={
            rows.length ? (
              <TouchableOpacity onPress={toggleAll}>
                <Text style={styles.expandText}>{allExpanded ? 'Collapse all' : 'Expand all'}</Text>
              </TouchableOpacity>
            ) : null
          }
        />

        <Text style={styles.label}>Show indicator values as</Text>
        <SegmentedControl options={VIEW_MODES} value={viewMode} onChange={setViewMode} />

        <ErrorBox message={error} onRetry={() => setReloadKey((value) => value + 1)} />

        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          !error && <EmptyState text="No universities found." />
        ) : (
          rows.map((row, index) => {
            const key = row.university_id || index;
            return (
              <UniversityRow
                key={`${key}-${row.official_rank}`}
                row={row}
                metrics={metrics}
                datasetKey={datasetKey}
                mode={viewMode}
                expanded={!!expanded[key]}
                onToggle={() => setExpanded((current) => ({ ...current, [key]: !current[key] }))}
              />
            );
          })
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        <Text style={styles.noteText}>Tap a card for its indicators. Normalized = rescaled 0–1 within this edition.</Text>
      </Card>

      <Card>
        <SectionHeading title={`How ${RESEARCHER_METHODOLOGY[datasetKey].title} is calculated`} />
        <MethodologyPanel datasetKey={datasetKey} showDescription={false} />
      </Card>
    </ResearcherLayout>
  );
}
