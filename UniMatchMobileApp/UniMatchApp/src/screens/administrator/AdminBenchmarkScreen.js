// src/screens/administrator/AdminBenchmarkScreen.js
//
// Benchmarking (web: administrator/AdministratorBenchmark.jsx): the
// university side by side with a peer group (similar rank, same country,
// aspirational, or up to 5 of the administrator's choice) on the ranking
// indicators and the attributes, plus the gap to a target rank.

import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '../../components/AppText';
import AppLayout from '../../components/app/AppLayout';
import { Card, ErrorBox, GradientButton, LoadingBlock, PageHeader, SectionHeading } from '../../components/researcher/ResearcherUI';
import { DataTable, Pill, UniversityPicker } from '../../components/app/RoleUI';
import { GREEN, InstitutionGate, NumberField, RED, RankingSwitch, useRankingParam } from '../../components/administrator/AdminWidgets';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { officialMetricLabel } from '../../constants/researcherConstants';
import { STATUS_STYLE } from '../../constants/roleConstants';
import { useAdminInstitution, useBenchmark } from '../../services/adminApi';

const MAX_CUSTOM = 5;
const GROUPS = [
  ['similar', 'Similar rank', 'within ±25 places'],
  ['country', 'Same country', 'nearest in rank'],
  ['aspirational', 'Aspirational', '10-30 places above'],
  ['custom', 'My choice', 'up to 5 universities'],
];

