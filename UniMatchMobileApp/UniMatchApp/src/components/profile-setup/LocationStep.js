// src/components/profile-setup/LocationStep.js

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { REGIONS } from '../../constants';
import { SelectField } from '../../components';
import { profileSetupStyles as styles } from '../../styles/profileSetupStyles';

export default function LocationStep({
  geo,
  countriesForRegion,
  openPicker,
  clearPreferredCountry,
}) {
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

        {geo.preferred_country ? (
          <TouchableOpacity onPress={clearPreferredCountry} activeOpacity={0.8}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <SelectField
        value={geo.preferred_country}
        placeholder={geo.preferred_region ? 'Select country' : 'Select region first'}
        onPress={() =>
          openPicker('Preferred Country', countriesForRegion, 'geo.country')
        }
        disabled={!geo.preferred_region}
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          No country = whole region.
        </Text>
      </View>
    </>
  );
}