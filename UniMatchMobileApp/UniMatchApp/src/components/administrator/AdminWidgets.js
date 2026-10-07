// src/components/administrator/AdminWidgets.js
//
// Pieces shared by the University Administrator screens (web:
// administrator/AdminWidgets.jsx):
//   RankSnapshotCard  - one ranking's rank, change since the last edition,
//                       position in the country and in the world.
//   IndicatorGapList  - strongest / weakest indicators against peers.
//   RankingSwitch     - QS / THE / ARWU tabs, kept in the route params.
//   InstitutionGate   - spinner while the saved university loads, the
//                       "choose first" card when none is set.
//   NumberField       - small labelled numeric input.

import React, { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';

import { Text, TextInput } from '../AppText';
import { LoadingBlock, SegmentedControl } from '../researcher/ResearcherUI';
import { ChooseFirst } from '../app/RoleUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { officialMetricLabel } from '../../constants/researcherConstants';
import { RANKINGS, RANKING_ORDER, RANKING_STYLE } from '../../constants/roleConstants';

export const GREEN = '#047857';
export const RED = '#B91C1C';

const RANKING_OPTIONS = RANKINGS.map(({ key, label }) => ({ value: key, label }));

// One ranking's headline numbers. A smaller number is a better rank.
export function RankSnapshotCard({ rankingKey, perf }) {
  const { label, color } = RANKING_STYLE[rankingKey];
  const change = perf?.previous_rank ? perf.previous_rank - perf.rank : null;

  return (
    <View style={[styles.rowCard, { marginBottom: 10 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 6 }} />
        <Text style={styles.findingTitle}>
          {label} {perf?.year || ''}
        </Text>
      </View>
      {!perf ? (
        <Text style={[styles.mutedText, { marginTop: 8 }]}>Not ranked by {label}.</Text>
      ) : (
        <>
          <Text style={[styles.statValue, { fontSize: 28, lineHeight: 34, marginTop: 4 }]} numberOfLines={1} adjustsFontSizeToFit>
            #{perf.official_rank}
          </Text>
          <Text
            style={[
              styles.pillText,
              { fontSize: 11.5, color: change > 0 ? GREEN : change < 0 ? RED : authTheme.colors.brandMuted },
            ]}
          >
            {change === null
              ? 'No earlier edition'
              : change === 0
                ? `Same as ${perf.previous_year}`
                : `${change > 0 ? '▲' : '▼'} ${Math.abs(change)} places since ${perf.previous_year}`}
          </Text>
          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <Text style={styles.mutedText}>In your country</Text>
            <Text style={[styles.kvValue, { marginTop: 0 }]}>
              {perf.national_rank} of {perf.national_total}
            </Text>
          </View>
          <View style={[styles.rowBetween, { marginTop: 2 }]}>
            <Text style={styles.mutedText}>Better than</Text>
            <Text style={[styles.kvValue, { marginTop: 0 }]}>
              {perf.global_percentile}% of {perf.total_ranked}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

// Strongest or weakest indicators: the gap is in points against similar-rank peers.
export function IndicatorGapList({ rankingKey, items = [], title, empty }) {
  return (
    <View style={{ marginBottom: 10, flexGrow: 1, flexBasis: 200 }}>
      <Text style={styles.eyebrow}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.mutedText}>{empty}</Text>
      ) : (
        items.map((item) => (
          <View key={item.key} style={[styles.rowBetween, { alignItems: 'flex-start', marginBottom: 4 }]}>
            <Text style={[styles.bodyText, styles.flex1, { marginRight: 8 }]}>{officialMetricLabel(rankingKey, item.key)}</Text>
            <Text style={{ fontSize: 12.5, fontWeight: '900', color: item.gap > 0 ? GREEN : RED }}>
              {item.gap > 0 ? '+' : ''}
              {item.gap} pts
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

// Snapshot + strengths + weaknesses of one ranking.
export function RankingGlance({ rankingKey, perf, strengthsTitle = 'Strengths', weaknessesTitle = 'Weaknesses' }) {
  return (
    <View>
      <RankSnapshotCard rankingKey={rankingKey} perf={perf} />
      {!!perf && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16 }}>
          <IndicatorGapList rankingKey={rankingKey} items={perf.strengths} title={strengthsTitle} empty="No indicator above peers." />
          <IndicatorGapList rankingKey={rankingKey} items={perf.weaknesses} title={weaknessesTitle} empty="No indicator below peers." />
        </View>
      )}
    </View>
  );
}

// Selected ranking kept in the route params (the web keeps it in ?dataset=).
export function useRankingParam(route, navigation, onChange) {
  const initial = RANKING_ORDER.includes(route?.params?.dataset) ? route.params.dataset : 'qs';
  const [dataset, setDataset] = useState(initial);
  const change = useCallback(
    (key) => {
      if (key === dataset) return;
      setDataset(key);
      navigation.setParams?.({ dataset: key });
      onChange?.(key);
    },
    [dataset, navigation, onChange]
  );
  return [dataset, change];
}

export function RankingSwitch({ value, onChange, year }) {
  return (
    <View style={{ marginTop: 12 }}>
      <SegmentedControl options={RANKING_OPTIONS} value={value} onChange={onChange} style={{ marginBottom: 0 }} />
      {!!year && <Text style={[styles.noteText, { marginTop: 6 }]}>Latest edition: {year}</Text>}
    </View>
  );
}

// undefined = still loading the saved university, null = none chosen yet.
export function InstitutionGate({ institution, children }) {
  if (institution === undefined) return <LoadingBlock />;
  if (institution === null) return <ChooseFirst what="university" />;
  return children;
}

// Keeps whole numbers only: digits, plus one leading "-" when negatives are
// allowed. max (optional) clamps the value while typing.
export function cleanNumberText(text, { negative = false, max } = {}) {
  const raw = String(text ?? '');
  const minus = negative && raw.trim().startsWith('-') ? '-' : '';
  const digits = raw.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return minus;
  if (max !== undefined && Number(digits) > max) return `${minus}${max}`;
  return `${minus}${digits}`;
}

// Numeric input. integer: digits only (negative allows a leading "-");
// max clamps while typing; error (true or a message) marks the box red and
// a message string is shown under it.
export function NumberField({
  label,
  value,
  onChangeText,
  placeholder,
  style,
  inputStyle,
  integer = false,
  negative = false,
  max,
  error,
  accessibilityLabel,
}) {
  const handleChange = integer
    ? (text) => onChangeText(cleanNumberText(text, { negative, max }))
    : onChangeText;

  return (
    <View style={style}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.textInput, { minHeight: 40 }, error && styles.inputError, inputStyle]}
        value={value === undefined || value === null ? '' : String(value)}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={!integer ? 'numeric' : negative ? Platform.select({ ios: 'numbers-and-punctuation', default: 'numeric' }) : 'number-pad'}
        maxLength={integer ? (max !== undefined ? String(max).length : 6) + (negative ? 1 : 0) : undefined}
        returnKeyType="done"
        accessibilityLabel={accessibilityLabel || label || placeholder}
      />
      {typeof error === 'string' && !!error && <Text style={[styles.errorText, { marginTop: 4 }]}>{error}</Text>}
    </View>
  );
}
