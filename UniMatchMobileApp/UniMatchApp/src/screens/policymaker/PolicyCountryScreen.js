// src/screens/policymaker/PolicyCountryScreen.js
//
// Policymaker country analysis (web: policymaker/PolicymakerCountry).
// Ranking switch, indicator medians against region and world, the countries
// of the region, the trend of the country's best rank, and access &
// affordability medians from the attributes dataset.

import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Text } from '../../components/AppText';
import AppLayout from '../../components/app/AppLayout';
import { DataTable, gapCell } from '../../components/app/RoleUI';
import RankJourneyChart from '../../components/RankJourneyChart';
import {
  Card,
  ErrorBox,
  LoadingBlock,
  OutlineButton,
  PageHeader,
  SectionHeading,
  SegmentedControl,
} from '../../components/researcher/ResearcherUI';
import { CountryGate, accessTableRows, isOwnCountryRow } from '../../components/policymaker/PolicyUI';
import { officialMetricLabel } from '../../constants/researcherConstants';
import { RANKINGS, RANKING_STYLE } from '../../constants/roleConstants';
import { useCountryOverview, usePolicyCountry } from '../../services/policyApi';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';

const RANKING_OPTIONS = RANKINGS.map(({ key, label }) => ({ value: key, label }));
const REGION_PREVIEW = 10;

function IndicatorSection({ data, dataset, country }) {
  const r = data.rankings[dataset];
  const label = RANKING_STYLE[dataset].label;
  const rows = r.metrics.map((m) => {
    const mine = r.country.indicators[m];
    const world = r.world.indicators[m];
    const gap = mine !== null && mine !== undefined && world !== null && world !== undefined
      ? Math.round((mine - world) * 10) / 10
      : null;
    return [officialMetricLabel(dataset, m), { text: mine, bold: true }, r.region.indicators[m], world, gapCell(gap)];
  });

  return (
    <Card>
      <SectionHeading
        eyebrow={`${label} ${r.year}`}
        title="Rankings: indicator medians"
        subtitle={`Median score in ${country} (${r.country.count}), ${data.region} (${r.region.count}) and the world (${r.world.count}). Gap = ${country} minus world.`}
      />
      {r.country.count === 0 ? (
        <Text style={[styles.mutedText, { marginTop: 8 }]}>{country} has no university in this ranking.</Text>
      ) : (
        <DataTable head={['Indicator', country, data.region, 'World', 'Gap']} rows={rows} firstWidth={160} columnWidth={84} />
      )}
    </Card>
  );
}

function RegionSection({ data, dataset, country }) {
  const [showAll, setShowAll] = useState(false);
  const r = data.rankings[dataset];
  const list = r.region_countries || [];

  // Collapsed: the first rows plus the policymaker's own country if it is further down.
  const visible = showAll
    ? list
    : list.filter((row, index) => index < REGION_PREVIEW || isOwnCountryRow(row, country));

  const rows = visible.map((row) => {
    const own = isOwnCountryRow(row, country);
    const cell = (text) => (own ? { text, bold: true, color: authTheme.colors.brandTeal } : text);
    return [cell(own ? `${row.name} (you)` : row.name), cell(row.count), cell(row.top_500), cell(row.best_rank ? `#${row.best_rank}` : '–')];
  });

  return (
    <Card>
      <SectionHeading
        title={`Countries in ${data.region}`}
        subtitle={`Ranked universities per country in ${RANKING_STYLE[dataset].label} ${r.year}, most top-500 first.`}
      />
      {list.length === 0 ? (
        <Text style={[styles.mutedText, { marginTop: 8 }]}>No country in {data.region} is ranked here.</Text>
      ) : (
        <>
          <DataTable head={['Country', 'Ranked', 'Top 500', 'Best rank']} rows={rows} firstWidth={150} columnWidth={78} />
          {list.length > REGION_PREVIEW && (
            <OutlineButton
              title={showAll ? 'Show fewer' : `Show all ${list.length}`}
              small
              onPress={() => setShowAll((value) => !value)}
              style={{ alignSelf: 'flex-start', marginTop: 10, minHeight: 36 }}
            />
          )}
        </>
      )}
    </Card>
  );
}

function TrendSection({ data, dataset, country }) {
  const chartData = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(data.trend).map(([key, points]) => [
          key,
          points.filter((p) => p.rank !== null && p.rank !== undefined).map((p) => ({ year: p.year, rank: p.rank })),
        ])
      ),
    [data]
  );
  // Newest edition first so phones see the latest years without scrolling.
  const points = [...(data.trend[dataset] || [])].reverse();

  return (
    <Card>
      <SectionHeading
        title="Trend"
        subtitle="Rank of the country's best university in each edition (higher is better)."
      />
      <View style={{ marginTop: 8 }}>
        <RankJourneyChart datasets={chartData} emptyText={`${country} has no ranked university in these editions.`} />
      </View>
      {points.length > 0 && (
        <DataTable
          caption={`${RANKING_STYLE[dataset].label} by edition`}
          head={['Year', ...points.map((p) => String(p.year))]}
          rows={[
            ['Ranked', ...points.map((p) => p.count)],
            ['Top 500', ...points.map((p) => p.top_500)],
          ]}
          firstWidth={78}
          columnWidth={56}
        />
      )}
    </Card>
  );
}

function AccessSection({ data, country }) {
  const scopes = ['country', 'region', 'world'].map((scope) => data.access[scope]);
  return (
    <Card>
      <SectionHeading
        title="Access & affordability"
        subtitle={`Medians from the attributes dataset (${data.access.country.count} universities in ${country}); yearly USD, some values are estimates.`}
      />
      <DataTable head={['', country, data.region, 'World']} rows={accessTableRows(scopes)} firstWidth={170} columnWidth={92} />
    </Card>
  );
}

export default function PolicyCountryScreen({ navigation, route }) {
  const [country] = usePolicyCountry();
  const [dataset, setDataset] = useState(route?.params?.dataset || 'qs');
  const { data, loading, error, retry } = useCountryOverview(country);

  return (
    <AppLayout navigation={navigation} activeKey="country" refreshing={false} onRefresh={country ? retry : undefined}>
      <PageHeader
        eyebrow="Policymaker"
        title={country ? `${country}: country analysis` : 'Country analysis'}
        subtitle="Where the country's universities are strong or behind, how that changed, and how open they are."
        hint="Pick a ranking, read the gaps and the region, then the trend and access."
      />

      <CountryGate country={country}>
        <SegmentedControl options={RANKING_OPTIONS} value={dataset} onChange={setDataset} />

        {loading && (
          <Card>
            <LoadingBlock />
          </Card>
        )}
        <ErrorBox message={error} onRetry={retry} />

        {data && (
          <>
            <IndicatorSection data={data} dataset={dataset} country={country} />
            <RegionSection key={dataset} data={data} dataset={dataset} country={country} />
            <TrendSection data={data} dataset={dataset} country={country} />
            <AccessSection data={data} country={country} />
          </>
        )}
      </CountryGate>
    </AppLayout>
  );
}
