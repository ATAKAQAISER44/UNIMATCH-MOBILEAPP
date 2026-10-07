// src/components/GoogleButton.js
//
// "Continue with Google" button plus the "or ... with email" divider, shared
// by Login and Sign Up (web: components/GoogleButton.jsx).

import React from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from './AppText';
import { authTheme } from '../styles/authTheme';

const GOOGLE_ICON = require('../../assets/images/google-g.png');

export default function GoogleButton({ onPress, loading = false, disabled = false, dividerText }) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.button, (disabled || loading) && styles.disabled]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
      >
        {loading ? (
          <ActivityIndicator size="small" color={authTheme.colors.brandTeal} />
        ) : (
          <>
            <Image source={GOOGLE_ICON} style={styles.icon} resizeMode="contain" />
            <Text style={styles.text} numberOfLines={1}>
              Continue with Google
            </Text>
          </>
        )}
      </TouchableOpacity>

      {!!dividerText && (
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>{dividerText}</Text>
          <View style={styles.line} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  button: {
    width: '100%',
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  disabled: { opacity: 0.7 },
  icon: { width: 20, height: 20 },
  text: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: authTheme.colors.gray900,
  },
  divider: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  line: { flex: 1, height: 1, backgroundColor: authTheme.colors.gray200 },
  dividerText: {
    fontSize: 11,
    lineHeight: 14,
    color: authTheme.colors.brandMuted,
    marginHorizontal: 8,
    fontWeight: '600',
  },
});
