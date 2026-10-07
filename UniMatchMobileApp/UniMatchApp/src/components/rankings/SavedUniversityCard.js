// src/components/rankings/SavedUniversityCard.js
//
// One saved university on the Rankings "Saved" tab (web RankingPage.jsx
// SavedUniversitiesTab): name, country, Official / Current rank and Source
// pills, and View details / Compare / Delete buttons.

import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../AppText';

import { authTheme } from '../../styles/authTheme';
import {
  formatRank,
  getCountry,
  getFirstAvailable,
  getOfficialRank,
  getUniName,
} from '../../utils/rankingsUtils';

const { colors } = authTheme;

function InfoPill({ label, value }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function CardButton({ label, icon, onPress, tone = 'default', active = false, accessibilityLabel }) {
  const danger = tone === 'danger';
  const color = danger ? colors.errorText : active || tone === 'primary' ? colors.brandTeal : colors.brandMuted;

  return (
    <TouchableOpacity
      style={[styles.button, active && styles.buttonActive, danger && styles.buttonDanger]}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={active ? { selected: true } : undefined}
    >
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[styles.buttonText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const SavedUniversityCard = memo(function SavedUniversityCard({
  item,
  compared,
  onDetails,
  onCompare,
  onRemove,
}) {
  const name = getUniName(item) || 'University';
  const country = getCountry(item) || 'N/A';
  const officialRank = getOfficialRank(item);
  const currentRank = getFirstAvailable(
    item,
    ['current_rank', 'my_rank', 'personalized_rank'],
    officialRank
  );
  const source = item?.source_dataset || item?.dataset || item?.source || '';

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconBox}>
          <Ionicons name="bookmark" size={18} color={colors.brandTeal} />
        </View>

        <TouchableOpacity
          style={styles.titleBlock}
          activeOpacity={0.8}
          onPress={() => onDetails?.(item)}
          accessibilityRole="link"
          accessibilityHint="Opens the university's page"
        >
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.country} numberOfLines={1}>
            {country}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pills}>
        <InfoPill label="Official rank" value={formatRank(officialRank)} />
        <InfoPill label="Current rank" value={formatRank(currentRank)} />
        {source ? <InfoPill label="Source" value={String(source).toUpperCase()} /> : null}
      </View>

      <View style={styles.actions}>
        <CardButton
          label="Details"
          accessibilityLabel="View details"
          icon="open-outline"
          tone="primary"
          onPress={() => onDetails?.(item)}
        />
        <CardButton
          label={compared ? 'Compared' : 'Compare'}
          icon={compared ? 'checkmark' : 'git-compare-outline'}
          active={compared}
          onPress={() => onCompare?.(item)}
          accessibilityLabel={compared ? `Remove ${name} from compare` : `Add ${name} to compare`}
        />
        <CardButton
          label="Delete"
          icon="trash-outline"
          tone="danger"
          onPress={() => onRemove?.(item)}
          accessibilityLabel={`Delete saved ${name}`}
        />
      </View>
    </View>
  );
});

export default SavedUniversityCard;

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    backgroundColor: colors.white,
  },

  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    backgroundColor: colors.brandMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  titleBlock: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },

  name: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: colors.gray900,
  },

  country: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.brandMuted,
  },

  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    backgroundColor: colors.brandMint,
  },

  pillLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.brandMuted,
    marginRight: 5,
    textTransform: 'uppercase',
  },

  pillValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: colors.brandTealDark,
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  button: {
    flexGrow: 1,
    flexBasis: 96,
    minHeight: 42,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  buttonActive: {
    borderColor: colors.brandTeal,
    backgroundColor: colors.brandCyanSoft,
  },

  buttonDanger: {
    borderColor: '#FECACA',
    backgroundColor: colors.errorBg,
  },

  buttonText: {
    fontSize: 12.5,
    fontWeight: '900',
  },
});
