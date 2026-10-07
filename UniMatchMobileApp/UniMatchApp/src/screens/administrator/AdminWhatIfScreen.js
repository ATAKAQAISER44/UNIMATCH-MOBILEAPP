// src/screens/administrator/AdminWhatIfScreen.js
//
// What-if (web: administrator/AdministratorWhatIf.jsx): the university's
// rank recalculated from the published scores under each student priority,
// under the administrator's own weights, and after improving one indicator.
// All scenarios go to the backend in one request, built exactly as the web.

import React, { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';

import { Text } from '../../components/AppText';
import AppLayout from '../../components/app/AppLayout';
import {
  Card,
  ErrorBox,
  GradientButton,
  InlineLoader,
  LoadingBlock,
  OutlineButton,
  PageHeader,
  SectionHeading,
  SelectField,
} from '../../components/researcher/ResearcherUI';
import { RankChange } from '../../components/app/RoleUI';
import { InstitutionGate, NumberField, RankingSwitch, useRankingParam } from '../../components/administrator/AdminWidgets';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { RESEARCHER_METRICS, officialDefaultWeights, officialMetricLabel } from '../../constants/researcherConstants';
import { PRIORITY_FOCUS } from '../../constants/roleConstants';
import { useAdminInstitution, useWhatIf } from '../../services/adminApi';

// "Improve one indicator": scores are on a 0-100 scale, so a change of more
// than 50 points either way is not a useful question.
export const MAX_POINTS = 50;

export function pointsError(text) {
  if (text === '' || text === '-') return '';
  const value = Number(text);
  if (!Number.isFinite(value) || value === 0) return 'Enter a change other than 0.';
  if (Math.abs(value) > MAX_POINTS) return `Use -${MAX_POINTS} to ${MAX_POINTS} points.`;
  return '';
}

// Same as the web: the focus indicators get three times their official
// weight; no focus (Balanced) weighs every indicator equally.
function priorityWeights(official, focus) {
  if (!focus) return Object.fromEntries(Object.keys(official).map((m) => [m, 1]));
  return Object.fromEntries(Object.entries(official).map(([m, w]) => [m, focus.includes(m) ? w * 3 : w]));
}

export default function AdminWhatIfScreen({ navigation, route }) {
  const [institution] = useAdminInstitution();
  const [draft, setDraft] = useState({});
  const [custom, setCustom] = useState(null);
  const [change, setChange] = useState({ metric: '', points: '' });
  const [improvement, setImprovement] = useState(null);

  const resetAll = useCallback(() => {
    setDraft({});
    setCustom(null);
    setImprovement(null);
    setChange({ metric: '', points: '' });
  }, []);
  const [dataset, setDataset] = useRankingParam(route, navigation, resetAll);

  const metrics = (RESEARCHER_METRICS[dataset] || []).map((m) => m.key);
  const official = officialDefaultWeights(dataset, metrics);

  const scenarios = [
    { name: 'baseline', weights: official },
    ...Object.entries(PRIORITY_FOCUS).map(([name, focus]) => ({
      name,
      weights: priorityWeights(official, focus?.[dataset] || (focus ? [] : null)),
    })),
    ...(custom ? [{ name: 'custom', weights: custom }] : []),
    ...(improvement ? [{ name: 'improvement', weights: official, changes: { [improvement.metric]: improvement.points } }] : []),
  ];

  const { data: fresh, loading, error, retry } = useWhatIf(institution?.key, dataset, scenarios);

  // Keep the last answer for this ranking on screen while a new scenario is
  // calculated, so the inputs do not disappear.
  const last = useRef({});
  if (fresh) last.current[dataset] = fresh;
  const data = fresh || last.current[dataset] || null;
  const result = (name) => data?.results.find((r) => r.name === name);
  const baseline = result('baseline')?.rank;
  const weightText = (m) => (draft[m] !== undefined ? draft[m] : String(official[m]));
  const pending = loading && !!data;
  const weightTotal = metrics.reduce((sum, m) => sum + (Number(weightText(m)) || 0), 0);
  const pointsMessage = pointsError(change.points);
  const canSimulate = !!change.metric && change.points !== '' && change.points !== '-' && !pointsMessage;

  function recalculate() {
    if (weightTotal <= 0) return;
    setCustom(Object.fromEntries(metrics.map((m) => [m, Math.max(0, Number(weightText(m)) || 0)])));
  }

  function simulate() {
    if (canSimulate) setImprovement({ metric: change.metric, points: Number(change.points) });
  }

  const outcome = (name) => (pending ? <InlineLoader style={{ padding: 4 }} /> : <RankChange rank={result(name)?.rank} baseline={baseline} />);

  return (
    <AppLayout navigation={navigation} activeKey="whatIf">
      <PageHeader
        eyebrow="Administrator"
        title="What-if"
        subtitle="Your rank under other weights, student priorities or one improved indicator."
        hint="Pick a ranking, read each student priority, then try your own weights."
      >
        <RankingSwitch value={dataset} onChange={setDataset} year={data?.year} />
      </PageHeader>

      <InstitutionGate institution={institution}>
        {loading && !data && <LoadingBlock />}
        <ErrorBox message={error} onRetry={retry} />

        {data && (
          <>
            <View style={[styles.warningBox, { marginBottom: 12 }]}>
              <Text style={styles.warningText}>
                These are estimates. Your official {dataset.toUpperCase()} rank is #{data.official_rank}; recalculated with the
                official weights it is #{baseline}. Every change is measured against #{baseline}.
              </Text>
            </View>

            <Card>
              <SectionHeading
                title="Through students' eyes"
                subtitle="Each priority gives its key indicators three times their official weight (Balanced: all equal)."
              />
              {Object.entries(PRIORITY_FOCUS).map(([name, focus], index) => (
                <View
                  key={name}
                  style={[
                    styles.rowBetween,
                    { flexWrap: 'wrap', rowGap: 4, paddingVertical: 9, alignItems: 'center' },
                    index > 0 && { borderTopWidth: 1, borderTopColor: authTheme.colors.brandBorder },
                  ]}
                >
                  <View style={[styles.flex1, { minWidth: 180, marginRight: 8 }]}>
                    <Text style={styles.findingTitle}>{name}</Text>
                    <Text style={styles.noteText}>
                      {focus
                        ? focus[dataset].length
                          ? focus[dataset].map((m) => officialMetricLabel(dataset, m)).join(', ')
                          : `no matching ${dataset.toUpperCase()} indicator`
                        : 'all indicators'}
                    </Text>
                  </View>
                  <RankChange rank={result(name)?.rank} baseline={baseline} />
                </View>
              ))}
            </Card>

            <Card>
              <SectionHeading title="Your own weights" subtitle="Change any weight, then recalculate." />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {metrics.map((m) => (
                  <View
                    key={m}
                    style={[styles.kvItem, { flexBasis: 220, flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }]}
                  >
                    <Text style={[styles.bodyText, styles.flex1, { marginRight: 8 }]}>{officialMetricLabel(dataset, m)}</Text>
                    <NumberField
                      value={weightText(m)}
                      onChangeText={(text) => setDraft((d) => ({ ...d, [m]: text }))}
                      integer
                      max={100}
                      accessibilityLabel={`${officialMetricLabel(dataset, m)} weight, 0 to 100`}
                      style={{ width: 72 }}
                      inputStyle={{ textAlign: 'center' }}
                    />
                  </View>
                ))}
              </View>
              <View style={[styles.rowBetween, { marginTop: 10 }]}>
                <Text style={styles.mutedText}>Weights 0–100. Total</Text>
                <Text style={styles.kvValue}>{Math.round(weightTotal * 10) / 10}</Text>
              </View>
              {weightTotal <= 0 && (
                <Text style={[styles.errorText, { marginTop: 4 }]}>Give at least one weight above 0.</Text>
              )}
              <View style={[styles.buttonRow, { alignItems: 'center', marginTop: 10 }]}>
                <GradientButton title="Recalculate" small onPress={recalculate} disabled={weightTotal <= 0} />
                <OutlineButton
                  title="Reset to official"
                  small
                  onPress={() => {
                    setDraft({});
                    setCustom(null);
                  }}
                />
                {!!custom && outcome('custom')}
              </View>
            </Card>

            <Card>
              <SectionHeading
                title="Improve one indicator"
                subtitle="With the official weights: what if one score went up (or down) by some points?"
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 8, marginTop: 8 }}>
                <SelectField
                  title="Indicator"
                  placeholder="Choose an indicator"
                  value={change.metric}
                  options={metrics.map((m) => ({ value: m, label: officialMetricLabel(dataset, m) }))}
                  onChange={(metric) => setChange((c) => ({ ...c, metric }))}
                  style={{ flexGrow: 1, flexBasis: 200 }}
                />
                <NumberField
                  value={change.points}
                  onChangeText={(points) => setChange((c) => ({ ...c, points }))}
                  placeholder="points"
                  integer
                  negative
                  accessibilityLabel={`Points, -${MAX_POINTS} to ${MAX_POINTS}`}
                  style={{ width: 90 }}
                />
                <GradientButton title="Simulate" onPress={simulate} disabled={!canSimulate} />
              </View>
              <Text style={[pointsMessage ? styles.errorText : styles.noteText, { marginTop: 6 }]}>
                {pointsMessage || `Points: -${MAX_POINTS} to ${MAX_POINTS} (e.g. 5).`}
              </Text>
              {!!improvement && <View style={{ marginTop: 10 }}>{outcome('improvement')}</View>}
            </Card>
          </>
        )}
      </InstitutionGate>
    </AppLayout>
  );
}
