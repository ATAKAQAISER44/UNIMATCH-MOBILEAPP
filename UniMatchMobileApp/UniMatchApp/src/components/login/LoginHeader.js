
import React from 'react';
import { View, Text } from 'react-native';

import { loginStyles as styles } from '../../styles/loginStyles';

export default function LoginHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <View style={styles.logoDot} />
        <Text style={styles.logoText}>UniMatch</Text>
      </View>

      <Text style={styles.headline}>
        Welcome{'\n'}back
      </Text>

      <Text style={styles.subtitle}>
        Sign in to continue your university journey
      </Text>
    </View>
  );
}