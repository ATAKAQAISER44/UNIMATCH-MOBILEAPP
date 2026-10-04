// src/components/rankings/RankingsHero.js

import React, { memo } from 'react';
import { View, Text } from 'react-native';

import { rankingsStyles as styles } from '../../styles/rankingsStyles';

const RankingsHero = memo(function RankingsHero({ config }) {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroTitle}>{config.fullTitle}</Text>
    </View>
  );
});

export default RankingsHero;