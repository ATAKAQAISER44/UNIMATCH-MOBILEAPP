// src/screens/administrator/AdminPerformanceScreen.js
//
// Institutional performance (web: administrator/AdministratorPerformance.jsx):
// rank in the chosen ranking, every indicator against the world, the country
// and similar-rank peers, rank over the years and why the rankings differ.

import React from 'react';
import { View } from 'react-native';

import { Text } from '../../components/AppText';
import AppLayout from '../../components/app/AppLayout';
import RankJourneyChart from '../../components/RankJourneyChart';
import { Card, ErrorBox, GradientButton, LoadingBlock, PageHeader, SectionHeading } from '../../components/researcher/ResearcherUI';
import { DataTable, gapCell } from '../../components/app/RoleUI';
import { InstitutionGate, RankingGlance, RankingSwitch, useRankingParam } from '../../components/administrator/AdminWidgets';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { officialMetricLabel } from '../../constants/researcherConstants';
import { RANKINGS, RANKING_ABOUT } from '../../constants/roleConstants';
import { useAdminInstitution, useInstitutionPerformance } from '../../services/adminApi';
import { shareCSV } from '../../utils/researcherExport';

const pctText = (value) => (value === null || value === undefined ? '–' : `${value}%`);

export default function AdminPerformanceScreen({ navigation, route }) {
  const [dataset, setDataset] = useRankingParam(route, navigation);
  const [institution] = useAdminInstitution();
  const { data, loading, error, retry } = useInstitutionPerformance(institution?.key);
  const perf = data?.rankings[dataset];
  const history = Object.fromEntries(RANKINGS.map(({ key }) => [key, data?.rankings[key]?.history || []]));

  function exportIndicators() {
    shareCSV(
      ['Ranking', 'Year', 'Indicator', 'Score', 'World percentile', 'Country percentile', 'Peer median', 'Gap'],
      perf.indicators.map((i) => [
        dataset.toUpperCase(),
        perf.year,
        officialMetricLabel(dataset, i.key),
        i.value ?? '',
        i.percentile ?? '',
        i.national_percentile ?? '',
        i.peer_median ?? '',
        i.gap ?? '',
      ]),
      `${data.name.replace(/ /g, '-')}-${dataset}-${perf.year}-indicators.csv`
    );
  }

  return (
    <AppLayout navigation={navigation} activeKey="performance">
      <PageHeader
        eyebrow="Administrator"
        title={data ? `${data.name}: performance` : 'Institutional performance'}
        subtitle="Your rank in each ranking, your strong and weak indicators, and the trend."
        hint="Pick a ranking, read the rank card and indicator table, then check the trend."
      >
        <RankingSwitch value={dataset} onChange={setDataset} year={perf?.year} />
      </PageHeader>

      <InstitutionGate institution={institution}>
        {loading && <LoadingBlock />}
        <ErrorBox message={error} onRetry={retry} />

        {data && (
          <>
            <Card>
              <RankingGlance
                rankingKey={dataset}
                perf={perf}
                strengthsTitle="Strengths (above peers)"
                weaknessesTitle="Weaknesses (below peers)"
              />
            </Card>

            {perf && (
              <Card>
                <SectionHeading
                  title="Every indicator"
                  subtitle={`Score: published 0-100 · World / Country: share you are at or above · Peers: median within ±${data.peer_rank_band} places · Gap: you minus peers.`}
                />
                <DataTable
                  head={['Indicator', 'Score', 'World', 'Country', 'Peers', 'Gap']}
                  firstWidth={160}
                  columnWidth={74}
                  rows={perf.indicators.map((i) => [
                    officialMetricLabel(dataset, i.key),
                    { text: i.value ?? 'Not published', bold: true },
                    pctText(i.percentile),
                    pctText(i.national_percentile),
                    i.peer_median ?? '–',
                    gapCell(i.gap),
                  ])}
                />
                <GradientButton title="Export CSV" small onPress={exportIndicators} style={{ marginTop: 10, alignSelf: 'flex-start' }} />
              </Card>
            )}

            <Card>
              <SectionHeading
                title="Rank over the years"
                subtitle="Higher on the chart is a better rank. Methods change over time, so read big jumps with care."
              />
              <View style={{ marginTop: 8 }}>
                <RankJourneyChart datasets={history} />
              </View>
            </Card>

            <Card>
              <SectionHeading title="Why the three rankings differ" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {RANKINGS.map(({ key, label }) => (
                  <View key={key} style={[styles.rowCard, { flexGrow: 1, flexBasis: 220, marginBottom: 0 }]}>
                    <Text style={styles.findingTitle}>
                      {label}: {data.rankings[key] ? `#${data.rankings[key].official_rank}` : 'not ranked'}
                    </Text>
                    <Text style={styles.findingText}>{RANKING_ABOUT[key]}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}
      </InstitutionGate>
    </AppLayout>
  );
}
