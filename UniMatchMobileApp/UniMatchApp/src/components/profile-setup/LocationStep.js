// src/components/profile-setup/LocationStep.js

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Text } from '../AppText';

import { REGIONS } from '../../constants';
import { SelectField } from '../../components';
import { authTheme } from '../../styles/authTheme';
import { profileSetupStyles as styles } from '../../styles/profileSetupStyles';
import { sortOptionsAlphabetically } from '../../utils/profileSetupUtils';

// Several countries can be picked (the web saves them as "Germany, France").
export default function LocationStep({
  geo,
  countriesForRegion,
  openPicker,
  clearPreferredCountry,
  toggleCountry,
}) {
  const selectedCountries = Array.isArray(geo.preferred_country)
    ? geo.preferred_country
    : [];

  return (
    <>
      <SelectField
        label="Preferred Region"
        value={geo.preferred_region}
        placeholder="Select region"
        onPress={() => openPicker('Preferred Region', REGIONS, 'geo.region')}
      />

      <View style={styles.countryHeaderRow}>
        <Text style={styles.inputLabel}>
          Countries <Text style={styles.optionalText}>(Optional)</Text>
        </Text>

        {selectedCountries.length > 0 ? (
          <TouchableOpacity
            onPress={clearPreferredCountry}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {geo.preferred_region ? (
        <View style={localStyles.chipWrap}>
          {sortOptionsAlphabetically(countriesForRegion).map((country) => {
            const active = selectedCountries.includes(country);

            return (
              <TouchableOpacity
                key={country}
                onPress={() => toggleCountry(country)}
                activeOpacity={0.85}
                style={[localStyles.chip, active && localStyles.chipActive]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
              >
                <Text style={[localStyles.chipText, active && localStyles.chipTextActive]}>
                  {active ? `✓ ${country}` : country}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <Text style={localStyles.hintText}>Select a region first.</Text>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          No country = whole region.
        </Text>
      </View>
    </>
  );
}

const localStyles = StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },

  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: authTheme.radius.pill,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chipActive: {
    borderColor: authTheme.colors.brandTeal,
    backgroundColor: authTheme.colors.brandTeal,
  },

  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: authTheme.colors.gray700,
  },

  chipTextActive: {
    color: authTheme.colors.white,
  },

  hintText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: authTheme.colors.brandMuted,
    marginBottom: 6,
  },
});
