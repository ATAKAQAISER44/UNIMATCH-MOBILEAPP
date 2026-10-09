// src/screens/researcher/ResearcherAttributesScreen.js
//
// Researcher University Attributes Explorer (web: ResearcherAttributesExplorer).
// Browse the manually collected attributes (tuition, living cost,
// scholarships, acceptance rate, ...) independent of any ranking dataset.

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
  EmptyState,
  ErrorBox,
  GradientButton,
  LoadingBlock,
  PageHeader,
  Pagination,
  SearchInput,
  SectionHeading,
  SelectField,
  chooseExportScope,
  useDebouncedValue,
  useLatestRequest,
} from '../../components/researcher/ResearcherUI';
import { pageGuide } from '../../components/researcher/pageGuides';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { ATTRIBUTE_EXPLORER_COLUMNS, PAGE_SIZE_OPTIONS } from '../../constants/researcherConstants';
import { fetchAllPages, fetchAttributesExplorer } from '../../services/researcherApi';
import { shareCSV } from '../../utils/researcherExport';
import { uniqueKeys } from '../../utils/listKeys';

const PAGE_SIZE_SELECT = PAGE_SIZE_OPTIONS.map((value) => ({ value, label: `${value} per page` }));

// The most useful fields stay visible; the rest open on tap.
const PREVIEW_KEYS = ['tuition_fee_international', 'living_cost', 'acceptance_rate', 'scholarship'];

const SCHOLARSHIP_OPTIONS = [
  { value: 'All', label: 'Any Scholarship Status' },
  { value: 'Yes', label: 'Scholarship Available' },
  { value: 'No', label: 'No Scholarship' },
];

