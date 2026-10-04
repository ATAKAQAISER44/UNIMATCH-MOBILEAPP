

// src/components/smart-match/SmartMatchHeaderCard.js

import React, { memo } from 'react';

import { View, Text } from 'react-native';

import { smartMatchStyles as styles } from '../../styles/smartMatchStyles';

import SmartMatchSubTabs from './SmartMatchSubTabs';

const SmartMatchHeaderCard = memo(function SmartMatchHeaderCard({
  datasetKey,
  datasetTitle,
  activeSubTab,
  setActiveSubTab,
}) {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.welcomeTitle}>Smart Match</Text>
      <Text style={styles.welcomeDescription} numberOfLines={1}>
        {datasetTitle}
      </Text>

      <SmartMatchSubTabs
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
      />
    </View>
  );
});

export default SmartMatchHeaderCard;