
// src/components/profile-setup/ProgressHeader.js

import React from 'react';
import { View, Text } from 'react-native';

import { profileSetupStyles as styles } from '../../styles/profileSetupStyles';

export default function ProgressHeader({ progress }) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressHeaderRow}>
        <Text style={styles.progressLabel}>Profile Completion</Text>
        <Text style={styles.progressPercent}>{progress}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}