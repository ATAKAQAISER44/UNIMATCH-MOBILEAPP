
// src/components/profile-setup/ProfileSetupContent.js

import React from 'react';

import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { AlertBox } from '../../components';
import PickerModal from '../PickerModal';

import { authTheme } from '../../styles/authTheme';
import { profileSetupStyles as styles } from '../../styles/profileSetupStyles';

import ProgressHeader from './ProgressHeader';
import ProfileSetupHeader from './ProfileSetupHeader';
import SectionHeader from './SectionHeader';
import BottomNav from './BottomNav';
import AcademicStep from './AcademicStep';
import LocationStep from './LocationStep';
import TuitionFeeStep from './TuitionFeeStep';
import PriorityStep from './PriorityStep';

export default function ProfileSetupContent({
  step,
  loading,
  pageLoading,
  isEditMode,
  canExit,
  message,
  ranges,
  picker,
  pickerSelected,
  progressPercent,

  academic,
  setAcademic,

  selectedTest,
  testScore,
  tests,
  setTestScore,

  geo,
  countriesForRegion,
  regionOptions,

  financial,
  setFinancial,

  priorities,

  openPicker,
  closePicker,
  onPickerSelect,

  addTest,
  removeTest,
  clearPreferredCountry,
  toggleCountry,
  clearPriority,
  isPriorityLocked,
  getPriorityPlaceholder,
  getAvailablePriorityOptions,

  handleStepPress,
  handleBack,
  handleNext,
  handleSubmit,
}) {
  if (pageLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={authTheme.colors.brandTeal} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        style={styles.keyboardRoot}
      >
        <LinearGradient
          colors={authTheme.gradients.page}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pageGradient}
        >
          <PickerModal
            visible={picker.visible}
            title={picker.title}
            options={picker.options}
            selected={pickerSelected}
            onSelect={onPickerSelect}
            onClose={closePicker}
          />

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            <View style={styles.pageShell}>
              <ProgressHeader progress={progressPercent} />

              <View style={styles.card}>
                <ProfileSetupHeader
                  step={step}
                  isEditMode={isEditMode}
                  onStepPress={handleStepPress}
                />

                <View style={styles.formPanel}>
                  <SectionHeader step={step} />

                  {!!message && (
                    <View style={styles.alertWrap}>
                      <AlertBox message={message} type="error" />
                    </View>
                  )}

                  {step === 1 && (
                    <AcademicStep
                      academic={academic}
                      setAcademic={setAcademic}
                      selectedTest={selectedTest}
                      testScore={testScore}
                      tests={tests}
                      setTestScore={setTestScore}
                      openPicker={openPicker}
                      addTest={addTest}
                      removeTest={removeTest}
                    />
                  )}

                  {step === 2 && (
                    <LocationStep
                      geo={geo}
                      countriesForRegion={countriesForRegion}
                      regionOptions={regionOptions}
                      openPicker={openPicker}
                      clearPreferredCountry={clearPreferredCountry}
                      toggleCountry={toggleCountry}
                    />
                  )}

                  {step === 3 && (
                    <TuitionFeeStep
                      financial={financial}
                      setFinancial={setFinancial}
                      openPicker={openPicker}
                      ranges={ranges}
                    />
                  )}

                  {step === 4 && (
                    <PriorityStep
                      priorities={priorities}
                      openPicker={openPicker}
                      clearPriority={clearPriority}
                      isPriorityLocked={isPriorityLocked}
                      getPriorityPlaceholder={getPriorityPlaceholder}
                      getAvailablePriorityOptions={getAvailablePriorityOptions}
                    />
                  )}

                  <BottomNav
                    step={step}
                    loading={loading}
                    isEditMode={isEditMode}
                    canExit={canExit}
                    onBack={handleBack}
                    onNext={handleNext}
                    onSubmit={handleSubmit}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}