function GroupChooser({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {GROUPS.map(([key, label, hint]) => {
        const active = key === value;
        return (
          <TouchableOpacity
            key={key}
            activeOpacity={0.85}
            onPress={() => onChange(key)}
            style={{
              flexGrow: 1,
              flexBasis: 130,
              minHeight: 44,
              borderRadius: 13,
              borderWidth: active ? 1.4 : 1,
              borderColor: active ? authTheme.colors.brandTeal : authTheme.colors.brandBorder,
              backgroundColor: active ? authTheme.colors.brandMintDeep : '#FFFFFF',
              paddingHorizontal: 10,
              paddingVertical: 7,
            }}
          >
            <Text style={[styles.findingTitle, { marginBottom: 0, color: active ? authTheme.colors.brandTeal : authTheme.colors.gray900 }]}>
              {label}
            </Text>
            <Text style={styles.noteText}>{hint}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function columnHead({ university, you }) {
  return {
    node: (
      <View>
        <Text style={[styles.tableHeadText, { color: you ? authTheme.colors.brandTeal : authTheme.colors.gray900 }]} numberOfLines={3}>
          {you ? 'You' : university.name}
        </Text>
        <Text style={styles.tableHeadText}>#{university.rank}</Text>
      </View>
    ),
  };
}

export default function AdminBenchmarkScreen({ navigation, route }) {
  const [dataset, setDataset] = useRankingParam(route, navigation);
  const [institution] = useAdminInstitution();
  const [group, setGroup] = useState('similar');
  const [custom, setCustom] = useState([]);
  const [targetInput, setTargetInput] = useState('');
  const [target, setTarget] = useState(null);

  // The first answer carries the suggested groups (and uses the similar-rank
  // one); another group sends its keys. An empty list falls back to similar rank.
  const base = useBenchmark(institution?.key, dataset, [], null);
  const peerKeys =
    group === 'custom' ? custom.map((u) => u.key) : group === 'similar' ? [] : (base.data?.suggested[group] || []).map((u) => u.key);
  const { data, loading, error, retry } = useBenchmark(base.data && institution?.key, dataset, peerKeys, target);
  const columns = data ? [data.you, ...data.peers] : [];
  const head = ['', ...columns.map((u, i) => columnHead({ university: u, you: i === 0 }))];

  return (
    <AppLayout navigation={navigation} activeKey="benchmark">
      <PageHeader
        eyebrow="Administrator"
        title="Benchmarking"
        subtitle="Compare with similar, national or aspirational universities, and see the gap to a target rank."
        hint="Pick a ranking and a peer group, compare side by side, then enter a target rank."
      >
        <RankingSwitch value={dataset} onChange={setDataset} year={data?.year} />
      </PageHeader>

      <InstitutionGate institution={institution}>
        <Card>
          <SectionHeading title="Peer group" />
          <View style={{ marginTop: 8 }}>
            <GroupChooser value={group} onChange={setGroup} />
          </View>

          {group === 'custom' && (
            <View style={{ marginTop: 12 }}>
              <UniversityPicker
                label={`Add a university (${custom.length}/${MAX_CUSTOM})`}
                disabled={custom.length >= MAX_CUSTOM}
                exclude={[institution?.key, ...custom.map((u) => u.key)]}
                onPick={(item) =>
                  setCustom((list) => (list.length >= MAX_CUSTOM || list.some((u) => u.key === item.key) ? list : [...list, item]))
                }
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6, marginTop: 8 }}>
                {custom.map((u) => (
                  <View key={u.key} style={[styles.chip, { maxWidth: '100%' }]}>
                    <Text style={styles.chipText} numberOfLines={1}>
                      {u.name}
                    </Text>
                    <TouchableOpacity
                      style={styles.chipClose}
                      hitSlop={8}
                      onPress={() => setCustom((list) => list.filter((x) => x.key !== u.key))}
                      accessibilityLabel={`Remove ${u.name}`}
                    >
                      <Text style={styles.chipCloseText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {custom.length === 0 && <Text style={styles.noteText}>None picked yet; the similar-rank group is shown meanwhile.</Text>}
              </View>
            </View>
          )}
        </Card>

        {(base.loading || loading) && <LoadingBlock />}
        <ErrorBox message={base.error} onRetry={base.retry} />
        {!base.error && <ErrorBox message={error} onRetry={retry} />}

        {data && (
          <>
            <Card>
              <SectionHeading
                title="Ranking indicators"
                subtitle={`Published ${dataset.toUpperCase()} ${data.year} scores (0-100); the best in each row is green.`}
              />
              <DataTable
                head={head}
                firstWidth={150}
                columnWidth={104}
                rows={data.metrics.map((m) => {
                  const best = Math.max(...columns.map((u) => u.indicators[m] ?? -1));
                  return [
                    officialMetricLabel(dataset, m),
                    ...columns.map((u) => {
                      const value = u.indicators[m];
                      return value !== null && value !== undefined && value === best ? { text: value, color: GREEN } : value ?? '–';
                    }),
                  ];
                })}
              />
            </Card>

            <Card>
              <SectionHeading title="Attributes" subtitle="Practical information, kept apart from the ranking scores." />
              <DataTable
                head={head}
                firstWidth={150}
                columnWidth={118}
                rows={data.attribute_columns.map((c) => [
                  c,
                  ...columns.map((u) => {
                    const cell = u.attributes[c];
                    const [label, tone] = STATUS_STYLE[cell?.status] || ['', null];
                    return {
                      node: (
                        <View>
                          <Text style={styles.tableCellText}>{cell?.value ?? '–'}</Text>
                          {!!label && label !== 'Sourced' && (
                            <View style={{ marginTop: 3 }}>
                              <Pill label={label} tone={tone} />
                            </View>
                          )}
                        </View>
                      ),
                    };
                  }),
                ])}
              />
            </Card>

            <Card>
              <SectionHeading title="Gap to a target rank" />
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                <NumberField
                  label="Target rank"
                  value={targetInput}
                  onChangeText={setTargetInput}
                  placeholder="e.g. 300"
                  style={{ flexGrow: 1, flexBasis: 120, maxWidth: 200 }}
                />
                <GradientButton
                  title="Show gap"
                  onPress={() => setTarget(Number(targetInput) > 0 ? Math.round(Number(targetInput)) : null)}
                />
              </View>
              {data.target && (
                <>
                  <Text style={[styles.noteText, { marginTop: 10 }]}>
                    Median of the {data.target.compared_with} universities within 10% of #{data.target.rank}. A positive gap is
                    the points you would need to gain.
                  </Text>
                  <DataTable
                    head={['Indicator', 'Yours', `Median at #${data.target.rank}`, 'Gap']}
                    firstWidth={150}
                    columnWidth={92}
                    rows={data.target.indicators.map((i) => [
                      officialMetricLabel(dataset, i.key),
                      i.yours ?? '–',
                      i.target_median ?? '–',
                      i.gap === null || i.gap === undefined
                        ? '–'
                        : i.gap > 0
                          ? { text: `+${i.gap} needed`, color: RED }
                          : { text: 'already above', color: GREEN },
                    ])}
                  />
                </>
              )}
            </Card>
          </>
        )}
      </InstitutionGate>
    </AppLayout>
  );
}
