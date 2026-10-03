// src/components/researcher/CorrelationHeatmap.js
//
// Mobile version of the web's ResearcherCorrelationHeatmap. Long indicator
// names do not fit as column headers on a phone, so rows and columns are
// numbered and a legend maps each number to its indicator. Tap any box to
// read what it means.

import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Card, CollapsibleCard, FindingCards, SectionHeading, usePersistentToggle } from './ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { buildCorrelationFindings, describePair, strengthOf } from '../../utils/researchInsights';

const POSITIVE_RGB = '0, 140, 140';
const NEGATIVE_RGB = '234, 88, 12';
const CELL = 44;
const LABEL_COL = 34;

function cellStyle(value) {
  if (value == null) return { backgroundColor: '#F8FAFC', color: '#94A3B8' };
  const alpha = Math.min(Math.abs(value), 1) * 0.9 + 0.05;
  return {
    backgroundColor: `rgba(${value >= 0 ? POSITIVE_RGB : NEGATIVE_RGB}, ${alpha})`,
    color: Math.abs(value) > 0.55 ? '#FFFFFF' : '#0F172A',
  };
}

function ColorCell({ value, size = CELL, active, onPress, children }) {
  const { backgroundColor, color } = cellStyle(value);
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        width: size,
        height: size - 4,
        margin: 2,
        borderRadius: 7,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: active ? 2 : 0,
        borderColor: authTheme.colors.gray900,
      }}
    >
      <Text style={{ fontSize: 11.5, fontWeight: '900', color }}>{children ?? (value ?? '–')}</Text>
    </Wrapper>
  );
}

function ColorScale() {
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', height: 10, borderRadius: 999, overflow: 'hidden' }}>
        {[-1, -0.75, -0.5, -0.25, -0.05, 0.05, 0.25, 0.5, 0.75, 1].map((stop) => (
          <View key={stop} style={{ flex: 1, backgroundColor: cellStyle(stop).backgroundColor }} />
        ))}
      </View>
      <View style={[styles.rowBetween, { marginTop: 3 }]}>
        {['-1', '-0.5', '0', '+0.5', '+1'].map((stop) => (
          <Text key={stop} style={[styles.kvLabel, { fontSize: 9.5 }]}>
            {stop}
          </Text>
        ))}
      </View>
      <View style={styles.rowBetween}>
        <Text style={[styles.kvLabel, { color: authTheme.colors.gray900 }]}>opposite</Text>
        <Text style={[styles.kvLabel, { color: authTheme.colors.gray900 }]}>no link</Text>
        <Text style={[styles.kvLabel, { color: authTheme.colors.gray900 }]}>move together</Text>
      </View>
    </View>
  );
}

const EXAMPLES = [
  {
    value: 0.9,
    title: 'Close to +1: move together',
    text: 'Like height and shoe size: when one is high, the other is almost always high too.',
  },
  {
    value: 0,
    title: 'Close to 0: no link',
    text: 'Like shoe size and exam marks: knowing one tells you nothing about the other.',
  },
  {
    value: -0.8,
    title: 'Close to −1: opposite',
    text: 'Like hours of sleep lost and energy: when one goes up, the other goes down.',
  },
];

