// src/screens/researcher/ResearcherWeightAnalysisScreen.js
//
// Researcher Weight Analysis. Three tabs:
//   Weights   - change indicator weights; the experimental ranking updates
//               on its own a moment after each change.
//   Stability - how much ranks move if the weights were slightly different.
//               Re-runs on its own when the weights or the amount change.
//   Saved     - saved experiments. "Load" applies the experiment's weights
//               and opens the Weights tab.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
} from 'react-native';
import { Text, TextInput } from '../../components/AppText';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';

import ResearcherLayout from '../../components/researcher/ResearcherLayout';
import RankStabilityPanel from '../../components/researcher/RankStabilityPanel';
import SavedExperimentsPanel from '../../components/researcher/SavedExperimentsPanel';
import UniversityLink from '../../components/UniversityLink';
import {
  Card,
  DatasetYearBar,
  EmptyState,
  ErrorBox,
  GradientButton,
  InlineLoader,
  LoadingBlock,
  OutlineButton,
  PageHeader,
  Pagination,
  RankChangeBadge,
  RankPill,
  SectionHeading,
  SegmentedControl,
  useLatestRequest,
} from '../../components/researcher/ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import {
  RESEARCHER_DATASETS,
  officialDefaultWeights,
  officialMetricLabel,
  resolveDatasetKey,
  resolveYear,
} from '../../constants/researcherConstants';
import { fetchResearcherDataset, runWeightAnalysis } from '../../services/researcherApi';
import { shareCSV } from '../../utils/researcherExport';
import {
  createExperimentId,
  loadSavedExperiments,
  storeSavedExperiments,
} from '../../utils/researcherExperiments';

const PAGE_SIZE = 20;
// Wait this long after the last weight change before recalculating.
export const AUTO_RUN_DELAY_MS = 500;

// Menu deep links use these section names.
const SECTION_TO_TAB = {
  weights: 'weights',
  'rank-stability': 'stability',
  'saved-experiments': 'saved',
};
const TAB_TO_MENU_KEY = { weights: 'weights', stability: 'stability', saved: 'experiments' };

export function tabForSection(section) {
  return SECTION_TO_TAB[section] || 'weights';
}

const WeightRow = React.memo(function WeightRow({ metric, label, value, effective, onChange }) {
  const [text, setText] = useState(String(value ?? 0));

  useEffect(() => {
    setText(String(value ?? 0));
  }, [value]);

  return (
    <View style={[styles.rowCard, { paddingVertical: 8 }]}>
      <View style={styles.rowBetween}>
        <Text style={[styles.kvValue, styles.flex1]} numberOfLines={2}>
          {label}
        </Text>
        <TextInput
          value={text}
          onChangeText={(next) => {
            setText(next.replace(/[^0-9.]/g, ''));
          }}
          onEndEditing={() => onChange(metric, text)}
          onSubmitEditing={() => onChange(metric, text)}
          keyboardType="numeric"
          maxLength={5}
          accessibilityLabel={`${label} weight`}
          style={[styles.textInput, { minHeight: 34, width: 56, textAlign: 'right', paddingHorizontal: 8, fontWeight: '800' }]}
        />
        <Text style={[styles.kvLabel, { width: 44, textAlign: 'right' }]}>
          {effective !== undefined ? `${(effective * 100).toFixed(0)}%` : ''}
        </Text>
      </View>
      <Slider
        style={{ height: 32, marginHorizontal: -6 }}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={Math.min(Number(value) || 0, 100)}
        onValueChange={(next) => onChange(metric, next)}
        minimumTrackTintColor={authTheme.colors.brandTeal}
        maximumTrackTintColor="#CBD5E1"
        thumbTintColor={authTheme.colors.brandTeal}
      />
    </View>
  );
});

