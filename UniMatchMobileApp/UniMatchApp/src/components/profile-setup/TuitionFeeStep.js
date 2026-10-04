
// src/components/profile-setup/TuitionFeeStep.js

import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { Text } from '../AppText';

import { SCHOLARSHIP_OPTIONS } from '../../constants';
import { SelectField } from '../../components';
import { authTheme } from '../../styles/authTheme';
import { sanitizeNonNegative } from '../../utils/profileSetupUtils';

import NumberInput from './NumberInput';

function RangeHint({ text }) {
  if (!text) return null;

  return (
    <View style={localStyles.rangeRow}>
      <Text style={localStyles.rangeIcon}>ⓘ</Text>
      <Text style={localStyles.rangeText}>{text}</Text>
    </View>
  );
}

function getRangeText(ranges, rangeKey) {
  if (!ranges?.[rangeKey]) return '';

  return `Allowed range: ${ranges[rangeKey].min} - ${ranges[rangeKey].max} USD per year`;
}

export default function TuitionFeeStep({
  financial,
  setFinancial,
  openPicker,
  ranges = {},
}) {
  const tuitionRangeText = getRangeText(ranges, 'tuition_fee_international');
  const livingCostRangeText = getRangeText(ranges, 'living_cost');

  return (
    <>
      <NumberInput
        label="Min Tuition Fee (USD/year)"
        value={financial.min_tuition_fee}
        onChangeText={(value) =>
          setFinancial((prev) => ({
            ...prev,
            min_tuition_fee: sanitizeNonNegative(value),
          }))
        }
        placeholder="0"
      />
      <RangeHint text={tuitionRangeText} />

      <NumberInput
        label="Max Tuition Fee (USD/year)"
        value={financial.max_tuition_fee}
        onChangeText={(value) =>
          setFinancial((prev) => ({
            ...prev,
            max_tuition_fee: sanitizeNonNegative(value),
          }))
        }
        placeholder="0"
      />
      <RangeHint text={tuitionRangeText} />

      <NumberInput
        label="Max Living Cost (USD/year)"
        value={financial.living_cost_tolerance}
        onChangeText={(value) =>
          setFinancial((prev) => ({
            ...prev,
            living_cost_tolerance: sanitizeNonNegative(value),
          }))
        }
        placeholder="0"
      />
      <RangeHint text={livingCostRangeText} />

      <SelectField
        label="Scholarship Requirement"
        value={financial.scholarship_requirement}
        placeholder="Select funding preference"
        onPress={() =>
          openPicker(
            'Scholarship Requirement',
            SCHOLARSHIP_OPTIONS,
            'financial.scholarship'
          )
        }
      />

    </>
  );
}

const localStyles = StyleSheet.create({
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  rangeIcon: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: authTheme.colors.brandMuted,
    marginRight: 5,
  },

  rangeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: authTheme.colors.brandMuted,
  },
});