// src/screens/student/CompareUniversitiesScreen.js
//
// Compare Universities (web: pages/CompareUniversitiesPage.jsx). Every
// university of QS, THE and ARWU in one A-Z list (loadAllUniversities), with
// search, country and ranking filters; pick up to 3 for the side-by-side
// compare popup (shared compare list).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import AppLayout from '../../components/app/AppLayout';
import { Pill } from '../../components/app/RoleUI';
import CompareBar from '../../components/CompareBar';
import CompareModal from '../../components/CompareModal';
import UniversityLink, { useOpenUniversity } from '../../components/UniversityLink';
import { Text } from '../../components/AppText';
import {
  Card,
  ErrorBox,
  GradientButton,
  LoadingBlock,
  OutlineButton,
  PageHeader,
  Pagination,
  SearchInput,
  SegmentedControl,
  SelectField,
  useDebouncedValue,
} from '../../components/researcher/ResearcherUI';
import { DATASET_TONE, EmptyCard, HeaderCount, rankLabel } from '../../components/student/StudentUI';
import { loadAllUniversities, normalizeIdentity } from '../../services/universitySearch';
import { MAX_COMPARE, useCompareList } from '../../services/compareList';
import { researcherStyles as styles } from '../../styles/researcherStyles';

const PAGE_SIZE = 18;
const ALL = 'all';
const DATASET_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'qs', label: 'QS' },
  { value: 'the', label: 'THE' },
  { value: 'arwu', label: 'ARWU' },
];

const regionOf = (uni) => uni?.raw?.Region || uni?.region || '';
const datasetsOf = (uni) => (Array.isArray(uni?.datasets_found) && uni.datasets_found.length ? uni.datasets_found : [uni?.dataset].filter(Boolean));

function UniversityRow({ uni, compared, disabled, onToggle, onDetails }) {
  const datasets = datasetsOf(uni);
  const place = [uni.country, regionOf(uni)].filter(Boolean).join(' · ') || 'Location not available';

  return (
    <View style={[styles.rowCard, compared && styles.rowCardActive]}>
      <UniversityLink
        name={uni.name}
        country={uni.country}
        dataset={datasets[0]}
        rank={uni.ranks?.[datasets[0]]}
        style={[styles.rowName, { fontSize: 14, lineHeight: 19 }]}
        numberOfLines={2}
      />
      <Text style={styles.rowSub} numberOfLines={1}>
        {place}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
        {datasets.map((dataset) => (
          <Pill key={dataset} label={`${dataset.toUpperCase()} ${rankLabel(uni.ranks?.[dataset])}`} tone={DATASET_TONE} />
        ))}
      </View>

      <View style={[styles.buttonRow, { marginTop: 9 }]}>
        {compared ? (
          <OutlineButton small title="Remove" onPress={onToggle} style={{ flexGrow: 1, flexBasis: 110, minHeight: 36 }} />
        ) : (
          <GradientButton small title="Compare" onPress={onToggle} disabled={disabled} style={{ flexGrow: 1, flexBasis: 110 }} />
        )}
        <OutlineButton small title="Details" onPress={onDetails} style={{ flexGrow: 1, flexBasis: 110, minHeight: 36 }} />
      </View>
    </View>
  );
}

