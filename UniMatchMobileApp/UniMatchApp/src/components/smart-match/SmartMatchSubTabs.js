
// src/components/smart-match/SmartMatchSubTabs.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authTheme } from '../../styles/authTheme';

const TABS = [
  {
    key: 'profile',
    label: 'Profile',
    icon: 'person',
  },
  {
    key: 'custom',
    label: 'Custom',
    icon: 'options',
  },
];

export default function SmartMatchSubTabs({ activeSubTab, setActiveSubTab }) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = activeSubTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButtonShell,
              active && styles.tabButtonShellActive,
            ]}
            onPress={() => setActiveSubTab(tab.key)}
            activeOpacity={0.88}
          >
            {active ? (
              <LinearGradient
                colors={authTheme.gradients.button}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.tabButton}
              >
                <View style={[styles.iconBox, styles.iconBoxActive]}>
                  <Ionicons name={tab.icon} size={16} color="#FFFFFF" />
                </View>

                <Text style={[styles.tabText, styles.tabTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {tab.label}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabButton}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={authTheme.colors.brandTeal}
                  />
                </View>

                <Text style={styles.tabText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{tab.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#F8FFFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCEEE8',
    padding: 5,
  },

  tabButtonShell: {
    flex: 1,
    minHeight: 58,
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE8',
  },

  tabButtonShellActive: {
    borderColor: authTheme.colors.brandTeal,

    shadowColor: authTheme.colors.brandTeal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },

  tabButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: '#EAF7F3',
    borderWidth: 1,
    borderColor: '#BFE8D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  iconBoxActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.3)',
  },

  tabText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textAlign: 'center',
  },

  tabTextActive: {
    color: '#FFFFFF',
  },
});