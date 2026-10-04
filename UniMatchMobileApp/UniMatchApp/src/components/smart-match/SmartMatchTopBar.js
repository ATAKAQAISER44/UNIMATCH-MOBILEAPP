

// src/components/smart-match/SmartMatchTopBar.js

import React, { memo } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { authTheme } from '../../styles/authTheme';
import { smartMatchStyles as styles } from '../../styles/smartMatchStyles';

const LOGO = require('../../../assets/images/icon.png');

const SmartMatchTopBar = memo(function SmartMatchTopBar({ onBackPress }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={authTheme.gradients.button}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.topBar, { paddingTop: insets.top + 10 }]}
    >
      <TouchableOpacity
        style={styles.menuButton}
        activeOpacity={0.82}
        onPress={onBackPress}
        accessibilityLabel="Go back"
      >
        <Text style={styles.menuIcon}>←</Text>
      </TouchableOpacity>

      <View style={styles.brandRow}>
        <View style={styles.navLogoWrap}>
          <Image source={LOGO} style={styles.navLogo} resizeMode="contain" />
        </View>

        <Text style={styles.navBrand}>UniMatch</Text>
      </View>
    </LinearGradient>
  );
});

export default SmartMatchTopBar;