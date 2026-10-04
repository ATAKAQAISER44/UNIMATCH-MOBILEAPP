// src/components/rankings/RankingStats.js

import React, { memo } from 'react';
import {
  View,
} from 'react-native';
import { Text } from '../AppText';

import { rankingsStyles as styles } from '../../styles/rankingsStyles';

const StatCard = memo(function StatCard({ value, label, icon }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTextBlock}>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
        <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{label}</Text>
      </View>

      <View style={styles.statIconBox}>
        <Text style={styles.statIcon}>{icon}</Text>
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