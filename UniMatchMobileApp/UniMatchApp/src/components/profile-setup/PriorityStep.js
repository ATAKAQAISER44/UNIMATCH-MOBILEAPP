// src/components/profile-setup/PriorityStep.js

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { SelectField } from '../../components';
import { PRIORITY_LABELS } from '../../constants/profileSetupConstants';
import { profileSetupStyles as styles } from '../../styles/profileSetupStyles';

export default function PriorityStep({
  priorities,
  openPicker,
  clearPriority,
  isPriorityLocked,
  getPriorityPlaceholder,
  getAvailablePriorityOptions,
}) {
  return (
    <>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Priority 1 is required. It has the biggest influence on which ranking system UniMatch recommends for you.
        </Text>
      </View>

      {PRIORITY_LABELS.map(([key, label], index) => {
        const isLocked = isPriorityLocked(key);
        const hasValue = !!priorities[key];

        return (
          <View
            key={key}
            style={[styles.priorityBlock, isLocked && styles.lockedPriority]}
          >
            <View style={styles.priorityHeaderRow}>
              <View style={styles.priorityLabelWrap}>
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityBadgeText}>{index + 1}</Text>
                </View>

                <Text style={styles.priorityLabel}>{label}</Text>
              </View>

              {hasValue ? (
                <TouchableOpacity
                  onPress={() => clearPriority(key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <SelectField
              value={priorities[key]}
              placeholder={getPriorityPlaceholder(key)}
              onPress={() =>
                openPicker(
                  label,
                  getAvailablePriorityOptions(key),
                  `priority.${key}`
                )
              }
              disabled={isLocked}
            />
          </View>
        );
      })}
    </>
  );
}