// src/components/profile-setup/BottomNav.js

import React from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../AppText';
import { LinearGradient } from 'expo-linear-gradient';

import { authTheme } from '../../styles/authTheme';
import { profileSetupStyles as styles } from '../../styles/profileSetupStyles';

// canExit: on step 1 the back button leaves the form (edit mode only).
export default function BottomNav({
  step,
  loading,
  isEditMode,
  canExit = false,
  onBack,
  onNext,
  onSubmit,
}) {
  const hideBack = step === 1 && !canExit;

  return (
    <View style={styles.navRow}>
      <TouchableOpacity
        style={[styles.backButton, hideBack && styles.hiddenBackButton]}
        activeOpacity={0.85}
        onPress={onBack}
        disabled={hideBack || loading}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {step < 4 ? (
        <TouchableOpacity
          style={styles.nextButtonOuter}
          activeOpacity={0.88}
          onPress={onNext}
        >
          <LinearGradient
            colors={authTheme.gradients.button}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Text style={styles.nextButtonArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.nextButtonOuter, loading && styles.disabledButton]}
          activeOpacity={0.88}
          onPress={onSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={authTheme.gradients.button}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.nextButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color={authTheme.colors.white} />
            ) : (
              <Text style={styles.nextButtonText}>
                {isEditMode ? '✓ Update' : '✓ Finish'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}