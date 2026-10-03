// src/components/profile-setup/BottomNav.js

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { authTheme } from '../../styles/authTheme';
import { profileSetupStyles as styles } from '../../styles/profileSetupStyles';

export default function BottomNav({
  step,
  loading,
  isEditMode,
  onBack,
  onNext,
  onSubmit,
}) {
  return (
    <View style={styles.navRow}>
      <TouchableOpacity
        style={[styles.backButton, step === 1 && styles.hiddenBackButton]}
        activeOpacity={0.85}
        onPress={onBack}
        disabled={step === 1}
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