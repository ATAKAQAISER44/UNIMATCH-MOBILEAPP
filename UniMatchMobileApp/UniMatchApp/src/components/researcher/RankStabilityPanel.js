// src/components/researcher/RankStabilityPanel.js
//
// Rank Stability Test (UC-R-03 sensitivity analysis), mobile version of the
// web's ResearcherRankStability. Uses the weights currently set on the
// Weight Analysis screen.

import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import {
  Card,
  CollapsibleCard,
  EmptyState,
  ErrorBox,
  FindingCards,
  GradientButton,
  OutlineButton,
  Pagination,
  ProgressBar,
  RankPill,
  SectionHeading,
  SegmentedControl,
  WarningBox,
  usePersistentToggle,
} from './ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { runRankStability } from '../../services/researcherApi';
import { shareCSV } from '../../utils/researcherExport';
import { VERDICTS, buildStabilityFindings, describeRow } from '../../utils/researchInsights';

const PAGE_SIZE = 10;

const VARIATIONS = [
  { value: 0.1, label: 'Small', hint: 'each ±10%' },
  { value: 0.2, label: 'Medium', hint: 'each ±20%' },
  { value: 0.3, label: 'Large', hint: 'each ±30%' },
];

const SORTS = [
  { value: 'rank', label: 'Sort by rank' },
  { value: 'movement', label: 'Most movement' },
];

const STEPS = [
  [
    'Nobody knows the perfect weight',
    "You may give Academic Reputation 30%. But 27% or 33% would be just as reasonable. Small choices like this should not decide a university's rank.",
  ],
  [
    'Try many slightly different weights',
    'The test changes every weight a little at random (e.g. 30% becomes 27% or 33%) and builds the ranking again — 500 times.',
  ],
  [
    'See how much each rank moves',
    'If a university stays around the same place every time, its rank is stable and trustworthy. If it jumps around, its rank depends on the exact weights.',
  ],
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
}) {
  const [stability, setStability] = useState(null);
  const [testedWeightsKey, setTestedWeightsKey] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('rank');
  const [howItWorksOpen, toggleHowItWorks] = usePersistentToggle('researcher-stability-how-it-works-open');

  const weightsKey = JSON.stringify(weights);
  const isOutdated = stability && testedWeightsKey !== weightsKey;

  async function runTest() {
    setRunning(true);
    setError('');

    try {
      const data = await runRankStability(datasetKey, { year, weights, variation, top_n: 100 });
      setStability(data);
      setTestedWeightsKey(weightsKey);
      setPage(1);
    } catch (runError) {
      setStability(null);
      setError(runError.message);
    } finally {
      setRunning(false);
    }
  }

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
          eyebrow="Sensitivity analysis"
          title="Rank Stability Test"
          subtitle="Are the experimental ranks trustworthy, or would they change if the weights were slightly different? This test uses the weights you set above."
          right={stability ? <OutlineButton title="Export CSV" small onPress={exportResults} /> : null}
        />

        <Text style={styles.label}>How much to change weights</Text>
        <SegmentedControl options={VARIATIONS} value={variation} onChange={onVariationChange} />

        <GradientButton
          title={running ? 'Running 500 tests...' : stability ? 'Run Test Again' : 'Test Rank Stability'}
          loading={running}
          disabled={disabled}
          onPress={runTest}
        />
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

      <ErrorBox message={error} />

      {isOutdated ? (
        <WarningBox message="You changed the weights after this test. Run the test again to see results for the new weights." />
      ) : null}

      {!stability ? (
        !error && (
          <Card>
            <EmptyState text='Set your weights, choose how much to change them, and press "Test Rank Stability".' />
          </Card>
        )
      ) : (
        <View style={isOutdated ? { opacity: 0.6 } : null}>
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
                <Text style={[styles.statHint, { textAlign: 'center' }]}>{verdict.meaning}</Text>
              </View>
            ))}
          </View>

          <Card>
            <SectionHeading eyebrow="Key findings" title="What the test shows" />
            <FindingCards findings={findings} />
          </Card>

          <Card>
            <SectionHeading
              eyebrow="University by university"
              title={`Top ${stability.results.length} universities`}
              subtitle={`${stability.runs} tests · each weight changed by up to ±${Math.round(stability.variation * 100)}%. "Usual range" = rank in 90% of tests.`}
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
                    <Text style={styles.rowName} numberOfLines={2}>
                      {row.name}
                    </Text>
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

                <Text style={[styles.mutedText, { marginTop: 6 }]}>{describeRow(row, stability.runs)}</Text>
              </View>
            ))}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </Card>

          {stability.indicator_impact.length > 0 && (
            <Card>
              <SectionHeading
                eyebrow="Which weight matters most?"
                title="Influence of each weight"
                subtitle={`Each weight was changed on its own by ±${Math.round(stability.variation * 100)}%. The bar shows how many places the top universities moved on average. Longer bar = choose this weight more carefully.`}
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
            Method: Monte Carlo sensitivity analysis — {stability.runs} runs, each weight multiplied by a random factor
            between {Number((1 - stability.variation).toFixed(2))} and {Number((1 + stability.variation).toFixed(2))} and the
            weights re-scaled to 100%. "Usual range" is the 5th–95th percentile of the ranks. Fixed random seed (
            {stability.seed}), so the same weights always give the same result.
          </Text>
        </View>
      )}
    </View>
  );
}