export default function CompareUniversitiesScreen({ navigation }) {
  const compare = useCompareList();
  const openUniversity = useOpenUniversity();

  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState(ALL);
  const [dataset, setDataset] = useState(ALL);
  const [page, setPage] = useState(1);
  const [compareOpen, setCompareOpen] = useState(false);
  const query = useDebouncedValue(search.trim().toLowerCase(), 250);
  const scrollRef = useRef(null);

  const changePage = useCallback((next) => {
    setPage(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const load = useCallback((force = false) => {
    let active = true;
    setLoading(true);
    setError('');
    loadAllUniversities({ force })
      .then((list) => active && setAll(list))
      .catch((err) => active && setError(err?.message || 'Universities could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  useEffect(() => setPage(1), [query, country, dataset]);

  const countryOptions = useMemo(() => {
    const countries = [...new Set(all.map((uni) => uni.country).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return [{ value: ALL, label: 'All countries' }, ...countries.map((value) => ({ value, label: value }))];
  }, [all]);

  const filtered = useMemo(
    () =>
      all.filter((uni) => {
        const datasets = datasetsOf(uni);
        const matchesSearch =
          !query ||
          String(uni.name || '').toLowerCase().includes(query) ||
          String(uni.country || '').toLowerCase().includes(query) ||
          datasets.some((key) => key.includes(query));
        return (
          matchesSearch && (country === ALL || uni.country === country) && (dataset === ALL || datasets.includes(dataset))
        );
      }),
    [all, query, country, dataset]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = !!search.trim() || country !== ALL || dataset !== ALL;

  const clearFilters = useCallback(() => {
    setSearch('');
    setCountry(ALL);
    setDataset(ALL);
  }, []);

  const showBar = compare.items.length > 0;

  return (
    <AppLayout
      navigation={navigation}
      activeKey="compareUniversities"
      scrollRef={scrollRef}
      bottomSpace={showBar ? 120 : 32}
      footer={
        <>
          <CompareModal
            visible={compareOpen}
            compareList={compare.items}
            allUniversities={all}
            onClose={() => setCompareOpen(false)}
            onAddUniversity={compare.add}
            onRemove={compare.remove}
          />
          <CompareBar compareList={compare.items} onOpenCompare={() => setCompareOpen(true)} onClearCompare={compare.clear} />
        </>
      }
    >
      <PageHeader
        eyebrow="Student"
        title="Compare Universities"
        subtitle="Search and pick up to 3 universities to compare side by side."
      >
        <HeaderCount label="Compare" value={`${compare.items.length}/${MAX_COMPARE}`} />
      </PageHeader>

      <Card>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search university, country or dataset..." />
        <SelectField
          label="Country"
          title="Country"
          value={country}
          options={countryOptions}
          onChange={setCountry}
          disabled={loading || !all.length}
          style={{ marginTop: 10 }}
        />
        <Text style={[styles.label, { marginTop: 10 }]}>Dataset</Text>
        <SegmentedControl options={DATASET_OPTIONS} value={dataset} onChange={setDataset} style={{ marginBottom: 0 }} />
        {!loading && !error && all.length > 0 && (
          <View style={[styles.rowBetween, { marginTop: 10, flexWrap: 'wrap', gap: 6 }]}>
            <Text style={[styles.mutedText, { fontWeight: '800', color: '#047857', flexShrink: 1 }]}>
              {filtered.length.toLocaleString()} universities
            </Text>
            {hasFilters && <OutlineButton small title="Clear" onPress={clearFilters} />}
          </View>
        )}
      </Card>

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => load(true)} />
      ) : all.length === 0 ? (
        <EmptyCard text="No universities were returned from QS, THE or ARWU." buttonTitle="Reload" onPress={() => load(true)} />
      ) : filtered.length === 0 ? (
        <EmptyCard text="No university matches these filters." buttonTitle="Clear filters" onPress={clearFilters} />
      ) : (
        <Card>
          {pageRows.map((uni) => {
            const compared = compare.isCompared(uni);
            const datasets = datasetsOf(uni);
            return (
              <UniversityRow
                key={normalizeIdentity(uni.name) || uni.university_id}
                uni={uni}
                compared={compared}
                disabled={!compared && compare.full}
                onToggle={() => compare.toggle(uni)}
                onDetails={() =>
                  openUniversity({ name: uni.name, country: uni.country, dataset: datasets[0], rank: uni.ranks?.[datasets[0]] })
                }
              />
            );
          })}
          <Pagination page={safePage} totalPages={totalPages} onPageChange={changePage} />
        </Card>
      )}
    </AppLayout>
  );
}
