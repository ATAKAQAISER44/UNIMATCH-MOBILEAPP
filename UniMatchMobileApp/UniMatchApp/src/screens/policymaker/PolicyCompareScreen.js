// src/screens/policymaker/PolicyCompareScreen.js
//
// Policymaker country comparison (web: policymaker/PolicymakerCompare).
// Up to four countries (the policymaker's own country first by default),
// ranking presence and access & affordability side by side.

import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '../../components/AppText';
import AppLayout from '../../components/app/AppLayout';
import { DataTable } from '../../components/app/RoleUI';
import {
  Card,
  EmptyState,
  ErrorBox,
  InlineLoader,
  LoadingBlock,
  PageHeader,
  SectionHeading,
  SelectField,
} from '../../components/researcher/ResearcherUI';
import { CountryGate, accessTableRows } from '../../components/policymaker/PolicyUI';
import { RANKINGS } from '../../constants/roleConstants';
import { useCountryCompare, useCountryList, usePolicyCountry } from '../../services/policyApi';
import { researcherStyles as styles } from '../../styles/researcherStyles';

const MAX_COUNTRIES = 4;

function CountryChooser({ selected, onChange }) {
  const { data, loading, error, retry } = useCountryList();
  const options = (data?.countries || [])
    .filter((name) => !selected.includes(name))
    .map((name) => ({ value: name, label: name }));
  const full = selected.length >= MAX_COUNTRIES;

  return (
    <Card>
      <SectionHeading eyebrow={`Countries (${selected.length} of ${MAX_COUNTRIES})`} />
      {selected.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
          {selected.map((name) => (
            <View key={name} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {name}
              </Text>
              <TouchableOpacity
                style={styles.chipClose}
                hitSlop={8}
                onPress={() => onChange(selected.filter((item) => item !== name))}
                accessibilityLabel={`Remove ${name}`}
              >
                <Text style={styles.chipCloseText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {loading ? (
        <InlineLoader />
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : (
        <SelectField
          label="Add country"
          title="Add a country"
          value={null}
          options={options}
          onChange={(name) => onChange([...selected, name].slice(0, MAX_COUNTRIES))}
          placeholder={full ? 'Up to 4 countries: remove one first' : 'Choose a country'}
          disabled={full}
          style={{ marginTop: 6 }}
        />
      )}
    </Card>
  );
}

function CompareTable({ title, subtitle, columns, rows }) {
  return (
    <Card>
      <SectionHeading title={title} subtitle={subtitle} />
      <DataTable head={['', ...columns.map((c) => c.country)]} rows={rows} firstWidth={170} columnWidth={104} />
    </Card>
  );
}

export default function PolicyCompareScreen({ navigation }) {
  const [country] = usePolicyCountry();
  const [picked, setPicked] = useState(null);
  const selected = picked ?? (country ? [country] : []);
  const { data, loading, error, retry } = useCountryCompare(selected);
  const columns = data?.countries || [];

  const presenceRows = RANKINGS.flatMap(({ key, label }) => [
    [`${label}: ranked universities`, ...columns.map((c) => c.rankings[key].count)],
    [`${label}: in top 500`, ...columns.map((c) => c.rankings[key].tiers['500'])],
    [`${label}: best rank`, ...columns.map((c) => (c.rankings[key].best_rank ? `#${c.rankings[key].best_rank}` : '–'))],
  ]);
  const accessRows = [
    ['Universities in dataset', ...columns.map((c) => c.attributes.count)],
    ...accessTableRows(columns.map((c) => c.attributes)),
  ];

  return (
    <AppLayout navigation={navigation} activeKey="compare" refreshing={false} onRefresh={selected.length ? retry : undefined}>
      <PageHeader
        eyebrow="Policymaker"
        title="Compare countries"
        subtitle="Ranking presence and student access of up to four countries."
        hint="Add up to four countries, then compare the two tables."
      />

      <CountryGate country={country}>
        <CountryChooser selected={selected} onChange={setPicked} />

        {selected.length === 0 ? (
          <EmptyState text="Add a country to start comparing." />
        ) : (
          <>
            {loading && (
              <Card>
                <LoadingBlock />
              </Card>
            )}
            <ErrorBox message={error} onRetry={retry} />

            {columns.length > 0 && (
              <>
                <CompareTable
                  title="Ranking presence"
                  subtitle="Latest edition of each ranking, kept apart from the attributes."
                  columns={columns}
                  rows={presenceRows}
                />
                <CompareTable
                  title="Access & affordability"
                  subtitle="Medians from the attributes dataset; fees and living cost are yearly, in USD."
                  columns={columns}
                  rows={accessRows}
                />
              </>
            )}
          </>
        )}
      </CountryGate>
    </AppLayout>
  );
}
