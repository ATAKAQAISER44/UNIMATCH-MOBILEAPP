
// src/components/rankings/RankingFilterCard.js

import React, { memo } from 'react';
import {
  ActivityIndicator,
  View,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput } from '../AppText';
import { LinearGradient } from 'expo-linear-gradient';

import { rankingsStyles as styles } from '../../styles/rankingsStyles';
import { authTheme } from '../../styles/authTheme';

const RankingFilterCard = memo(function RankingFilterCard({
  search,
  onSearchChange,
  countryFilter,
  rowsPerPage,
  onCountryPress,
  onRowsPress,
  onExport,
  exporting,
}) {
  return (
    <View style={styles.filterCard}>
      <Text style={styles.filterLabel}>Search University</Text>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search university or country..."
          placeholderTextColor="#94A3B8"
        />

        {!!search && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.filterLabel}>Country Filter</Text>

      <TouchableOpacity
        style={styles.selectBox}
        activeOpacity={0.86}
        onPress={onCountryPress}
      >
        <Text style={styles.selectText}>{countryFilter}</Text>
        <Text style={styles.selectArrow}>⌄</Text>
      </TouchableOpacity>

      <Text style={styles.filterLabel}>Rows Per Page</Text>

      <TouchableOpacity
        style={styles.selectBox}
        activeOpacity={0.86}
        onPress={onRowsPress}
      >
        <Text style={styles.selectText}>{rowsPerPage} rows</Text>
        <Text style={styles.selectArrow}>⌄</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
        activeOpacity={0.88}
        onPress={onExport}
        disabled={exporting}
      >
        <LinearGradient
          colors={authTheme.gradients.button}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.exportGradient}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.exportText}>▧  Export CSV  ⌄</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
});

export default RankingFilterCard;