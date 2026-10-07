// src/components/rankings/UniversityTableRow.js

import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../AppText';

import { rankingsStyles as styles } from '../../styles/rankingsStyles';
import { authTheme } from '../../styles/authTheme';

import {
  formatRank,
  getCountry,
  getOfficialRank,
  getPersonalizedRank,
  getPersonalizedScore,
  getUniName,
  getRankNumber,
} from '../../utils/rankingsUtils';

const UniversityTableRow = memo(function UniversityTableRow({
  item,
  index,
  activeTab,
  onDetails,
  onCompare,
  onSave,
  compared,
  saved,
}) {
  const rank =
    activeTab === 'my'
      ? getPersonalizedRank(item, index)
      : getOfficialRank(item);

  // Highlight the real top 3 (rank 1-3), not the first row of every page.
  const rankNumber = getRankNumber(rank);
  const isTopThree = rankNumber !== null && rankNumber >= 1 && rankNumber <= 3;
  const name = getUniName(item);
  const country = getCountry(item);

  // PERF: handlers receive the row's item, so the parent can pass the same
  // stable functions to every row. Before, each row got new inline arrow
  // functions on every parent render, which defeated memo() and re-rendered
  // all visible rows (e.g. on every save/compare tap).
  const handleDetailsPress = () => {
    onDetails?.(item);
  };

  const handleComparePress = (event) => {
    event.stopPropagation();
    onCompare?.(item);
  };

  const handleSavePress = (event) => {
    event.stopPropagation();
    onSave?.(item);
  };

  return (
    <TouchableOpacity
      style={styles.tableRow}
      activeOpacity={0.78}
      onPress={handleDetailsPress}
    >
      <View style={styles.rankColumn}>
        <View style={[styles.rankPill, isTopThree && styles.rankPillTop]}>
          <Text style={[styles.rankText, isTopThree && styles.rankTextTop]}>
            {formatRank(rank)}
          </Text>
        </View>
      </View>

      <View style={styles.universityColumn}>
        <View style={styles.uniIconBox}>
          <Text style={styles.uniIcon}>⌂</Text>
        </View>

        <View style={styles.uniTextBlock}>
          <Text style={styles.universityName} numberOfLines={2}>
            {name}
          </Text>

          <Text style={styles.universitySub} numberOfLines={1}>
            {activeTab === 'my'
              ? `Score: ${getPersonalizedScore(item)} · ${country}`
              : country}
          </Text>
        </View>
      </View>

      <View style={styles.rowActions}>
        <TouchableOpacity
          style={local.action}
          activeOpacity={0.82}
          onPress={handleComparePress}
          accessibilityRole="button"
          accessibilityLabel={compared ? `Remove ${name} from compare` : `Add ${name} to compare`}
          accessibilityState={{ selected: compared }}
        >
          <View style={[styles.rowActionBtn, compared && styles.rowActionActive]}>
            <Text style={styles.rowActionText}>{compared ? '✓' : '+'}</Text>
          </View>
          <Text style={[local.actionLabel, compared && local.actionLabelActive]}>
            {compared ? 'Added' : 'Compare'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={local.action}
          activeOpacity={0.82}
          onPress={handleSavePress}
          accessibilityRole="button"
          accessibilityLabel={saved ? `Unsave ${name}` : `Save ${name}`}
          accessibilityState={{ selected: saved }}
        >
          <View style={[styles.rowActionBtn, saved && styles.rowSaveActive]}>
            <Text style={styles.rowActionText}>{saved ? '★' : '☆'}</Text>
          </View>
          <Text style={[local.actionLabel, saved && local.actionLabelActive]}>
            {saved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

export default UniversityTableRow;

const local = StyleSheet.create({
  // Whole column is the touch target (at least 44 x 44).
  action: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionLabel: {
    marginTop: 2,
    fontSize: 8.5,
    lineHeight: 10,
    fontWeight: '800',
    color: authTheme.colors.brandMuted,
  },

  actionLabelActive: {
    color: authTheme.colors.brandTeal,
  },
});
