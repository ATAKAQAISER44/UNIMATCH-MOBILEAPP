// src/components/rankings/UniversityTableRow.js

import React, { memo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../AppText';

import { rankingsStyles as styles } from '../../styles/rankingsStyles';

import {
  formatRank,
  getCountry,
  getOfficialRank,
  getPersonalizedRank,
  getPersonalizedScore,
  getUniName,
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
        <View style={[styles.rankPill, index === 0 && styles.rankPillTop]}>
          <Text style={[styles.rankText, index === 0 && styles.rankTextTop]}>
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
            {getUniName(item)}
          </Text>

          {activeTab !== 'official' && (
            <Text style={styles.universitySub} numberOfLines={1}>
              {activeTab === 'my'
                ? `Score: ${getPersonalizedScore(item)}`
                : getCountry(item)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rowActions}>
        <TouchableOpacity
          style={[styles.rowActionBtn, compared && styles.rowActionActive]}
          activeOpacity={0.82}
          onPress={handleComparePress}
        >
          <Text style={styles.rowActionText}>{compared ? '✓' : '+'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rowActionBtn, saved && styles.rowSaveActive]}
          activeOpacity={0.82}
          onPress={handleSavePress}
        >
          <Text style={styles.rowActionText}>{saved ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

export default UniversityTableRow;