// src/screens/researcher/ResearcherCompareScreen.js
//
// Researcher Compare Universities (web: ResearcherCompareUniversities). Pick
// up to 3 universities from one dataset/edition and compare official
// indicators, the rank under official weights and university attributes.
// On a phone every field is a small block with one column per university.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/AppText';

import ResearcherLayout from '../../components/researcher/ResearcherLayout';
import UniversityLink, { useOpenUniversity } from '../../components/UniversityLink';
import UniversityResultRow from '../../components/researcher/UniversityResultRow';
import {
  Card,
  DatasetYearBar,
  EmptyState,
  ErrorBox,
  GradientButton,
  InlineLoader,
  LoadingBlock,
  PageHeader,
  RankChangeBadge,
  SearchInput,
  SectionHeading,
  useDebouncedValue,
  useLatestRequest,
} from '../../components/researcher/ResearcherUI';
import { pageGuide } from '../../components/researcher/pageGuides';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import {
  COMPARE_ATTRIBUTE_FIELDS,
  RESEARCHER_DATASETS,
  RESEARCHER_ROUTES,
  officialDefaultWeights,
  officialMetricLabel,
  resolveDatasetKey,
  resolveYear,
} from '../../constants/researcherConstants';
import {
  fetchResearcherDataset,
  fetchUniversityAttributes,
  runWeightAnalysis,
} from '../../services/researcherApi';
import { shareCSV } from '../../utils/researcherExport';

const MAX_SELECTED = 3;
const SLOT_COLORS = ['#0D9488', '#22C55E', '#F59E0B'];
const SLOT_LETTERS = ['A', 'B', 'C'];

// Picks survive leaving the screen (per dataset + edition) for this session.
const savedPicks = {};
const picksKey = (dataset, year) => `${dataset}|${year}`;

function normalName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseNumericValue(value) {
  if (value === null || value === undefined) return null;
  const match = String(value).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function rankNumber(value) {
  return Number(String(value || '').match(/\d+/)?.[0]);
}

function attributeCacheKey(item) {
  return `${item.name}|${item.country || ''}`;
}

function SlotTag({ index }) {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 999,
        backgroundColor: SLOT_COLORS[index],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' }}>{SLOT_LETTERS[index]}</Text>
    </View>
  );
}

