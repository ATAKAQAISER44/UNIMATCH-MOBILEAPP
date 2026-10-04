// src/components/researcher/RankStabilityPanel.js
//
// Rank Stability Test (UC-R-03 sensitivity analysis), mobile version of the
// web's ResearcherRankStability. Uses the weights currently set on the
// Weight Analysis screen. The test runs by itself whenever the tab is open
// and the weights or "How much to change" differ from the last run, so
// there is no run button.

import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import {
  Card,
  CollapsibleCard,
  ErrorBox,
  FindingCards,
  InlineLoader,
  LoadingBlock,
  OutlineButton,
  Pagination,
  ProgressBar,
  RankPill,
  SectionHeading,
  SegmentedControl,
  useLatestRequest,
  usePersistentToggle,
} from './ResearcherUI';
import UniversityLink from '../UniversityLink';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { runRankStability } from '../../services/researcherApi';
import { shareCSV } from '../../utils/researcherExport';
import { VERDICTS, buildStabilityFindings } from '../../utils/researchInsights';

const PAGE_SIZE = 20;
// Wait briefly so quick taps / slider moves start only one test.
const AUTO_RUN_DELAY_MS = 400;

const VARIATIONS = [
  { value: 0.1, label: 'Small', hint: '±10%' },
  { value: 0.2, label: 'Medium', hint: '±20%' },
  { value: 0.3, label: 'Large', hint: '±30%' },
];

const SORTS = [
  { value: 'rank', label: 'By rank' },
  { value: 'movement', label: 'Most movement' },
];

const STEPS = [
  ['Nudge the weights', 'Every weight is changed a little at random (e.g. 30% → 27% or 33%).'],
  ['Re-rank 500 times', 'The ranking is rebuilt for each set of weights.'],
  ['Measure the movement', 'Ranks that barely move are stable; big jumps mean the rank depends on exact weights.'],
];

function VerdictPill({ verdict }) {
  const info = VERDICTS[verdict];
  return (
    <View style={[styles.pill, { borderColor: info.colors.border, backgroundColor: info.colors.background }]}>
      <Text style={[styles.pillText, { color: info.colors.text }]}>{info.label}</Text>
    </View>
  );
}

// Centre dot = rank with your weights; teal to the left = how far it can
// rise, orange to the right = how far it can fall.
function MoveBar({ up, down, max }) {
  const half = (value) => `${(value / max) * 50}%`;

  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ height: 10, borderRadius: 999, backgroundColor: '#E2E8F0', justifyContent: 'center' }}>
        <View
          style={{
            position: 'absolute',
            right: '50%',
            width: half(up),
            height: 10,
            borderTopLeftRadius: 999,
            borderBottomLeftRadius: 999,
            backgroundColor: authTheme.colors.brandTeal,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: '50%',
            width: half(down),
            height: 10,
            borderTopRightRadius: 999,
            borderBottomRightRadius: 999,
            backgroundColor: '#F97316',
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: '50%',
            marginLeft: -7,
            width: 14,
            height: 14,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            backgroundColor: authTheme.colors.gray900,
          }}
        />
      </View>
      <View style={[styles.rowBetween, { marginTop: 3 }]}>
        <Text style={[styles.kvLabel, { color: authTheme.colors.brandTeal, fontWeight: '900' }]}>
          {up ? `▲ ${up} higher` : '—'}
        </Text>
        <Text style={[styles.kvLabel, { color: '#EA580C', fontWeight: '900' }]}>{down ? `▼ ${down} lower` : '—'}</Text>
      </View>
    </View>
  );
}

