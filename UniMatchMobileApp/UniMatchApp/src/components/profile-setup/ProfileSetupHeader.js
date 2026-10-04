// src/components/profile-setup/ProfileSetupHeader.js

import React from 'react';
import {
  View,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../AppText';

import { STEP_META } from '../../constants/profileSetupConstants';
import { profileSetupStyles as styles } from '../../styles/profileSetupStyles';

function StepBox({ item, activeStep, onPress }) {
  const isActive = item.step === activeStep;
  const isDone = item.step < activeStep;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.stepBox,
        isActive && styles.stepBoxActive,
        isDone && styles.stepBoxDone,
      ]}
    >
      {isDone && (
        <View style={styles.doneBadge}>
          <Text style={styles.doneBadgeText}>✓</Text>
        </View>
      )}

      <View style={[styles.stepIconBox, isActive && styles.stepIconBoxActive]}>
        <Text style={styles.stepIcon}>{item.icon}</Text>
      </View>

      <Text style={[styles.stepNumber, isActive && styles.stepTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        Step {item.step}
      </Text>

      <Text style={[styles.stepName, isActive && styles.stepTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
}

export default function ProfileSetupHeader({ step, isEditMode, onStepPress }) {
  return (
    <View style={styles.headerPanel}>
      <View style={styles.setupBadge}>
        <Text style={styles.setupBadgeText}>
          {isEditMode ? 'Edit Student Profile' : 'Student Profile Setup'}
        </Text>
      </View>

      <Text style={styles.headline}>
        {isEditMode ? 'Update your ' : 'Complete your '}
        <Text style={styles.headlineAccent}>profile</Text>
      </Text>

      <View style={styles.stepsRow}>
        {STEP_META.map((item) => (
          <StepBox
            key={item.step}
            item={item}
            activeStep={step}
            onPress={() => onStepPress(item.step)}
          />
        ))}
      </View>
    </View>
  );
}