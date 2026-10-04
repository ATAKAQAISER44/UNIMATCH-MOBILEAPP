
// src/components/rankings/RankingTabs.js

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { rankingsStyles as styles } from '../../styles/rankingsStyles';
import { TABS } from '../../constants/rankingsConstants';

const RankingTabs = memo(function RankingTabs({ activeTab, onTabPress }) {
  return (
    <View style={styles.tabsWrapper}>
      {TABS.map((tab) => {
        const active = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.86}
            style={[styles.tabBtn, active && styles.tabBtnActive]}
            onPress={() => onTabPress(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

export default RankingTabs;