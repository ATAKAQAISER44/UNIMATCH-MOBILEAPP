// src/components/rankings/RankingsHero.js
//
// Top card of a ranking page (web: RankingPage hero): dataset badge, title,
// a one-line description of what the ranking measures, its focus areas and
// the ranking's logo.

import React, { memo } from 'react';
import { Image, View } from 'react-native';
import { Text } from '../AppText';

import { RANKING_ABOUT } from '../../constants/roleConstants';
import { rankingsStyles as styles } from '../../styles/rankingsStyles';
import { authTheme } from '../../styles/authTheme';

const LOGOS = {
  qs: require('../../../assets/images/logos/qs.png'),
  the: require('../../../assets/images/logos/the.png'),
  arwu: require('../../../assets/images/logos/arwu.jpg'),
};

const FOCUS = {
  qs: ['Reputation', 'Employability', 'International mix'],
  the: ['Teaching', 'Research quality', 'Industry'],
  arwu: ['Research output', 'Awards', 'Citations'],
};

const RankingsHero = memo(function RankingsHero({ config }) {
  const key = String(config.label || 'qs').toLowerCase();

  return (
    <View style={styles.heroCard}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
          <View style={styles.datasetBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.datasetBadgeText}>Dataset: {config.label}</Text>
          </View>
          <Text style={styles.heroTitle}>{config.fullTitle}</Text>
        </View>

        {!!LOGOS[key] && (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: authTheme.colors.brandBorder,
              backgroundColor: '#FFFFFF',
              padding: 6,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image source={LOGOS[key]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </View>
        )}
      </View>

      {!!RANKING_ABOUT[key] && <Text style={styles.heroSubtitle}>{RANKING_ABOUT[key]}</Text>}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
        {(FOCUS[key] || []).map((item) => (
          <View
            key={item}
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: authTheme.colors.brandBorder,
              backgroundColor: authTheme.colors.brandMint,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: authTheme.colors.brandTealDark }}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

export default RankingsHero;
