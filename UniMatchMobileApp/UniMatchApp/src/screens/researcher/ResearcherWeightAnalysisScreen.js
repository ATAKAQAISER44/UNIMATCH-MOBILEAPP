// src/screens/researcher/ResearcherWeightAnalysisScreen.js
//
// Researcher Weight Analysis (web: ResearcherWeightAnalysis): start from the
// ranking's official indicator weights, change them, and compare the
// experimental ranking with the official one. Also hosts Saved Experiments
// and the Rank Stability test, like the web page.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';

import ResearcherLayout from '../../components/researcher/ResearcherLayout';
import RankStabilityPanel from '../../components/researcher/RankStabilityPanel';
import SavedExperimentsPanel from '../../components/researcher/SavedExperimentsPanel';
import {
  Card,
  DatasetYearBar,
  EmptyState,
  ErrorBox,
  GradientButton,
  LoadingBlock,
  OutlineButton,
  PageHeader,
  Pagination,
  RankChangeBadge,
  RankPill,
  SectionHeading,
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

const PAGE_SIZE = 10;

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
  const [saveMessage, setSaveMessage] = useState('');
  const [analyzedWeightsKey, setAnalyzedWeightsKey] = useState('');
  const pendingExperimentRef = useRef(null);

  const scrollRef = useRef(null);
  const sectionY = useRef({});
  const startRequest = useLatestRequest();

  useFocusEffect(
    useCallback(() => {
      loadSavedExperiments().then(setExperiments);
    }, [])
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

  const runAnalysis = useCallback(
    async (weightsOverride, yearOverride) => {
      const usedWeights = weightsOverride ?? weights;
      setAnalyzing(true);
      setError('');

      try {
        const data = await runWeightAnalysis(datasetKey, {
          year: yearOverride ?? year,
          weights: usedWeights,
          top_n: 100,
        });
        setResults(data.results || []);
        setNormalizedWeights(data.normalized_weights || {});
        setAnalyzedWeightsKey(JSON.stringify(usedWeights));
        setPage(1);
      } catch (runError) {
        setResults([]);
        setNormalizedWeights({});
        setError(runError.message);
      } finally {
        setAnalyzing(false);
      }
    },
    [datasetKey, weights, year]
  );

  const applyExperiment = useCallback(
    (experiment, metricList, experimentYear) => {
      const nextWeights = Object.fromEntries(
        metricList.map((metric) => [metric, Number(experiment.weights?.[metric] ?? 0)])
      );
      setWeights(nextWeights);
      setVariation(experiment.variation ?? 0.2);
      setActiveExperiment({ id: experiment.id, name: experiment.name, weightsKey: JSON.stringify(nextWeights) });
      setShowSaveBox(false);
      setSaveMessage(`Loaded "${experiment.name}".`);
      runAnalysis(nextWeights, experimentYear);
    },
    [runAnalysis]
  );

  // Load the dataset's indicators whenever the dataset or edition changes.
  useEffect(() => {
    const isCurrent = startRequest();

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
          applyExperiment(pending, nextMetrics, nextYear);
        } else {
          setWeights(officialDefaultWeights(datasetKey, nextMetrics));
          setActiveExperiment(null);
        }
      } catch (loadError) {
        if (!isCurrent()) return;
        setMetrics([]);
        setResults([]);
        setError(loadError.message || 'Unable to load ranking indicators.');
      } finally {
        if (isCurrent()) setLoading(false);
      }
    }

    loadMetrics();
    // applyExperiment intentionally left out: it changes with weights.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetKey, year, reloadKey, startRequest]);

  // Menu links (Rank Stability, Saved Experiments) jump to their section.
  useEffect(() => {
    if (loading || !params.section) return;
    const target = sectionY.current[params.section];
    if (target === undefined) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(target - 8, 0), animated: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [loading, params.section]);

  const rememberSection = (key) => (event) => {
    sectionY.current[key] = event.nativeEvent.layout.y;
  };

  const changeDataset = (nextDataset) => {
    if (nextDataset === datasetKey) return;
    navigation.setParams({ dataset: nextDataset, year: RESEARCHER_DATASETS[nextDataset].defaultYear });
  };

  const changeYear = (nextYear) => navigation.setParams({ year: Number(nextYear) });

  const updateWeight = useCallback((metric, value) => {
    setWeights((current) => ({ ...current, [metric]: Math.max(0, Math.round(Number(value) || 0)) }));
  }, []);

  const resetWeights = () => {
    setWeights(officialDefaultWeights(datasetKey, metrics));
    setResults([]);
    setNormalizedWeights({});
    setPage(1);
  };

  const loadExperiment = (experiment) => {
    setSaveMessage('');
    if (experiment.dataset === datasetKey && Number(experiment.year) === Number(year)) {
      applyExperiment(experiment, metrics, Number(year));
      return;
    }

    // Different dataset/year: switch first; loading the indicators applies it.
    pendingExperimentRef.current = experiment;
    navigation.setParams({ dataset: experiment.dataset, year: Number(experiment.year) });
  };

  const saveExperiment = async () => {
    const name = saveName.trim();
    if (!name) {
      setSaveError('Please give the experiment a name.');
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
      // Top 3 of the last analysis, only if it was run with these exact weights.
      summary:
        results.length && activeAnalysisMatches
          ? results.slice(0, 3).map((row) => ({ rank: row.experimental_rank, name: row.name }))
          : [],
    };

    const updated = [experiment, ...experiments.filter((item) => item.id !== experiment.id)];
    if (!(await storeSavedExperiments(updated))) {
      setSaveError('Could not save — this phone does not allow storing data right now.');
      return;
    }

    setExperiments(updated);
    setActiveExperiment({ id: experiment.id, name, weightsKey: JSON.stringify(weights) });
    setShowSaveBox(false);
    setSaveName('');
    setSaveNote('');
    setSaveError('');
    setSaveMessage(existing ? `Updated "${name}".` : `Saved "${name}".`);
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

  const activeMenuKey =
    params.section === 'rank-stability'
      ? 'stability'
      : params.section === 'saved-experiments'
        ? 'experiments'
        : 'weights';

  return (
    <ResearcherLayout
      navigation={navigation}
      activeKey={activeMenuKey}
      context={{ dataset: datasetKey, year }}
      scrollRef={scrollRef}
    >
      <PageHeader
        eyebrow="Researcher Weight Analysis"
        title={`${shortName} Experimental Ranking`}
        subtitle="Starts from each ranking system's own published indicator weights. Adjust them to see how the experimental ranking would shift from the official ranking."
      />

      <DatasetYearBar
        datasetKey={datasetKey}
        onDatasetChange={changeDataset}
        year={year}
        years={availableYears}
        onYearChange={changeYear}
      />

      <View onLayout={rememberSection('saved-experiments')}>
        <SavedExperimentsPanel
          experiments={experiments}
          activeId={activeExperiment?.id}
          onLoad={loadExperiment}
          onDelete={deleteExperiment}
          labelFor={experimentLabel}
          navigation={navigation}
        />
      </View>

      <View onLayout={rememberSection('weights')}>
        <Card>
          <SectionHeading
            eyebrow="Step 1"
            title="Indicator Weights"
            subtitle={
              activeExperiment
                ? `Experiment: ${activeExperiment.name}${experimentModified ? ' (changed, not saved)' : ''}`
                : `Pre-filled with ${shortName}'s own published weights. The % on the right is the effective share after the last run.`
            }
            right={<OutlineButton title="Official" small onPress={resetWeights} disabled={loading} />}
          />

          {loading ? (
            <LoadingBlock text="Loading indicators..." />
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
            <Text style={styles.kvLabel}>Input weight total</Text>
            <Text style={styles.kvValue}>{totalInputWeight.toFixed(1)}</Text>
          </View>

          <GradientButton
            title={analyzing ? 'Running Analysis...' : 'Run Weight Analysis'}
            loading={analyzing}
            disabled={loading || metrics.length === 0}
            onPress={() => runAnalysis()}
          />

          {!showSaveBox ? (
            <OutlineButton
              title="Save as Experiment"
              style={{ marginTop: 8 }}
              disabled={loading || metrics.length === 0}
              onPress={() => {
                setShowSaveBox(true);
                setSaveError('');
                setSaveMessage('');
                setSaveName(activeExperiment && !experimentModified ? activeExperiment.name : '');
              }}
            />
          ) : (
            <View style={[styles.finding, { marginTop: 10, borderColor: authTheme.colors.brandBorder, backgroundColor: '#F3FBF8' }]}>
              <Text style={styles.findingTitle}>Save these settings</Text>
              <Text style={[styles.mutedText, { marginBottom: 8 }]}>
                Saves {shortName} {year}, all weights above and the stability test setting (±
                {Math.round(variation * 100)}%).
              </Text>

              <Text style={styles.label}>Experiment name *</Text>
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
                <Text style={[styles.warningText, { marginTop: 4 }]}>
                  An experiment with this name already exists — saving will replace it.
                </Text>
              )}

              <Text style={[styles.label, { marginTop: 10 }]}>Note (optional)</Text>
              <TextInput
                value={saveNote}
                onChangeText={setSaveNote}
                placeholder="What were you testing?"
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

          {!!saveMessage && !showSaveBox && <Text style={styles.successText}>{saveMessage}</Text>}
        </Card>
      </View>

      <Card>
        <SectionHeading
          eyebrow="Step 2"
          title="Ranking Effect"
          subtitle="Positive change means the university moved upward in the experimental ranking."
          right={results.length ? <OutlineButton title="Export CSV" small onPress={exportResults} /> : null}
        />

        <ErrorBox message={error} onRetry={metrics.length ? undefined : () => setReloadKey((value) => value + 1)} />

        {results.length === 0 ? (
          <EmptyState text="Adjust the weights and run the analysis to see ranking changes." />
        ) : (
          <>
            {pageResults.map((row) => (
              <View key={row.university_id || `${row.name}-${row.experimental_rank}`} style={styles.rowCard}>
                <View style={styles.rowTop}>
                  <RankPill rank={row.experimental_rank} highlight={row.experimental_rank <= 3} />
                  <View style={styles.flex1}>
                    <Text style={styles.rowName} numberOfLines={2}>
                      {row.name}
                    </Text>
                    <Text style={styles.rowSub}>{row.country || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.kvGrid}>
                  <View style={styles.kvItem}>
                    <Text style={styles.kvLabel}>Official rank</Text>
                    <Text style={styles.kvValue}>#{row.official_rank ?? 'N/A'}</Text>
                  </View>
                  <View style={styles.kvItem}>
                    <Text style={styles.kvLabel}>Change</Text>
                    <View style={{ marginTop: 2 }}>
                      <RankChangeBadge value={row.rank_change} />
                    </View>
                  </View>
                  <View style={[styles.kvItem, { width: '100%' }]}>
                    <Text style={styles.kvLabel}>Weighted score</Text>
                    <Text style={styles.kvValue}>{row.experimental_score}</Text>
                  </View>
                </View>
              </View>
            ))}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <View onLayout={rememberSection('rank-stability')}>
        <RankStabilityPanel
          key={`${datasetKey}-${year}`}
          datasetKey={datasetKey}
          year={year}
          weights={weights}
          variation={variation}
          onVariationChange={setVariation}
          labelFor={metricLabel}
          disabled={loading || metrics.length === 0}
        />
      </View>
    </ResearcherLayout>
  );
}