export default function RankStabilityPanel({
  datasetKey,
  year,
  weights,
  variation,
  onVariationChange,
  labelFor,
  disabled,
  active = true,
}) {
  const [stability, setStability] = useState(null);
  const [testedKey, setTestedKey] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('rank');
  const [retryKey, setRetryKey] = useState(0);
  const [howItWorksOpen, toggleHowItWorks] = usePersistentToggle('researcher-stability-how-it-works-open', false);
  const startRequest = useLatestRequest();

  const runKey = `${JSON.stringify(weights)}|${variation}|${retryKey}`;

  // Run (again) whenever the panel is visible and its inputs changed.
  useEffect(() => {
    if (!active || disabled || runKey === testedKey) return undefined;

    const isCurrent = startRequest();
    const timer = setTimeout(async () => {
      setRunning(true);
      setError('');

      try {
        // top_n: 0 = every university in the edition.
        const data = await runRankStability(datasetKey, { year, weights, variation, top_n: 0 });
        if (!isCurrent()) return;
        setStability(data);
        setTestedKey(runKey);
        setPage(1);
      } catch (runError) {
        if (!isCurrent()) return;
        setStability(null);
        setTestedKey(runKey);
        setError(runError.message);
      } finally {
        if (isCurrent()) setRunning(false);
      }
    }, AUTO_RUN_DELAY_MS);

    return () => clearTimeout(timer);
    // runKey covers weights and variation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, disabled, runKey, testedKey, datasetKey, year, startRequest]);

  const sortedResults = useMemo(() => {
    const rows = [...(stability?.results || [])];
    if (sortBy === 'movement') {
      rows.sort((a, b) => b.range_high - b.range_low - (a.range_high - a.range_low) || a.rank - b.rank);
    }
    return rows;
  }, [stability, sortBy]);

  const maxMove = useMemo(
    () => Math.max(1, ...sortedResults.map((row) => Math.max(row.rank - row.range_low, row.range_high - row.rank))),
    [sortedResults]
  );

  const findings = useMemo(() => buildStabilityFindings(stability, labelFor), [stability, labelFor]);

  function exportResults() {
    shareCSV(
      [
        'Rank (your weights)',
        'University',
        'Country',
        'Usual range from',
        'Usual range to',
        'Best rank',
        'Worst rank',
        'Kept same rank %',
        'Verdict',
      ],
      sortedResults.map((row) => [
        row.rank,
        row.name,
        row.country,
        row.range_low,
        row.range_high,
        row.best,
        row.worst,
        row.same_rank_pct,
        VERDICTS[row.verdict].label,
      ]),
      `rank-stability-${datasetKey}-${year}-${Math.round(stability.variation * 100)}pct.csv`
    );
  }

  const totalPages = Math.max(Math.ceil(sortedResults.length / PAGE_SIZE), 1);
  const pageRows = sortedResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const topImpact = stability?.indicator_impact?.[0]?.average_shift || 0.01;

  return (
    <View>
      <Card>
        <SectionHeading
          title="Rank stability"
          subtitle="Do ranks hold if your weights change a little?"
          right={stability && !running ? <OutlineButton title="CSV" small onPress={exportResults} /> : null}
        />

        <Text style={styles.label}>How much to change each weight</Text>
        <SegmentedControl options={VARIATIONS} value={variation} onChange={onVariationChange} style={{ marginBottom: 0 }} />
      </Card>

      <CollapsibleCard title="How does this test work?" open={howItWorksOpen} onToggle={toggleHowItWorks}>
        {STEPS.map(([title, text], index) => (
          <View key={title} style={[styles.finding, styles.rowTop, { alignItems: 'flex-start', borderColor: authTheme.colors.brandBorder, backgroundColor: '#F3FBF8' }]}>
            <View style={[styles.rankPill, { minWidth: 28, width: 28, borderRadius: 999, backgroundColor: authTheme.colors.brandTeal, borderWidth: 0 }]}>
              <Text style={[styles.rankPillText, { color: '#FFFFFF' }]}>{index + 1}</Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.findingTitle}>{title}</Text>
              <Text style={styles.findingText}>{text}</Text>
            </View>
          </View>
        ))}
      </CollapsibleCard>

      <ErrorBox message={error} onRetry={() => setRetryKey((value) => value + 1)} />

      {!stability ? (
        !error &&
        (running || (active && !disabled)) && (
          <Card>
            <LoadingBlock />
          </Card>
        )
      ) : (
        <View style={running ? { opacity: 0.5 } : null}>
          {running && <InlineLoader />}
          <View style={styles.statGrid}>
            {Object.entries(VERDICTS).map(([key, verdict]) => (
              <View
                key={key}
                style={[
                  styles.statCard,
                  { borderColor: verdict.colors.border, backgroundColor: verdict.colors.background, alignItems: 'center' },
                ]}
              >
                <Text style={[styles.statValue, { color: verdict.colors.text }]}>{stability.verdict_counts[key]}</Text>
                <Text style={[styles.statLabel, { color: verdict.colors.text }]}>{verdict.label}</Text>
              </View>
            ))}
          </View>

          <Card>
            <SectionHeading title="Key findings" />
            <FindingCards findings={findings} />
          </Card>

          <Card>
            <SectionHeading
              title={`All ${stability.results.length} universities`}
              subtitle={`Usual range = rank in 90% of ${stability.runs} tests`}
            />
            <SegmentedControl
              options={SORTS}
              value={sortBy}
              onChange={(value) => {
                setSortBy(value);
                setPage(1);
              }}
            />

            {pageRows.map((row) => (
              <View key={row.university_id || `${row.name}-${row.rank}`} style={styles.rowCard}>
                <View style={styles.rowTop}>
                  <RankPill rank={row.rank} />
                  <View style={styles.flex1}>
                    <UniversityLink
                      name={row.name}
                      country={row.country}
                      dataset={datasetKey}
                      rank={row.rank}
                      style={styles.rowName}
                      numberOfLines={2}
                    />
                    <Text style={styles.rowSub}>{row.country}</Text>
                  </View>
                  <VerdictPill verdict={row.verdict} />
                </View>

                <View style={[styles.rowBetween, { marginTop: 8 }]}>
                  <Text style={styles.kvLabel}>Usual range</Text>
                  <Text style={styles.kvValue}>
                    {row.range_low === row.range_high ? `#${row.rank}` : `#${row.range_low} – #${row.range_high}`}
                  </Text>
                </View>

                <MoveBar up={row.rank - row.range_low} down={row.range_high - row.rank} max={maxMove} />

              </View>
            ))}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </Card>

          {stability.indicator_impact.length > 0 && (
            <Card>
              <SectionHeading
                title="Which weight matters most"
                subtitle="Average places moved when only that weight changes"
              />
              {stability.indicator_impact.map((item) => (
                <View key={item.key} style={{ marginBottom: 9 }}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.kvValue, styles.flex1]} numberOfLines={1}>
                      {labelFor(item.key)}
                    </Text>
                    <Text style={[styles.kvValue, { color: authTheme.colors.brandTeal }]}>{item.average_shift} places</Text>
                  </View>
                  <ProgressBar share={(item.average_shift / Math.max(topImpact, 0.01)) * 100} height={9} style={{ marginTop: 4 }} />
                </View>
              ))}
            </Card>
          )}

          <Text style={[styles.noteText, { marginBottom: 8 }]}>
            Monte Carlo, {stability.runs} runs, fixed seed {stability.seed}. Usual range = 5th–95th percentile.
          </Text>
        </View>
      )}
    </View>
  );
}
