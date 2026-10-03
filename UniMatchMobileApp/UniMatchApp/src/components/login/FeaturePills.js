
import React from 'react';
import { View, Text } from 'react-native';

import { loginStyles as styles } from '../../styles/loginStyles';

const LOGIN_FEATURES = ['Smart Matching', 'Global Rankings', 'Secure'];

export default function FeaturePills() {
  return (
    <View style={styles.pills}>
      {LOGIN_FEATURES.map((pill) => (
        <View key={pill} style={styles.pill}>
          <Text style={styles.pillText}>{pill}</Text>
        </View>
      ))}
    </View>
  );
}