// src/components/student/StudentUI.js
//
// Small pieces shared by the Student screens (Saved Universities, Compare
// Universities, My Shortlist):
//   savedEntries   - the saved list de-duplicated by name + country.
//   HeaderCount    - "Total saved 4" / "Compare 2/3" box inside PageHeader.
//   MiniStat       - small label + value box (Official / Current rank).
//   TrashButton    - round red remove button.
//   EmptyCard      - one-sentence empty state with an action button.
//   rankLabel      - "#12" from "12", "=12" or "#12"; "N/A" when missing.

import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../AppText';
import { EmptyState, GradientButton } from '../researcher/ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { identityKey } from '../../services/universitySearch';
import { getCountry, getUniName } from '../../utils/rankingsUtils';

const PLACEHOLDER_NAMES = new Set(['', 'university', 'unknown university']);

export const cleanName = (item) => {
  const name = String(getUniName(item) || '').trim();
  return PLACEHOLDER_NAMES.has(name.toLowerCase()) ? '' : name;
};

export const cleanCountry = (item) => {
  const country = String(getCountry(item) || '').trim();
  return country === 'Unknown Country' ? '' : country;
};

export const datasetOf = (item) =>
  String(item?.dataset || item?.source_dataset || item?.saved_dataset || '').toLowerCase();

export function rankLabel(value) {
  if (value === null || value === undefined) return 'N/A';
  const text = String(value).trim().replace(/^#/, '');
  return !text || text === '—' || text === '-' ? 'N/A' : `#${text}`;
}

// One entry per university (name + country), keeping every stored copy so a
// remove deletes all of them. Blank names are dropped.
export function savedEntries(items = []) {
  const map = new Map();
  items.forEach((item) => {
    const name = cleanName(item);
    if (!name) return;
    const country = cleanCountry(item);
    const key = identityKey(name, country);
    const existing = map.get(key);
    if (existing) existing.copies.push(item);
    else map.set(key, { key, item, name, country, dataset: datasetOf(item), copies: [item] });
  });
  return [...map.values()];
}

export function HeaderCount({ label, value }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        marginTop: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: authTheme.colors.brandBorder,
        backgroundColor: authTheme.colors.brandMintDeep,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Text style={[styles.eyebrow, { marginBottom: 0 }]}>{label}</Text>
      <Text style={[styles.statValue, { fontSize: 20, lineHeight: 24 }]}>{value}</Text>
    </View>
  );
}

export function MiniStat({ label, value }) {
  return (
    <View style={[styles.kvItem, { flexBasis: 100, alignItems: 'center' }]}>
      <Text style={styles.kvLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.kvValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {value}
      </Text>
    </View>
  );
}

export function TrashButton({ onPress, label = 'Remove' }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#FECACA',
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="trash-outline" size={17} color="#DC2626" />
    </TouchableOpacity>
  );
}

export function EmptyCard({ text, buttonTitle, onPress }) {
  return (
    <EmptyState text={text}>
      {buttonTitle ? <GradientButton small title={buttonTitle} onPress={onPress} style={{ marginTop: 12 }} /> : null}
    </EmptyState>
  );
}

export const DATASET_TONE = {
  color: '#047857',
  backgroundColor: '#ECFDF5',
  borderColor: '#A7F3D0',
};

export const COUNTRY_TONE = {
  color: '#0E7490',
  backgroundColor: '#ECFEFF',
  borderColor: '#A5F3FC',
};
