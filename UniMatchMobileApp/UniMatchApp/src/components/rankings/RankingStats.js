// src/components/rankings/RankingStats.js

import React, { memo } from 'react';
import {
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../AppText';
import { authTheme } from '../../styles/authTheme';

import { rankingsStyles as styles } from '../../styles/rankingsStyles';

const StatCard = memo(function StatCard({ value, label, icon }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTextBlock}>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
        <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{label}</Text>
      </View>

      <View style={styles.statIconBox}>
        {/^[a-z-]+$/.test(String(icon)) ? (
          <Ionicons name={icon} size={16} color={authTheme.colors.brandTeal} />
        ) : (
          <Text style={styles.statIcon}>{icon}</Text>
        )}
      </View>
    </View>
  );
});

const RankingStats = memo(function RankingStats({ cards }) {
  return (
    <View style={styles.summaryGrid}>
      {cards.map((card) => (
        <StatCard
          key={card.label}
          value={card.value}
          label={card.label}
          icon={card.icon}
        />
      ))}
    </View>
  );
});

export default RankingStats;