// src/components/profile-setup/AcademicStep.js

import React from 'react';
import {
  View,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput } from '../AppText';
import { LinearGradient } from 'expo-linear-gradient';

import {
  EDUCATION_LEVELS,
  INTENDED_LEVELS,
  FIELDS_OF_STUDY,
  TEST_CONFIG,
} from '../../constants';

import {
  CGPA_SCALE_OPTIONS,
  SCORE_TYPE_OPTIONS,
  TEST_CATEGORY_OPTIONS,
} from '../../constants/profileSetupConstants';

import { SelectField } from '../../components';
import { authTheme } from '../../styles/authTheme';
import { profileSetupStyles as styles } from '../../styles/profileSetupStyles';
import { sanitizeNonNegative } from '../../utils/profileSetupUtils';

export default function AcademicStep({
  academic,
  setAcademic,
  selectedTest,
  testScore,
  tests,
  setTestScore,
  openPicker,
  addTest,
  removeTest,
}) {
  return (
    <>
      <SelectField
        label="Current Education Level"
        value={academic.current_education_level}
        placeholder="Select current level"
        onPress={() =>
          openPicker(
            'Current Education Level',
            EDUCATION_LEVELS,
            'academic.current_education_level'
          )
        }
      />

      <SelectField
        label="Intended Education Level"
        value={academic.intended_education_level}
        placeholder="Select intended level"
        onPress={() =>
          openPicker(
            'Intended Education Level',
            INTENDED_LEVELS,
            'academic.intended_education_level'
          )
        }
      />

      <SelectField
        label="Field of Study"
        value={academic.field_of_study}
        placeholder="Select field of study"
        onPress={() =>
          openPicker('Field of Study', FIELDS_OF_STUDY, 'academic.field_of_study')
        }
      />

      <SelectField
        label="Score Type"
        value={academic.score_type}
        placeholder="Select score type"
        onPress={() =>
          openPicker('Score Type', SCORE_TYPE_OPTIONS, 'academic.score_type')
        }
      />

      {academic.score_type === 'CGPA' && (
        <SelectField
          label="CGPA Scale"
          value={academic.cgpa_scale}
          placeholder="Select CGPA scale"
          onPress={() =>
            openPicker('CGPA Scale', CGPA_SCALE_OPTIONS, 'academic.cgpa_scale')
          }
        />
      )}

      {academic.score_type !== '' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {academic.score_type === 'Percentage' ? 'Percentage' : 'CGPA'}
          </Text>

          <TextInput
            style={[
              styles.textInput,
              academic.score_type === 'CGPA' &&
                !academic.cgpa_scale &&
                styles.disabledInput,
            ]}
            value={academic.score_value}
            onChangeText={(value) =>
              setAcademic((prev) => ({
                ...prev,
                score_value: sanitizeNonNegative(value),
              }))
            }
            placeholder={
              academic.score_type === 'Percentage'
                ? 'Enter percentage (0-100)'
                : academic.cgpa_scale
                ? `Enter CGPA (${academic.cgpa_scale})`
                : 'Select CGPA scale first'
            }
            placeholderTextColor="#8A9AB0"
            keyboardType="numeric"
            editable={academic.score_type !== 'CGPA' || !!academic.cgpa_scale}
          />
        </View>
      )}

      <View style={styles.testCard}>
        <Text style={styles.testTitle}>Tests</Text>

        <SelectField
          label="Select Test"
          value={selectedTest}
          placeholder="Choose a test"
          onPress={() => openPicker('Select Test', TEST_CATEGORY_OPTIONS, 'test')}
        />

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Score</Text>

          <TextInput
            style={[styles.textInput, !selectedTest && styles.disabledInput]}
            value={testScore}
            onChangeText={(value) => setTestScore(sanitizeNonNegative(value))}
            placeholder={
              selectedTest
                ? `Enter score (${TEST_CONFIG[selectedTest]?.min} - ${TEST_CONFIG[selectedTest]?.max})`
                : 'Select test first'
            }
            placeholderTextColor="#8A9AB0"
            keyboardType="numeric"
            editable={!!selectedTest}
          />
        </View>

        <TouchableOpacity
          style={styles.addButtonOuter}
          activeOpacity={0.88}
          onPress={addTest}
        >
          <LinearGradient
            colors={authTheme.gradients.button}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>＋ Add</Text>
          </LinearGradient>
        </TouchableOpacity>

        {tests.length > 0 && (
          <View style={styles.addedTestsWrap}>
            {tests.map((test, index) => (
              <View key={`${test.test_name}-${index}`} style={styles.testChip}>
                <View style={styles.testChipTextBlock}>
                  <Text style={styles.testChipName}>{test.test_name}</Text>
                  <Text style={styles.testChipScore}>Score: {test.score}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => removeTest(index)}
                  style={styles.removeBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeBtnText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
}