export default function ResearcherWeightAnalysisScreen({ navigation, route }) {
  const params = route.params || {};
  const datasetKey = resolveDatasetKey(params.dataset);
  const year = resolveYear(params.year, datasetKey);
  const shortName = RESEARCHER_DATASETS[datasetKey].shortName;

  const [tab, setTab] = useState(() => tabForSection(params.section));
  const [availableYears, setAvailableYears] = useState([RESEARCHER_DATASETS[datasetKey].defaultYear]);
  const [metrics, setMetrics] = useState([]);
  const [weights, setWeights] = useState({});
  const [results, setResults] = useState([]);
  const [normalizedWeights, setNormalizedWeights] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Saved experiments
  const [variation, setVariation] = useState(0.2);
  const [experiments, setExperiments] = useState([]);
  const [activeExperiment, setActiveExperiment] = useState(null);
  const [showSaveBox, setShowSaveBox] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveNote, setSaveNote] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [analyzedWeightsKey, setAnalyzedWeightsKey] = useState('');
  const pendingExperimentRef = useRef(null);

  const scrollRef = useRef(null);
  const startMetaRequest = useLatestRequest();
  const startAnalysisRequest = useLatestRequest();

  useFocusEffect(
    useCallback(() => {
      loadSavedExperiments().then(setExperiments);
    }, [])
  );

  // Menu links (Weight Analysis / Rank Stability / Saved Experiments) open
  // the matching tab, also when this screen is already open.
  useEffect(() => {
    if (params.section) setTab(tabForSection(params.section));
  }, [params.section]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const changeTab = useCallback(
    (nextTab) => {
      setTab(nextTab);
      scrollToTop();
    },
    [scrollToTop]
  );

  const weightsKey = JSON.stringify(weights);
  const activeAnalysisMatches = analyzedWeightsKey === weightsKey;
  const experimentModified = activeExperiment && activeExperiment.weightsKey !== weightsKey;
  const totalInputWeight = useMemo(
    () => Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0),
    [weights]
  );
  const metricLabel = useCallback((metric) => officialMetricLabel(datasetKey, metric), [datasetKey]);
  const experimentLabel = useCallback((dataset, metric) => officialMetricLabel(dataset, metric), []);

  const totalPages = Math.max(Math.ceil(results.length / PAGE_SIZE), 1);
  const pageResults = useMemo(() => results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [results, page]);

  // Experimental ranking for every university. Runs automatically shortly
  // after the weights change; only the newest response is kept.
  useEffect(() => {
    // Starting a new request makes any older in-flight response stale.
    const isCurrent = startAnalysisRequest();

    if (loading || metrics.length === 0 || totalInputWeight <= 0) {
      setAnalyzing(false);
      if (!loading && totalInputWeight <= 0) {
        setResults([]);
        setNormalizedWeights({});
      }
      return undefined;
    }

    const usedWeights = weights;

    const timer = setTimeout(async () => {
      setAnalyzing(true);
      setError('');

      try {
        // top_n: 0 = every university in the edition.
        const data = await runWeightAnalysis(datasetKey, { year, weights: usedWeights, top_n: 0 });
        if (!isCurrent()) return;
        setResults(data.results || []);
        setNormalizedWeights(data.normalized_weights || {});
        setAnalyzedWeightsKey(JSON.stringify(usedWeights));
        setPage(1);
      } catch (runError) {
        if (!isCurrent()) return;
        setResults([]);
        setNormalizedWeights({});
        setError(runError.message);
      } finally {
        if (isCurrent()) setAnalyzing(false);
      }
    }, AUTO_RUN_DELAY_MS);

    return () => clearTimeout(timer);
    // weightsKey stands in for weights.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightsKey, datasetKey, year, loading, metrics.length, startAnalysisRequest]);

  const applyExperiment = useCallback(
    (experiment, metricList) => {
      const nextWeights = Object.fromEntries(
        metricList.map((metric) => [metric, Number(experiment.weights?.[metric] ?? 0)])
      );
      setWeights(nextWeights);
      setVariation(experiment.variation ?? 0.2);
      setActiveExperiment({ id: experiment.id, name: experiment.name, weightsKey: JSON.stringify(nextWeights) });
      setShowSaveBox(false);
      setNotice(`Loaded “${experiment.name}”. Its weights are applied below.`);
      setTab('weights');
      scrollToTop();
    },
    [scrollToTop]
  );

  // Load the dataset's indicators whenever the dataset or edition changes.
  useEffect(() => {
    const isCurrent = startMetaRequest();

    async function loadMetrics() {
      setLoading(true);
      setError('');

      try {
        const data = await fetchResearcherDataset(datasetKey, { year, page: 1, page_size: 1 });
        if (!isCurrent()) return;

        const nextMetrics = data.metrics || [];
        const nextYear = Number(data.year || year);

        setAvailableYears(data.available_years || [nextYear]);
        setMetrics(nextMetrics);
        setResults([]);
        setNormalizedWeights({});
        setPage(1);

        const pending = pendingExperimentRef.current;
        if (pending && pending.dataset === datasetKey && Number(pending.year) === nextYear) {
          pendingExperimentRef.current = null;
          applyExperiment(pending, nextMetrics);
        } else {
          setWeights(officialDefaultWeights(datasetKey, nextMetrics));
          setActiveExperiment(null);
        }
      } catch (loadError) {
        if (!isCurrent()) return;
        setMetrics([]);
        setResults([]);
        setError(loadError.message || 'Indicators could not be loaded.');
      } finally {
        if (isCurrent()) setLoading(false);
      }
    }

    loadMetrics();
    // applyExperiment is stable apart from scrollToTop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetKey, year, reloadKey, startMetaRequest]);

  // Opened from the Research Report with a saved experiment to apply.
  const latestState = useRef({});
  latestState.current = { loading, datasetKey, year, metrics };
  const requestedExperimentId = params.experimentId;
  useEffect(() => {
    if (!requestedExperimentId) return;
    navigation.setParams({ experimentId: undefined });
    loadSavedExperiments().then((list) => {
      const experiment = (list || []).find((item) => item.id === requestedExperimentId);
      if (!experiment) return;
      const current = latestState.current;
      const sameEdition = experiment.dataset === current.datasetKey && Number(experiment.year) === Number(current.year);
      if (sameEdition && !current.loading && current.metrics.length) applyExperiment(experiment, current.metrics);
      else pendingExperimentRef.current = experiment;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedExperimentId]);

  const changeDataset = (nextDataset) => {
    if (nextDataset === datasetKey) return;
    setNotice('');
    navigation.setParams({ dataset: nextDataset, year: RESEARCHER_DATASETS[nextDataset].defaultYear });
  };

  const changeYear = (nextYear) => {
    setNotice('');
    navigation.setParams({ year: Number(nextYear) });
  };

  const updateWeight = useCallback((metric, value) => {
    setWeights((current) => ({ ...current, [metric]: Math.max(0, Math.round(Number(value) || 0)) }));
  }, []);

  const resetWeights = () => {
    setWeights(officialDefaultWeights(datasetKey, metrics));
    setActiveExperiment(null);
    setNotice('');
  };

  const loadExperiment = (experiment) => {
    if (experiment.dataset === datasetKey && Number(experiment.year) === Number(year)) {
      applyExperiment(experiment, metrics);
      return;
    }

    // Different dataset/edition: switch first; the indicators load, then the
    // experiment is applied and the Weights tab opens.
    pendingExperimentRef.current = experiment;
    setNotice('');
    setTab('weights');
    scrollToTop();
    navigation.setParams({ dataset: experiment.dataset, year: Number(experiment.year) });
  };

  const saveExperiment = async () => {
    const name = saveName.trim();
    if (!name) {
      setSaveError('Enter a name.');
      return;
    }

    const existing = experiments.find(
      (item) => item.name.toLowerCase() === name.toLowerCase() && item.dataset === datasetKey
    );

    const experiment = {
      id: existing?.id || createExperimentId(),
      name,
      note: saveNote.trim(),
      dataset: datasetKey,
      year: Number(year),
      weights,
      variation,
      createdAt: new Date().toISOString(),
      // Top 3 of the current ranking, only if it was calculated with these exact weights.
      summary:
        results.length && activeAnalysisMatches
          ? results.slice(0, 3).map((row) => ({ rank: row.experimental_rank, name: row.name }))
          : [],
    };

    const updated = [experiment, ...experiments.filter((item) => item.id !== experiment.id)];
    if (!(await storeSavedExperiments(updated))) {
      setSaveError('Could not save on this phone. Try again.');
      return;
    }

    setExperiments(updated);
    setActiveExperiment({ id: experiment.id, name, weightsKey: JSON.stringify(weights) });
    setShowSaveBox(false);
    setSaveName('');
    setSaveNote('');
    setSaveError('');
    setNotice(existing ? `Updated “${name}”.` : `Saved “${name}”. Find it in the Saved tab.`);
  };

  const deleteExperiment = async (id) => {
    const updated = experiments.filter((item) => item.id !== id);
    await storeSavedExperiments(updated);
    setExperiments(updated);
    if (activeExperiment?.id === id) setActiveExperiment(null);
  };

  const exportResults = () => {
    shareCSV(
      ['Experimental Rank', 'Official Rank', 'Change', 'University', 'Country', 'Weighted Score'],
      results.map((row) => [
        row.experimental_rank,
        row.official_rank ?? '',
        row.rank_change ?? '',
        row.name,
        row.country,
        row.experimental_score,
      ]),
      `weight-analysis-${datasetKey}-${year}.csv`
    );
  };

  const nameExists =
    !saveError &&
    saveName.trim() &&
    experiments.some(
      (item) => item.dataset === datasetKey && item.name.toLowerCase() === saveName.trim().toLowerCase()
    );

  const tabs = [
    { value: 'weights', label: 'Weights' },
    { value: 'stability', label: 'Stability' },
    { value: 'saved', label: `Saved (${experiments.length})` },
  ];

  return (
    <ResearcherLayout
      navigation={navigation}
      activeKey={TAB_TO_MENU_KEY[tab]}
      context={{ dataset: datasetKey, year }}
      scrollRef={scrollRef}
    >
      <PageHeader
        title="Weight Analysis"
        subtitle="Change indicator weights, see new ranks."
      />

      <SegmentedControl options={tabs} value={tab} onChange={changeTab} />

      {tab !== 'saved' && (
        <DatasetYearBar
          datasetKey={datasetKey}
          onDatasetChange={changeDataset}
          year={year}
          years={availableYears}
          onYearChange={changeYear}
        />
      )}

      {tab === 'weights' && (
        <>
          {!!notice && (
            <View style={[styles.finding, { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.findingText, { color: '#047857', fontWeight: '800' }]}>{notice}</Text>
            </View>
          )}

          <Card>
            <SectionHeading
              title="Indicator weights"
              subtitle={
                activeExperiment
                  ? `Experiment: ${activeExperiment.name}${experimentModified ? ' (edited, not saved)' : ''}`
                  : `${shortName} official weights`
              }
              right={<OutlineButton title="Reset" small onPress={resetWeights} disabled={loading} />}
            />

            {loading ? (
              <LoadingBlock />
            ) : (
              metrics.map((metric) => (
                <WeightRow
                  key={metric}
                  metric={metric}
                  label={metricLabel(metric)}
                  value={weights[metric] ?? 0}
                  effective={normalizedWeights[metric]}
                  onChange={updateWeight}
                />
              ))
            )}

            <View style={[styles.rowBetween, { marginVertical: 8 }]}>
              <Text style={styles.kvLabel}>Total</Text>
              <Text style={styles.kvValue}>{totalInputWeight.toFixed(0)}</Text>
            </View>

            {!showSaveBox ? (
              <OutlineButton
                title="Save as experiment"
                disabled={loading || metrics.length === 0}
                onPress={() => {
                  setShowSaveBox(true);
                  setSaveError('');
                  setNotice('');
                  setSaveName(activeExperiment && !experimentModified ? activeExperiment.name : '');
                }}
              />
            ) : (
              <View style={[styles.finding, { marginTop: 4, borderColor: authTheme.colors.brandBorder, backgroundColor: '#F3FBF8' }]}>
                <Text style={styles.findingTitle}>Save experiment</Text>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  value={saveName}
                  onChangeText={(value) => {
                    setSaveName(value);
                    if (value.trim()) setSaveError('');
                  }}
                  placeholder={`e.g. Research-heavy ${shortName} ${year}`}
                  placeholderTextColor="#94A3B8"
                  maxLength={80}
                  style={[styles.textInput, saveError && styles.inputError]}
                  returnKeyType="done"
                  onSubmitEditing={saveExperiment}
                />
                {!!saveError && <Text style={[styles.errorText, { marginTop: 4 }]}>{saveError}</Text>}
                {!!nameExists && (
                  <Text style={[styles.warningText, { marginTop: 4 }]}>This name exists — saving replaces it.</Text>
                )}

                <Text style={[styles.label, { marginTop: 10 }]}>Note (optional)</Text>
                <TextInput
                  value={saveNote}
                  onChangeText={setSaveNote}
                  placeholder="What are you testing?"
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={300}
                  style={styles.textArea}
                />

                <View style={[styles.twoCol, { marginTop: 10 }]}>
                  <GradientButton title="Save" onPress={saveExperiment} style={styles.flex1} />
                  <OutlineButton
                    title="Cancel"
                    onPress={() => {
                      setShowSaveBox(false);
                      setSaveError('');
                    }}
                  />
                </View>
              </View>
            )}
          </Card>

          <Card>
            <SectionHeading
              title="New ranking"
              subtitle={
                results.length
                  ? `${results.length} universities · vs official rank`
                  : undefined
              }
              right={results.length ? <OutlineButton title="CSV" small onPress={exportResults} /> : null}
            />

            <ErrorBox message={error} onRetry={() => setReloadKey((value) => value + 1)} />

            {analyzing && results.length === 0 ? (
              <LoadingBlock />
            ) : results.length === 0 ? (
              !error && !loading && <EmptyState text="Give at least one indicator a weight above 0." />
            ) : (
              <View style={analyzing ? { opacity: 0.5 } : null}>
                {analyzing && <InlineLoader style={{ paddingTop: 0 }} />}
                {pageResults.map((row) => (
                  <View key={row.university_id || `${row.name}-${row.experimental_rank}`} style={styles.rowCard}>
                    <View style={styles.rowTop}>
                      <RankPill rank={row.experimental_rank} highlight={row.experimental_rank <= 3} />
                      <View style={styles.flex1}>
                        <UniversityLink
                          name={row.name}
                          country={row.country}
                          dataset={datasetKey}
                          rank={row.experimental_rank}
                          style={styles.rowName}
                          numberOfLines={2}
                        />
                        <Text style={styles.rowSub}>{row.country || 'N/A'}</Text>
                      </View>
                      <RankChangeBadge value={row.rank_change} />
                    </View>
                    <View style={[styles.rowBetween, { marginTop: 6 }]}>
                      <Text style={styles.rowSub}>Official #{row.official_rank ?? 'N/A'}</Text>
                      <Text style={styles.rowSub}>Score {row.experimental_score}</Text>
                    </View>
                  </View>
                ))}
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </View>
            )}
          </Card>
        </>
      )}

      {/* Kept mounted (hidden) so its last result is still there when the
          tab is reopened; it only runs while the tab is visible. */}
      <View style={tab === 'stability' ? null : { display: 'none' }}>
        <RankStabilityPanel
          key={`${datasetKey}-${year}`}
          datasetKey={datasetKey}
          year={year}
          weights={weights}
          variation={variation}
          onVariationChange={setVariation}
          labelFor={metricLabel}
          disabled={loading || metrics.length === 0 || totalInputWeight <= 0}
          active={tab === 'stability'}
        />
      </View>

      {tab === 'saved' && (
        <SavedExperimentsPanel
          experiments={experiments}
          activeId={activeExperiment?.id}
          onLoad={loadExperiment}
          onDelete={deleteExperiment}
          labelFor={experimentLabel}
          navigation={navigation}
          onCreate={() => changeTab('weights')}
        />
      )}
    </ResearcherLayout>
  );
}
