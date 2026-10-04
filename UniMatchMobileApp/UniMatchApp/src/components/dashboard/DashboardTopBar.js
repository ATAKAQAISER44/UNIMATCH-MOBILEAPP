
// src/components/dashboard/DashboardTopBar.js

import React, { memo } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { Text } from '../AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { topBarPadding } from '../../utils/safeArea';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { dashboardStyles as styles } from '../../styles/dashboardStyles';
import { authTheme } from '../../styles/authTheme';

const LOGO = require('../../../assets/images/icon.png');

const DashboardTopBar = memo(function DashboardTopBar({ onMenuPress }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={authTheme.gradients.button}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.topBar, topBarPadding(insets)]}
    >
      <StatusBar barStyle="light-content" />
      <TouchableOpacity
        style={styles.menuButton}
        activeOpacity={0.82}
        onPress={onMenuPress}
        accessibilityLabel="Open menu"
      >
        <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.brandRow}>
        <View style={styles.navLogoWrap}>
          <Image source={LOGO} style={styles.navLogo} resizeMode="contain" />
        </View>

        <Text style={styles.navBrand}>UniMatch</Text>
      </View>

      <View style={styles.topBarRightPlaceholder} />
    </LinearGradient>
  );
});

export default DashboardTopBar;