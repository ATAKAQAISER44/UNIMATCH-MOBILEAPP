
// src/components/profile-setup/SectionHeader.js

import React from 'react';
import { View, Text } from 'react-native';

import { STEP_META } from '../../constants/profileSetupConstants';
import { profileSetupStyles as styles } from '../../styles/profileSetupStyles';

export default function SectionHeader({ step }) {
  const meta = STEP_META[step - 1];

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBox}>
        <Text style={styles.sectionIcon}>{meta.icon}</Text>
      </View>

      <Text style={styles.sectionTitle}>{meta.sectionTitle}</Text>
    </View>
  );
}