const AttributeRow = React.memo(function AttributeRow({ row, expanded, onToggle }) {
  const columns = expanded
    ? ATTRIBUTE_EXPLORER_COLUMNS
    : ATTRIBUTE_EXPLORER_COLUMNS.filter((column) => PREVIEW_KEYS.includes(column.key));

  return (
    <TouchableOpacity activeOpacity={0.86} style={styles.rowCard} onPress={onToggle}>
      <UniversityLink name={row.name} country={row.country} style={styles.rowName} />
      <Text style={styles.rowSub}>
        {row.country || 'N/A'}
        {row.region ? ` · ${row.region}` : ''}
      </Text>
      <View style={styles.kvGrid}>
        {columns.map((column) => (
          <View key={column.key} style={styles.kvItem}>
            <Text style={styles.kvLabel}>{column.label}</Text>
            <Text style={styles.kvValue} numberOfLines={3}>
              {row[column.key] ?? 'N/A'}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.expandText}>{expanded ? 'Less ▲' : 'All attributes ▼'}</Text>
    </TouchableOpacity>
  );
});

export default function ResearcherAttributesScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('All');
  const [region, setRegion] = useState('All');
  const [publicPrivate, setPublicPrivate] = useState('All');
  const [scholarship, setScholarship] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [countries, setCountries] = useState(['All']);
  const [regions, setRegions] = useState(['All']);
  const [publicPrivateOptions, setPublicPrivateOptions] = useState(['All']);

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebouncedValue(search.trim());
  const startRequest = useLatestRequest();

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      country,
      region,
      public_private: publicPrivate,
      scholarship,
    }),
    [debouncedSearch, country, region, publicPrivate, scholarship]
  );

  useEffect(() => {
    const isCurrent = startRequest();

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await fetchAttributesExplorer({ ...filters, page, page_size: pageSize });
        if (!isCurrent()) return;

        setRows(data.results || []);
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 1);
        setCountries(['All', ...(data.countries || [])]);
        setRegions(['All', ...(data.regions || [])]);
        setPublicPrivateOptions(['All', ...(data.public_private_options || [])]);
      } catch (loadError) {
        if (!isCurrent()) return;
        setRows([]);
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
  }, [filters, page, pageSize, reloadKey, startRequest]);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
    setExpanded({});
  };

  const exportRows = useCallback((rowsToExport, filename) => {
    const headers = ['University', 'Country', ...ATTRIBUTE_EXPLORER_COLUMNS.map((column) => column.label)];
    const dataRows = rowsToExport.map((row) => [
      row.name,
      row.country,
      ...ATTRIBUTE_EXPLORER_COLUMNS.map((column) => row[column.key] ?? ''),
    ]);
    return shareCSV(headers, dataRows, filename);
  }, []);

  const exportComplete = useCallback(async () => {
    try {
      setExporting(true);
      const allRows = await fetchAllPages((requestPage, requestPageSize) =>
        fetchAttributesExplorer({ ...filters, search: search.trim(), page: requestPage, page_size: requestPageSize })
      );
      await exportRows(allRows, 'attributes-complete-filtered.csv');
    } catch (exportError) {
      setError(exportError.message || 'Complete attributes export failed.');
    } finally {
      setExporting(false);
    }
  }, [exportRows, filters, search]);

  const countryOptions = useMemo(
    () => countries.map((item) => ({ value: item, label: item === 'All' ? 'All Countries' : item })),
    [countries]
  );
  const regionOptions = useMemo(
    () => regions.map((item) => ({ value: item, label: item === 'All' ? 'All Regions' : item })),
    [regions]
  );
  const publicPrivateSelect = useMemo(
    () => publicPrivateOptions.map((item) => ({ value: item, label: item === 'All' ? 'Public & Private' : item })),
    [publicPrivateOptions]
  );

  const firstResult = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastResult = Math.min(page * pageSize, totalCount);

  const rowKeys = uniqueKeys(rows, (row) => `${row.name || ''}|${row.country || ''}`);

  return (
    <ResearcherLayout
      navigation={navigation}
      activeKey="attributes"
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        setReloadKey((value) => value + 1);
      }}
    >
      <PageHeader title="Attributes Explorer" subtitle="Fees, scholarships and admission" guide={pageGuide('attributes')} />

      <Card>
        <SearchInput value={search} onChangeText={changeFilter(setSearch)} placeholder="Search university or country..." />

        <View style={[styles.twoCol, styles.fieldGap]}>
          <SelectField style={styles.flex1} label="Country" title="Country" value={country} options={countryOptions} onChange={changeFilter(setCountry)} />
          <SelectField style={styles.flex1} label="Region" title="Region" value={region} options={regionOptions} onChange={changeFilter(setRegion)} />
        </View>
        <View style={[styles.twoCol, styles.fieldGap]}>
          <SelectField
            style={styles.flex1}
            label="Type"
            title="Public / Private"
            value={publicPrivate}
            options={publicPrivateSelect}
            onChange={changeFilter(setPublicPrivate)}
          />
          <SelectField
            style={styles.flex1}
            label="Scholarship"
            title="Scholarship"
            value={scholarship}
            options={SCHOLARSHIP_OPTIONS}
            onChange={changeFilter(setScholarship)}
          />
        </View>
        <SelectField
          style={styles.fieldGap}
          label="Rows"
          title="Rows per page"
          value={pageSize}
          options={PAGE_SIZE_SELECT}
          onChange={changeFilter((value) => setPageSize(Number(value)))}
        />

        <GradientButton
          title="Export CSV"
          icon="▧"
          loading={exporting}
          onPress={() => chooseExportScope(() => exportRows(rows, 'attributes-current-page.csv'), exportComplete)}
        />
      </Card>

      <Card>
        <SectionHeading title={loading ? 'Universities' : `${firstResult}–${lastResult} of ${totalCount} universities`} />

        <ErrorBox message={error} onRetry={() => setReloadKey((value) => value + 1)} />

        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          !error && <EmptyState text="No universities found." />
        ) : (
          // The attributes data gives every row the same university_id, so
          // keys are built from name + country (unique within the page).
          rows.map((row, index) => {
            const key = rowKeys[index];
            return (
              <AttributeRow
                key={key}
                row={row}
                expanded={!!expanded[key]}
                onToggle={() => setExpanded((current) => ({ ...current, [key]: !current[key] }))}
              />
            );
          })
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        <Text style={styles.noteText}>Collected by hand; N/A = not available.</Text>
      </Card>
    </ResearcherLayout>
  );
}
