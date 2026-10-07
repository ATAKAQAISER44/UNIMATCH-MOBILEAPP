// src/components/researcher/UniversityResultRow.js
//
// One search result in the researcher Compare and Journey screens (web:
// researcher/UniversityResultRow.jsx). Tapping the name opens the
// university's profile; the two small buttons send it to Compare
// Universities or University Journey. `primary` marks the screen's own
// action ('compare' or 'journey') so it stands out.

import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../AppText';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';

function ActionButton({ icon, label, onPress, primary, accessibilityLabel }) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: 56,
        minHeight: 42,
        marginLeft: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: primary ? authTheme.colors.brandTeal : authTheme.colors.brandBorder,
        backgroundColor: primary ? authTheme.colors.brandMintDeep : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 3,
      }}
    >
      <Ionicons name={icon} size={15} color={authTheme.colors.brandTealDark} />
      <Text style={{ fontSize: 9.5, fontWeight: '900', color: authTheme.colors.brandTealDark, marginTop: 1 }} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function UniversityResultRow({ name, country, meta, onOpen, onCompare, onJourney, primary }) {
  const sub = [country, meta].filter(Boolean).join(' · ');

  return (
    <View style={[styles.suggestionRow, { paddingVertical: 6, paddingRight: 8 }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpen}
        style={[styles.flex1, { minHeight: 42, justifyContent: 'center' }]}
        accessibilityRole="button"
        accessibilityLabel={`Open profile of ${name}`}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.suggestionName} numberOfLines={2}>
            {name}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={authTheme.colors.brandMuted} style={{ marginLeft: 2 }} />
        </View>
        {!!sub && (
          <Text style={styles.suggestionSub} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </TouchableOpacity>
      <ActionButton
        icon="git-compare-outline"
        label="Compare"
        onPress={onCompare}
        primary={primary === 'compare'}
        accessibilityLabel={`Add ${name} to Compare`}
      />
      <ActionButton
        icon="trending-up"
        label="Journey"
        onPress={onJourney}
        primary={primary === 'journey'}
        accessibilityLabel={`University Journey of ${name}`}
      />
    </View>
  );
}
