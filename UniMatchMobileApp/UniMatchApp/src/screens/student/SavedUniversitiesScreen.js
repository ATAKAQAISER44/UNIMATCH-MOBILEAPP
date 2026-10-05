// src/screens/student/SavedUniversitiesScreen.js
//
// Saved Universities (web: pages/SavedUniversitiesPage.jsx). The student's
// saved list (kept on the phone by services/savedUniversities), searchable
// and filterable by country, with Compare (shared compare list, up to 3),
// View details and Remove on every card.

import React, { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import AppLayout from '../../components/app/AppLayout';
import { Pill } from '../../components/app/RoleUI';
import CompareBar from '../../components/CompareBar';
import CompareModal from '../../components/CompareModal';
import { Text } from '../../components/AppText';
import {
  Card,
  GradientButton,
  LoadingBlock,
  OutlineButton,
  PageHeader,
  SearchInput,
  SelectField,
} from '../../components/researcher/ResearcherUI';
import {
  COUNTRY_TONE,
  DATASET_TONE,
  EmptyCard,
  HeaderCount,
  MiniStat,
  TrashButton,
  rankLabel,
  savedEntries,
} from '../../components/student/StudentUI';
import { useOpenUniversity } from '../../components/UniversityLink';
import { useSavedUniversities } from '../../services/savedUniversities';
import { useCompareList } from '../../services/compareList';
import { getOfficialRank } from '../../utils/rankingsUtils';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';

const ALL = 'all';

const currentRankOf = (item) =>
  item?.current_rank ?? item?.my_rank ?? item?.smart_match_rank ?? item?.personalized_rank ?? null;

function SavedCard({ entry, compared, onOpen, onCompare, onRemove }) {
  const { item, name, country, dataset } = entry;
  const official = rankLabel(getOfficialRank(item));
  const current = rankLabel(currentRankOf(item));

  return (
    <View style={[styles.rowCard, { flexGrow: 1, flexBasis: 300, marginBottom: 0 }, compared && styles.rowCardActive]}>
      <View style={[styles.rowTop, { alignItems: 'flex-start' }]}>
        <View style={[styles.flex1, { marginRight: 8 }]}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {!!dataset && <Pill label={dataset.toUpperCase()} tone={DATASET_TONE} />}
            {!!country && <Pill label={country} tone={COUNTRY_TONE} />}
          </View>
          <Text
            style={[styles.rowName, { fontSize: 15, lineHeight: 20, color: authTheme.colors.brandTeal }]}
            numberOfLines={2}
            onPress={onOpen}
            accessibilityRole="link"
          >
            {name}
          </Text>
        </View>
        <TrashButton onPress={onRemove} label={`Remove ${name}`} />
      </View>

      <View style={[styles.kvGrid, { marginTop: 10 }]}>
        <MiniStat label="Official rank" value={official} />
        <MiniStat label="Current rank" value={current} />
      </View>

      <View style={[styles.buttonRow, { marginTop: 10 }]}>
        <GradientButton small title="View details" onPress={onOpen} style={{ flexGrow: 1, flexBasis: 120 }} />
        <OutlineButton
          small
          title={compared ? 'Compared' : 'Compare'}
          onPress={onCompare}
          style={[{ flexGrow: 1, flexBasis: 120, minHeight: 36 }, compared && { borderColor: authTheme.colors.brandTeal, backgroundColor: authTheme.colors.brandMintDeep }]}
        />
      </View>
    </View>
  );
}

export default function SavedUniversitiesScreen({ navigation }) {
  const saved = useSavedUniversities();
  const compare = useCompareList();
  const openUniversity = useOpenUniversity();

  const [search, setSearch] = useState('');
  const [country, setCountry] = useState(ALL);
  const [compareOpen, setCompareOpen] = useState(false);

  const entries = useMemo(() => savedEntries(saved.items), [saved.items]);
  const pool = useMemo(() => entries.map((entry) => entry.item), [entries]);

  const countryOptions = useMemo(() => {
    const countries = [...new Set(entries.map((entry) => entry.country).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return [{ value: ALL, label: 'All countries' }, ...countries.map((value) => ({ value, label: value }))];
  }, [entries]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesSearch =
        !query ||
        entry.name.toLowerCase().includes(query) ||
        entry.country.toLowerCase().includes(query) ||
        entry.dataset.includes(query);
      return matchesSearch && (country === ALL || entry.country === country);
    });
  }, [entries, search, country]);

  const hasFilters = !!search.trim() || country !== ALL;

  const clearFilters = useCallback(() => {
    setSearch('');
    setCountry(ALL);
  }, []);

  const open = useCallback(
    (entry) =>
      openUniversity({
        name: entry.name,
        country: entry.country,
        dataset: entry.dataset || undefined,
        rank: getOfficialRank(entry.item),
      }),
    [openUniversity]
  );

  const removeEntry = useCallback(
    async (entry) => {
      entry.copies.forEach((copy) => compare.isCompared(copy) && compare.remove(copy));
      for (const copy of entry.copies) {
        // Sequential: each remove re-reads the stored list.
        await saved.remove(copy);
      }
    },
    [compare, saved]
  );

  const clearAll = useCallback(() => {
    Alert.alert('Clear saved universities', 'Remove all saved universities?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: () => {
          saved.items.forEach((item) => compare.isCompared(item) && compare.remove(item));
          saved.clear();
          clearFilters();
          setCompareOpen(false);
        },
      },
    ]);
  }, [clearFilters, compare, saved]);

  const showBar = compare.items.length > 0;

  return (
    <AppLayout
      navigation={navigation}
      activeKey="saved"
      bottomSpace={showBar ? 120 : 32}
      footer={
        <>
          <CompareModal
            visible={compareOpen}
            compareList={compare.items}
            allUniversities={pool}
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
        title="Saved Universities"
        subtitle="Universities you saved from rankings, Smart Match and university pages."
      >
        <HeaderCount label="Total saved" value={entries.length} />
      </PageHeader>

      {!saved.loaded ? (
        <LoadingBlock />
      ) : entries.length === 0 ? (
        <EmptyCard
          text="No saved universities yet. Press Save on a ranking or university page to add one."
          buttonTitle="Explore rankings"
          onPress={() => navigation.navigate('Rankings', { dataset: 'qs' })}
        />
      ) : (
        <>
          <Card>
            <SearchInput value={search} onChangeText={setSearch} placeholder="Search university, country or dataset..." />
            <View style={[styles.buttonRow, { marginTop: 10, alignItems: 'center' }]}>
              <SelectField
                title="Country"
                value={country}
                options={countryOptions}
                onChange={setCountry}
                style={{ flexGrow: 1, flexBasis: 180 }}
              />
              <OutlineButton title="Clear all" danger onPress={clearAll} style={{ flexGrow: 0 }} />
            </View>
            <View style={[styles.rowBetween, { marginTop: 10, flexWrap: 'wrap', gap: 6 }]}>
              <Text style={[styles.mutedText, { fontWeight: '800', color: '#047857', flexShrink: 1 }]}>
                Showing {filtered.length} of {entries.length}
                {country !== ALL ? ` in ${country}` : ''}
              </Text>
              {hasFilters && <OutlineButton small title="Clear filters" onPress={clearFilters} />}
            </View>
          </Card>

          {filtered.length === 0 ? (
            <EmptyCard text="No saved university matches these filters." buttonTitle="Clear filters" onPress={clearFilters} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {filtered.map((entry) => (
                <SavedCard
                  key={entry.key}
                  entry={entry}
                  compared={entry.copies.some(compare.isCompared)}
                  onOpen={() => open(entry)}
                  onCompare={() => {
                    const comparedCopy = entry.copies.find(compare.isCompared);
                    if (comparedCopy) compare.remove(comparedCopy);
                    else compare.add(entry.item);
                  }}
                  onRemove={() => removeEntry(entry)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </AppLayout>
  );
}