// One comparison field: label + one cell per university.
function CompareField({ label, cells }) {
  return (
    <View style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E8F3EE' }}>
      <Text style={[styles.kvLabel, { marginBottom: 5, color: authTheme.colors.gray700 }]}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {cells.map((cell, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              borderRadius: 10,
              paddingHorizontal: 7,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: cell.isBest ? '#A7F3D0' : '#E2E8F0',
              backgroundColor: cell.isBest ? '#ECFDF5' : '#FFFFFF',
            }}
          >
            <View style={styles.rowTop}>
              <SlotTag index={index} />
              <View style={styles.flex1}>
                {cell.node || (
                  <Text
                    style={[
                      styles.kvValue,
                      { fontSize: 11.5, marginTop: 0 },
                      cell.isBest && { color: '#047857' },
                    ]}
                    numberOfLines={3}
                  >
                    {cell.text}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function GroupTitle({ children }) {
  return (
    <View style={{ marginTop: 10, marginBottom: 2, borderRadius: 10, backgroundColor: authTheme.colors.brandMintDeep, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={[styles.eyebrow, { marginBottom: 0 }]}>{children}</Text>
    </View>
  );
}

export default function ResearcherCompareScreen({ navigation, route }) {
  const params = route.params || {};
  const datasetKey = resolveDatasetKey(params.dataset);
  const year = resolveYear(params.year, datasetKey);
  const [availableYears, setAvailableYears] = useState([RESEARCHER_DATASETS[datasetKey].defaultYear]);
  const [metrics, setMetrics] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  // Picks that could not be carried over to this edition (names).
  const [notFound, setNotFound] = useState([]);
  const [rematching, setRematching] = useState(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const editionRef = useRef(null);

  const [personalizedResults, setPersonalizedResults] = useState([]);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [attributesCache, setAttributesCache] = useState({});
  const requestedAttributes = useRef(new Set());

  const debouncedQuery = useDebouncedValue(query.trim());
  const startMetaRequest = useLatestRequest();
  const startPersonalizedRequest = useLatestRequest();
  const startSearchRequest = useLatestRequest();
  const startRematchRequest = useLatestRequest();
  const openUniversity = useOpenUniversity();

  // Dataset metadata + ranks under the official weights.
  useEffect(() => {
    const isCurrent = startMetaRequest();
    const key = picksKey(datasetKey, year);
    // Switching dataset/edition carries the current picks over (looked up by
    // name in the new edition); otherwise the picks kept for it come back.
    const previous = editionRef.current && editionRef.current !== key ? selectedRef.current : [];
    editionRef.current = key;
    setNotFound([]);
    if (previous.length) rematchSelected(previous);
    else {
      startRematchRequest();
      setRematching(false);
      setSelected(savedPicks[key] || []);
    }
    setQuery('');

    async function rematchSelected(list) {
      const isCurrentRematch = startRematchRequest();
      setSelected([]);
      setRematching(true);

      const matches = await Promise.all(
        list.map(async (item) => {
          try {
            const data = await fetchResearcherDataset(datasetKey, { year, search: item.name, page: 1, page_size: 8 });
            const wanted = normalName(item.name);
            return (data.results || []).find((row) => normalName(row.name) === wanted) || null;
          } catch {
            return null;
          }
        })
      );
      if (!isCurrentRematch()) return;

      const found = [];
      matches.forEach((row) => {
        if (row && !found.some((item) => item.university_id === row.university_id)) found.push(row);
      });
      setSelected(found.slice(0, MAX_SELECTED));
      setNotFound(list.filter((_, index) => !matches[index]).map((item) => item.name));
      setRematching(false);
    }

    async function loadMeta() {
      setLoadingMeta(true);
      setError('');

      try {
        const data = await fetchResearcherDataset(datasetKey, { year, page: 1, page_size: 1 });
        if (!isCurrent()) return;

        const nextMetrics = data.metrics || [];
        setAvailableYears(data.available_years || [data.year]);
        setMetrics(nextMetrics);
        loadPersonalized(nextMetrics, Number(data.year || year));
      } catch (loadError) {
        if (!isCurrent()) return;
        setMetrics([]);
        setError(loadError.message || 'Unable to load dataset.');
      } finally {
        if (isCurrent()) setLoadingMeta(false);
      }
    }

    async function loadPersonalized(metricKeys, forYear) {
      const isCurrentPersonalized = startPersonalizedRequest();
      setPersonalizedLoading(true);

      try {
        const data = await runWeightAnalysis(datasetKey, {
          year: forYear,
          weights: officialDefaultWeights(datasetKey, metricKeys),
          top_n: 0,
        });
        if (isCurrentPersonalized()) setPersonalizedResults(data.results || []);
      } catch {
        if (isCurrentPersonalized()) setPersonalizedResults([]);
      } finally {
        if (isCurrentPersonalized()) setPersonalizedLoading(false);
      }
    }

    loadMeta();
  }, [datasetKey, year, reloadKey, startMetaRequest, startPersonalizedRequest, startRematchRequest]);

  useEffect(() => {
    savedPicks[picksKey(datasetKey, year)] = selected;
  }, [selected, datasetKey, year]);

  // "Add to Compare" from the University Journey screen.
  const pendingAdd = params.add;
  useEffect(() => {
    if (!pendingAdd || loadingMeta) return;
    navigation.setParams({ add: undefined });
    const wanted = normalName(pendingAdd);
    fetchResearcherDataset(datasetKey, { year, search: pendingAdd, page: 1, page_size: 8 })
      .then((data) => {
        const rows = data.results || [];
        const match = rows.find((row) => normalName(row.name) === wanted) || rows[0];
        if (match) addUniversity(match);
        else setError(`${pendingAdd} is not in ${RESEARCHER_DATASETS[datasetKey].shortName} ${year}.`);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAdd, loadingMeta, datasetKey, year]);

  // Search suggestions.
  useEffect(() => {
    const isCurrent = startSearchRequest();

    if (!debouncedQuery) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    fetchResearcherDataset(datasetKey, { year, search: debouncedQuery, page: 1, page_size: 8 })
      .then((data) => isCurrent() && setSuggestions(data.results || []))
      .catch(() => isCurrent() && setSuggestions([]))
      .finally(() => isCurrent() && setSearchLoading(false));
  }, [debouncedQuery, datasetKey, year, startSearchRequest]);

  // Attribute data for each selected university (cached by name + country).
  useEffect(() => {
    selected.forEach((item) => {
      const cacheKey = attributeCacheKey(item);
      if (requestedAttributes.current.has(cacheKey)) return;
      requestedAttributes.current.add(cacheKey);

      setAttributesCache((current) => ({ ...current, [cacheKey]: 'loading' }));
      fetchUniversityAttributes(item.name, item.country).then((data) =>
        setAttributesCache((current) => ({ ...current, [cacheKey]: data }))
      );
    });
  }, [selected]);

  const changeDataset = (nextDataset) => {
    if (nextDataset === datasetKey) return;
    navigation.setParams({ dataset: nextDataset, year: RESEARCHER_DATASETS[nextDataset].defaultYear });
  };

  const changeYear = (nextYear) => navigation.setParams({ year: Number(nextYear) });

  const addUniversity = (row) => {
    setQuery('');
    setSuggestions([]);
    setSelected((current) => {
      if (current.some((item) => item.university_id === row.university_id)) return current;
      if (current.length >= MAX_SELECTED) return current;
      return [...current, row];
    });
  };

  const removeUniversity = (universityId) =>
    setSelected((current) => current.filter((item) => item.university_id !== universityId));

  const selectedIds = new Set(selected.map((item) => item.university_id));
  const filteredSuggestions = suggestions.filter((item) => !selectedIds.has(item.university_id));

  const personalizedByUniversity = useMemo(() => {
    const map = {};
    personalizedResults.forEach((row) => {
      map[row.university_id] = row;
    });
    return map;
  }, [personalizedResults]);

  const best = useMemo(() => {
    const pickMin = (values) => (values.length ? Math.min(...values) : null);
    const pickMax = (values) => (values.length ? Math.max(...values) : null);
    const present = (values) => values.filter((value) => value !== null && value !== undefined && Number.isFinite(value));

    const perMetric = {};
    metrics.forEach((metric) => {
      perMetric[metric] = pickMax(present(selected.map((item) => item.indicators?.[metric]?.original)));
    });

    const perAttribute = {};
    COMPARE_ATTRIBUTE_FIELDS.forEach((field) => {
      if (!field.direction) {
        perAttribute[field.key] = null;
        return;
      }
      const values = present(
        selected.map((item) => {
          const attrs = attributesCache[attributeCacheKey(item)];
          if (!attrs || attrs === 'loading') return null;
          return parseNumericValue(attrs[field.key]);
        })
      );
      perAttribute[field.key] = field.direction === 'min' ? pickMin(values) : pickMax(values);
    });

    return {
      officialRank: pickMin(present(selected.map((item) => rankNumber(item.official_rank)))),
      overallScore: pickMax(present(selected.map((item) => item.overall_score))),
      personalizedRank: pickMin(
        present(selected.map((item) => personalizedByUniversity[item.university_id]?.experimental_rank))
      ),
      perMetric,
      perAttribute,
    };
  }, [selected, metrics, attributesCache, personalizedByUniversity]);

  const attrValue = useCallback(
    (item, key) => {
      const attrs = attributesCache[attributeCacheKey(item)];
      if (attrs === 'loading') return { loading: true, value: null };
      return { loading: false, value: attrs ? attrs[key] ?? null : null };
    },
    [attributesCache]
  );

  const exportComparison = () => {
    const rows = [];
    rows.push(['Official Rank', ...selected.map((item) => item.official_rank ?? '')]);
    rows.push(['Overall Score', ...selected.map((item) => item.overall_score ?? '')]);
    metrics.forEach((metric) => {
      rows.push([
        officialMetricLabel(datasetKey, metric),
        ...selected.map((item) => item.indicators?.[metric]?.original ?? ''),
      ]);
    });
    rows.push([
      'Personalized Rank',
      ...selected.map((item) => personalizedByUniversity[item.university_id]?.experimental_rank ?? ''),
    ]);
    rows.push([
      'Change vs Official Rank',
      ...selected.map((item) => personalizedByUniversity[item.university_id]?.rank_change ?? ''),
    ]);
    COMPARE_ATTRIBUTE_FIELDS.forEach((field) => {
      rows.push([field.label, ...selected.map((item) => attrValue(item, field.key).value ?? '')]);
    });

    shareCSV(['Field', ...selected.map((item) => item.name)], rows, `compare-${datasetKey}-${year}.csv`);
  };

  return (
    <ResearcherLayout navigation={navigation} activeKey="compare" context={{ dataset: datasetKey, year }}>
      <PageHeader
        title="Compare Universities"
        subtitle={`Up to ${MAX_SELECTED}, side by side`}
        guide={pageGuide('compare', { dataset: datasetKey })}
      />

      <DatasetYearBar
        datasetKey={datasetKey}
        onDatasetChange={changeDataset}
        year={year}
        years={availableYears}
        onYearChange={changeYear}
      />

      <Card>
        <Text style={styles.label}>
          Add a university ({selected.length}/{MAX_SELECTED})
        </Text>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          editable={selected.length < MAX_SELECTED && !loadingMeta && !rematching}
          placeholder={
            selected.length >= MAX_SELECTED ? `Maximum ${MAX_SELECTED} universities selected` : 'Search university...'
          }
        />

        {!!query.trim() && selected.length < MAX_SELECTED && (
          <View style={styles.suggestionBox}>
            {searchLoading || query.trim() !== debouncedQuery ? (
              <InlineLoader />
            ) : filteredSuggestions.length === 0 ? (
              <Text style={[styles.mutedText, { padding: 12 }]}>No university found.</Text>
            ) : (
              filteredSuggestions.map((row) => (
                <UniversityResultRow
                  key={row.university_id}
                  name={row.name}
                  country={row.country}
                  meta={row.official_rank ? `#${row.official_rank}` : ''}
                  primary="compare"
                  onOpen={() =>
                    openUniversity({ name: row.name, country: row.country, dataset: datasetKey, rank: row.official_rank })
                  }
                  onCompare={() => addUniversity(row)}
                  onJourney={() =>
                    navigation.navigate(RESEARCHER_ROUTES.journey, { university: { name: row.name, country: row.country } }, { pop: true })
                  }
                />
              ))
            )}
          </View>
        )}

        {selected.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {selected.map((item, index) => (
              <View key={item.university_id} style={styles.chip}>
                <SlotTag index={index} />
                <UniversityLink
                  name={item.name}
                  country={item.country}
                  dataset={datasetKey}
                  rank={item.official_rank}
                  style={styles.chipText}
                  numberOfLines={1}
                />
                <TouchableOpacity
                  style={[styles.chipClose, { marginRight: 4 }]}
                  onPress={() => navigation.navigate(RESEARCHER_ROUTES.journey, { university: { name: item.name, country: item.country } }, { pop: true })}
                  accessibilityLabel={`Rank journey of ${item.name}`}
                  hitSlop={6}
                >
                  <Ionicons name="trending-up" size={13} color={authTheme.colors.brandTealDark} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chipClose}
                  onPress={() => removeUniversity(item.university_id)}
                  accessibilityLabel={`Remove ${item.name}`}
                >
                  <Text style={styles.chipCloseText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {rematching && <InlineLoader style={{ paddingVertical: 4 }} />}
        {notFound.length > 0 && (
          <View style={[styles.warningBox, { marginTop: 6, marginBottom: 0 }]}>
            <Text style={styles.warningText}>
              Not in {RESEARCHER_DATASETS[datasetKey].shortName} {year}, left out: {notFound.join(', ')}
            </Text>
          </View>
        )}
      </Card>

      <ErrorBox message={error} onRetry={() => setReloadKey((value) => value + 1)} />

      {loadingMeta ? (
        <Card>
          <LoadingBlock />
        </Card>
      ) : rematching ? null : selected.length < 2 ? (
        <Card>
          <EmptyState text="Add at least 2 universities to compare." />
        </Card>
      ) : (
        <Card>
          <SectionHeading title="Comparison" subtitle="Green = best of the selected." />
          <GradientButton title="Export CSV" icon="▧" small onPress={exportComparison} style={{ marginBottom: 6 }} />

          <GroupTitle>Official Ranking</GroupTitle>
          <CompareField
            label="Official Rank"
            cells={selected.map((item) => ({
              text: `#${item.official_rank}`,
              isBest: rankNumber(item.official_rank) === best.officialRank,
            }))}
          />
          <CompareField
            label="Overall Score"
            cells={selected.map((item) => ({
              text: item.overall_score ?? 'N/A',
              isBest: item.overall_score != null && item.overall_score === best.overallScore,
            }))}
          />
          {metrics.map((metric) => (
            <CompareField
              key={metric}
              label={officialMetricLabel(datasetKey, metric)}
              cells={selected.map((item) => {
                const value = item.indicators?.[metric]?.original;
                return { text: value ?? 'N/A', isBest: value != null && value === best.perMetric[metric] };
              })}
            />
          ))}

          <GroupTitle>Recalculated rank (official weights)</GroupTitle>
          <CompareField
            label="Recalculated rank"
            cells={selected.map((item) => {
              const rank = personalizedByUniversity[item.university_id]?.experimental_rank;
              return {
                ...(personalizedLoading ? { node: <InlineLoader style={{ padding: 0 }} /> } : {}),
                text: rank !== undefined ? `#${rank}` : 'N/A',
                isBest: Number.isFinite(rank) && rank === best.personalizedRank,
              };
            })}
          />
          <CompareField
            label="Change vs official"
            cells={selected.map((item) => {
              const change = personalizedByUniversity[item.university_id]?.rank_change;
              if (personalizedLoading) return { node: <InlineLoader style={{ padding: 0 }} /> };
              return change === undefined ? { text: 'N/A' } : { node: <RankChangeBadge value={change} /> };
            })}
          />

          <GroupTitle>University Attributes</GroupTitle>
          {COMPARE_ATTRIBUTE_FIELDS.map((field) => (
            <CompareField
              key={field.key}
              label={field.label}
              cells={selected.map((item) => {
                const { loading, value } = attrValue(item, field.key);
                const numeric = field.direction ? parseNumericValue(value) : null;
                return {
                  ...(loading ? { node: <InlineLoader style={{ padding: 0 }} /> } : {}),
                  text: value ?? 'N/A',
                  isBest: !!field.direction && numeric !== null && numeric === best.perAttribute[field.key],
                };
              })}
            />
          ))}
        </Card>
      )}
    </ResearcherLayout>
  );
}
