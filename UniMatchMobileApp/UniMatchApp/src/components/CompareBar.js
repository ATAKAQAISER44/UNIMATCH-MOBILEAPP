// src/components/CompareBar.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authTheme } from '../styles/authTheme';

const CompareBar = ({ compareList = [], onOpenCompare, onClearCompare }) => {
  // Keep the floating bar above the home indicator / navigation bar.
  const insets = useSafeAreaInsets();

  if (!compareList.length) return null;

  const count = compareList.length;

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>⇄</Text>
          </View>

          <View style={styles.textBox}>
            <Text style={styles.title}>
              {count} universit{count === 1 ? 'y' : 'ies'} selected
            </Text>

            <Text style={styles.subtitle}>Up to 3, side by side.</Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{count}/3</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onOpenCompare}
            style={styles.compareButtonOuter}
          >
            <LinearGradient
              colors={authTheme.gradients.button}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.compareButton}
            >
              <Text style={styles.compareButtonText}>Compare ({count})</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClearCompare}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CompareBar;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: Platform.OS === 'ios' ? 28 : 20,
    zIndex: 999,
    elevation: 999,
  },

  card: {
    // Centred and capped on tablets.
    width: '100%',
    maxWidth: 936,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BCEAD8',
    borderRadius: 24,
    padding: 14,

    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  icon: {
    fontSize: 21,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  textBox: {
    flex: 1,
    paddingRight: 8,
  },

  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: '#020617',
  },

  subtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: authTheme.colors.brandMuted,
  },

  countBadge: {
    minWidth: 42,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#F8FFFC',
    borderWidth: 1,
    borderColor: '#BCEAD8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },

  countBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  compareButtonOuter: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',

    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 9,
    elevation: 4,
  },

  compareButton: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  compareButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '900',
  },

  clearButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#BCEAD8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    color: authTheme.colors.brandTeal,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '900',
  },
});