function HowToReadCorrelation() {
  const [open, toggle] = usePersistentToggle('researcher-correlation-how-to-read-open');

  return (
    <CollapsibleCard eyebrow="New to correlation?" title="How to read the heatmap" open={open} onToggle={toggle}>
      <Text style={styles.bodyText}>
        Each box gives one number between <Text style={styles.boldText}>−1</Text> and{' '}
        <Text style={styles.boldText}>+1</Text>. It answers one question: "If a university scores high in this
        indicator, does it also score high in that one?"
      </Text>
      <View style={{ marginTop: 10 }}>
        {EXAMPLES.map((example) => (
          <View key={example.title} style={[styles.finding, styles.rowTop, { borderColor: authTheme.colors.brandBorder, backgroundColor: '#F3FBF8' }]}>
            <ColorCell value={example.value} size={46} />
            <View style={[styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.findingTitle}>{example.title}</Text>
              <Text style={styles.findingText}>{example.text}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={[styles.finding, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB', marginBottom: 0 }]}>
        <Text style={styles.findingTitle}>Why does a researcher need this?</Text>
        <Text style={styles.findingText}>
          If two indicators are very closely linked (dark teal, 0.8 or more), they measure almost the same thing.
          Giving both a high weight in Weight Analysis counts the same strength twice. Indicators with a weak link
          add new information. Darker colour = stronger link; teal = together, orange = opposite.
        </Text>
      </View>
    </CollapsibleCard>
  );
}

export default function CorrelationHeatmap({ correlation, labelFor, overallKey, totalUniversities }) {
  const keys = useMemo(() => correlation?.keys || [], [correlation]);
  const [selected, setSelected] = useState(null);

  const cells = useMemo(() => {
    const result = [];
    keys.forEach((a, i) => {
      keys.forEach((b, j) => {
        if (j <= i) return;
        result.push({
          a,
          b,
          labelA: labelFor(a),
          labelB: labelFor(b),
          value: correlation.matrix[i][j],
          pairs: correlation.pairs[i][j],
        });
      });
    });
    return result;
  }, [keys, correlation, labelFor]);

  const findings = useMemo(
    () => buildCorrelationFindings(cells, keys.includes(overallKey) ? overallKey : null),
    [cells, keys, overallKey]
  );

  if (keys.length < 2) {
    return (
      <Card>
        <Text style={[styles.emptyText, { paddingVertical: 12 }]}>
          Not enough data to compare indicators here. At least {correlation?.min_pairs ?? 10} universities need
          scores in two or more indicators — try "All Countries" or another dataset.
        </Text>
      </Card>
    );
  }

  const activeCell =
    selected ||
    [...cells].filter((cell) => cell.value != null).sort((x, y) => Math.abs(y.value) - Math.abs(x.value))[0] ||
    null;

  const overallIndex = keys.indexOf(overallKey);
  const overallPairs = overallIndex >= 0 ? correlation.pairs[overallIndex][overallIndex] : null;

  return (
    <>
      <HowToReadCorrelation />

      {findings.length > 0 && (
        <Card>
          <SectionHeading eyebrow="Key findings" title="Which indicators go together" />
          <FindingCards findings={findings} />
        </Card>
      )}

      <Card>
        <SectionHeading
          eyebrow="Heatmap"
          title="How strongly each pair of indicators is linked"
          subtitle="Find one indicator number on the left and another along the top. Tap any box to read what it means. Swipe sideways if the grid is wider than the screen."
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: LABEL_COL }} />
              {keys.map((key, j) => (
                <View key={key} style={{ width: CELL + 4, alignItems: 'center', paddingBottom: 2 }}>
                  <Text style={[styles.kvLabel, { color: authTheme.colors.gray900, fontWeight: '900' }]}>{j + 1}</Text>
                </View>
              ))}
            </View>

            {keys.map((rowKey, i) => (
              <View key={rowKey} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: LABEL_COL, alignItems: 'center' }}>
                  <Text style={[styles.kvLabel, { color: authTheme.colors.gray900, fontWeight: '900' }]}>{i + 1}</Text>
                </View>
                {keys.map((colKey, j) => {
                  if (i === j) {
                    return (
                      <View
                        key={colKey}
                        style={{
                          width: CELL,
                          height: CELL - 4,
                          margin: 2,
                          borderRadius: 7,
                          backgroundColor: '#F1F5F9',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#94A3B8' }}>same</Text>
                      </View>
                    );
                  }

                  const value = correlation.matrix[i][j];
                  const isActive =
                    activeCell &&
                    ((activeCell.a === rowKey && activeCell.b === colKey) ||
                      (activeCell.a === colKey && activeCell.b === rowKey));

                  return (
                    <ColorCell
                      key={colKey}
                      value={value}
                      active={isActive}
                      onPress={() =>
                        setSelected({
                          a: rowKey,
                          b: colKey,
                          labelA: labelFor(rowKey),
                          labelB: labelFor(colKey),
                          value,
                          pairs: correlation.pairs[i][j],
                        })
                      }
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        <ColorScale />

        {activeCell && (
          <View style={[styles.finding, { marginTop: 12, borderColor: authTheme.colors.brandBorder, backgroundColor: '#F3FBF8' }]}>
            <Text style={styles.eyebrow}>{selected ? 'Selected box' : 'Strongest link'}</Text>
            <Text style={[styles.findingTitle, { fontSize: 13.5 }]}>
              {activeCell.labelA} & {activeCell.labelB}
            </Text>
            {activeCell.value != null && (
              <View style={[styles.rowTop, { marginVertical: 6 }]}>
                <ColorCell value={activeCell.value} size={54} />
                <Text style={[styles.findingTitle, { marginLeft: 8, marginBottom: 0 }]}>
                  {strengthOf(activeCell.value)}{' '}
                  {activeCell.value < 0 && Math.abs(activeCell.value) >= 0.2 ? 'opposite ' : ''}link
                </Text>
              </View>
            )}
            <Text style={styles.bodyText}>
              {describePair(
                activeCell.labelA,
                activeCell.labelB,
                activeCell.value,
                activeCell.pairs,
                activeCell.a === overallKey || activeCell.b === overallKey
              )}
            </Text>
          </View>
        )}

        <Text style={[styles.label, { marginTop: 12 }]}>Legend</Text>
        {keys.map((key, index) => (
          <Text key={key} style={[styles.mutedText, { marginBottom: 2 }]}>
            <Text style={styles.boldText}>{index + 1}</Text> = {labelFor(key)}
          </Text>
        ))}

        <Text style={styles.noteText}>
          Method: Spearman rank correlation (it compares the order of universities, so a few extreme scores cannot
          distort it). Each box uses only universities that have both scores.
          {overallPairs != null && overallPairs < totalUniversities
            ? ` The overall score row uses only the ${overallPairs} universities with an exact overall score.`
            : ''}
        </Text>
      </Card>
    </>
  );
}
