// src/components/rankings/RankingsHero.js

import React, { memo } from 'react';
import { View, Text } from 'react-native';

import { rankingsStyles as styles } from '../../styles/rankingsStyles';

const RankingsHero = memo(function RankingsHero({ config }) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.datasetBadge}>
        <View style={styles.badgeDot} />
        <Text style={styles.datasetBadgeText}>Dataset: {config.label}</Text>
      </View>

      <Text style={styles.heroTitle}>{config.fullTitle}</Text>
      <Text style={styles.heroSubtitle}>{config.subtitle}</Text>
    </View>
  );
});

export default RankingsHero;