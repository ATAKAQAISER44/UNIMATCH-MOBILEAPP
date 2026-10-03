

// src/components/smart-match/SmartMatchHeaderCard.js

import React, { memo } from 'react';

import { View, Text } from 'react-native';

import { smartMatchStyles as styles } from '../../styles/smartMatchStyles';

import SmartMatchSubTabs from './SmartMatchSubTabs';

const PROFILE_TAB = 'profile';

const SmartMatchHeaderCard = memo(function SmartMatchHeaderCard({
  datasetKey,
  datasetTitle,
  activeSubTab,
  setActiveSubTab,
}) {
  const modeLabel =
    activeSubTab === PROFILE_TAB ? 'Profile Match' : 'Custom Explore';

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroHeaderRow}>
        <View style={styles.heroLogoWrap}>
          <Text style={styles.heroLogoIcon}>⚡</Text>
        </View>

        <View style={styles.dashboardBadge}>
          <View style={styles.badgeDot} />

          <Text style={styles.dashboardBadgeText}>
            DATASET: {String(datasetKey).toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.welcomeTitle}>Smart Match</Text>

      <Text style={styles.welcomeDescription}>
        Find universities using your profile, budget and preferences.
      </Text>

      <View style={styles.datasetSummaryBox}>
        <Text style={styles.miniLabel}>Selected Dataset</Text>

        <Text style={styles.miniValue} numberOfLines={1}>
          {datasetTitle}
        </Text>
      </View>

      <View style={styles.profileGrid}>
        <View style={styles.miniCard}>
          <View style={styles.miniIconBox}>
            <Text style={styles.miniIcon}>🎯</Text>
          </View>

          <View style={styles.miniTextBlock}>
            <Text style={styles.miniLabel}>Mode</Text>
            <Text style={styles.miniValue}>{modeLabel}</Text>
          </View>
        </View>
      </View>

      <SmartMatchSubTabs
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
      />
    </View>
  );
});

export default SmartMatchHeaderCard;