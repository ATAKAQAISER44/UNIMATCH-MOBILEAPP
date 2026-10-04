
// src/components/smart-match/ProfileMatchPanel.js

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../services/supabase';
import { getSignedInUser } from '../../services/session';
import PaginatedResults from './PaginatedResults';
import { smartMatchUIStyles as styles } from '../../styles/smartMatchUIStyles';
import { authTheme } from '../../styles/authTheme';

const REGION_OPTIONS = [
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Australia',
  'Africa',
];

const DEGREE_OPTIONS = ['BS', 'MS', 'MS leading to PhD', 'PhD'];

const SCHOLARSHIP_OPTIONS = [
  'Scholarship-supported',
  'Fully funded',
  'Self-funded',
];

const SCORE_TYPE_OPTIONS = ['CGPA', 'Percentage'];

const SORT_OPTIONS = [
  { label: 'Official Rank', value: 'official_rank' },
  { label: 'Smart Rank', value: 'smart_rank' },
  { label: 'Personalized Score', value: 'personalized_score' },
  { label: 'Tuition Fee', value: 'tuition_fee' },
  { label: 'Living Cost', value: 'living_cost' },
  { label: 'Acceptance Rate', value: 'acceptance_rate' },
  { label: 'Employability', value: 'graduate_employability_rate' },
];

const SORT_ORDER_OPTIONS = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const DEFAULT_SORT_BY = 'official_rank';
const DEFAULT_SORT_ORDER = 'asc';
// 0 = no limit: every matching university is returned and paged in the app.
const DEFAULT_TOP_N = 0;
const DEFAULT_PAGE_SIZE = 5;

const INITIAL_PROFILE = {
  academic: {
    intended_education_level: '',
    field_of_study: '',
    score_type: 'CGPA',
    score_value: '',
  },
  geographic: {
    preferred_region: '',
    preferred_country: '',
  },
  financial: {
    max_tuition_fee: '',
    living_cost_tolerance: '',
    scholarship_requirement: '',
  },
  tests: [],
};

function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function toNumberOrEmpty(value) {
  if (value === '' || value === null || value === undefined) return '';

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) return value;

  return numberValue;
}

function getSupabaseErrorMessage(results = []) {
  return results.find((result) => result?.error)?.error?.message || '';
}

const FieldLabel = memo(function FieldLabel({ label }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
});

const ProfileSection = memo(function ProfileSection({ title, icon, children }) {
  return (
    <View style={styles.profileSection}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionIconBox}>
          <Text style={styles.sectionIcon}>{icon}</Text>
        </View>

        <Text style={styles.profileSectionTitle}>{title}</Text>
      </View>

      {children}
    </View>
  );
});

const ChipSelector = memo(function ChipSelector({
  options,
  value,
  onChange,
  placeholder,
}) {
  return (
    <View>
      {placeholder && !value ? (
        <Text style={styles.placeholderHint}>{placeholder}</Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {options.map((option) => {
          const active = value === option;

          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(option)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const OptionChipSelector = memo(function OptionChipSelector({
  options,
  value,
  onChange,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {options.map((option) => {
        const optionLabel =
          typeof option === 'object' ? option.label : String(option);
        const optionValue =
          typeof option === 'object' ? option.value : option;

        const active = value === optionValue;

        return (
          <TouchableOpacity
            key={String(optionValue)}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(optionValue)}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {optionLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

const GradientButton = memo(function GradientButton({
  label,
  loading,
  disabled,
  onPress,
  variant = 'primary',
}) {
  const isSecondary = variant === 'secondary';

  if (isSecondary) {
    return (
      <TouchableOpacity
        style={[styles.secondaryButton, disabled && styles.disabledButton]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color={authTheme.colors.brandTeal} />
        ) : (
          <Text style={styles.secondaryButtonText}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.primaryButtonShell, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={authTheme.gradients.button}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.primaryButton}
      >
        {loading ? (
          <ActivityIndicator size="small" color={'#FFFFFF'} />
        ) : (
          <Text style={styles.primaryButtonText}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
});

const SortControlsMobile = memo(function SortControlsMobile({
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  pageSize,
  setPageSize,
  loading,
  onApply,
}) {
  return (
    <View style={modalStyles.sortContent}>
      <View style={styles.sortSection}>
        <FieldLabel label="Sort By" />
        <OptionChipSelector
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={setSortBy}
        />
      </View>

      <View style={styles.sortSection}>
        <FieldLabel label="Order" />
        <OptionChipSelector
          options={SORT_ORDER_OPTIONS}
          value={sortOrder}
          onChange={setSortOrder}
        />
      </View>

      <View style={styles.sortSection}>
        <FieldLabel label="Results Per Page" />
        <OptionChipSelector
          options={PAGE_SIZE_OPTIONS}
          value={pageSize}
          onChange={setPageSize}
        />
      </View>

      <GradientButton
        label="Apply Sort"
        loading={loading}
        disabled={loading}
        onPress={onApply}
      />
    </View>
  );
});

const SortOptionsModal = memo(function SortOptionsModal({
  visible,
  onClose,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  pageSize,
  setPageSize,
  loading,
  onApply,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.sheet} onPress={() => {}}>
          <View style={modalStyles.sheetHeader}>
            <View style={modalStyles.headerTextBox}>
              <Text style={modalStyles.sheetTitle}>Sort Results</Text>
              <Text style={modalStyles.sheetSubtitle}>
                Choose order and page size
              </Text>
            </View>

            <TouchableOpacity
              style={modalStyles.closeButton}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={modalStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={modalStyles.scrollContent}
          >
            <SortControlsMobile
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              pageSize={pageSize}
              setPageSize={setPageSize}
              loading={loading}
              onApply={onApply}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

export default function ProfileMatchPanel({
  headerComponent = null,
  universities = [],
  loading = false,
  fetchSmartMatch,
  smartNotice,
  onToggleCompare,
  isCompared,
  onToggleSave,
  isSaved,
  onOpenUniversity,
}) {
  const [userId, setUserId] = useState(null);

  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] = useState(DEFAULT_SORT_ORDER);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [showSortOptions, setShowSortOptions] = useState(false);

  const [profileLoading, setProfileLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const [profile, setProfile] = useState(INITIAL_PROFILE);

  const hasResults = Array.isArray(universities) && universities.length > 0;

  const normalizedSortBy = useMemo(
    () => sortBy || DEFAULT_SORT_BY,
    [sortBy]
  );

  const normalizedSortOrder = useMemo(
    () => sortOrder || DEFAULT_SORT_ORDER,
    [sortOrder]
  );

  const blockerLabel = useMemo(
    () =>
      smartNotice?.main_blocker
        ? String(smartNotice.main_blocker).replace(/_/g, ' ')
        : '',
    [smartNotice?.main_blocker]
  );

  const setInfoMessage = useCallback((text) => {
    setMessage(text);
    setMessageType('info');
  }, []);

  const setErrorMessage = useCallback((text) => {
    setMessage(text);
    setMessageType('error');
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);

      const {
        data: { user },
        error: userError,
      } = await getSignedInUser();

      if (userError || !user) {
        return;
      }

      setUserId(user.id);

      const responses = await Promise.all([
        supabase
          .from('academic_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),

        supabase
          .from('geographic_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),

        supabase
          .from('financial_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),

        supabase
          .from('user_test_scores')
          .select('*')
          .eq('user_id', user.id),
      ]);

      const loadError = getSupabaseErrorMessage(responses);

      if (loadError) {
        setErrorMessage(loadError);
      }

      const [
        academicResponse,
        geographicResponse,
        financialResponse,
        testsResponse,
      ] = responses;

      const academic = academicResponse.data || {};
      const geographic = geographicResponse.data || {};
      const financial = financialResponse.data || {};
      const tests = testsResponse.data || [];

      setProfile({
        academic: {
          intended_education_level:
            academic.intended_education_level || '',
          field_of_study: academic.field_of_study || '',
          score_type: academic.score_type || 'CGPA',
          score_value: normalizeValue(academic.score_value),
        },
        geographic: {
          preferred_region: geographic.preferred_region || '',
          preferred_country: geographic.preferred_country || '',
        },
        financial: {
          max_tuition_fee: normalizeValue(financial.max_tuition_fee),
          living_cost_tolerance: normalizeValue(
            financial.living_cost_tolerance
          ),
          scholarship_requirement:
            financial.scholarship_requirement || '',
        },
        tests,
      });
    } catch (error) {
      console.error('Profile load error:', error);
      setErrorMessage('Could not load your profile.');
    } finally {
      setProfileLoading(false);
    }
  }, [setErrorMessage]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (!hasResults) {
      setShowSortOptions(false);
    }
  }, [hasResults]);

  const updateAcademic = useCallback((key, value) => {
    setProfile((prev) => ({
      ...prev,
      academic: {
        ...prev.academic,
        [key]: value,
      },
    }));
  }, []);

  const updateGeographic = useCallback((key, value) => {
    setProfile((prev) => ({
      ...prev,
      geographic: {
        ...prev.geographic,
        [key]: value,
      },
    }));
  }, []);

  const updateFinancial = useCallback((key, value) => {
    setProfile((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        [key]: value,
      },
    }));
  }, []);

  const validateProfile = useCallback(() => {
    if (!profile.academic.intended_education_level) {
      return 'Please select intended degree.';
    }

    if (!profile.academic.field_of_study.trim()) {
      return 'Please enter field of study.';
    }

    if (!profile.academic.score_value) {
      return 'Please enter CGPA / score.';
    }

    if (!profile.geographic.preferred_region) {
      return 'Please select region.';
    }

    return '';
  }, [profile]);

  const buildPayload = useCallback(
    () => ({
      academic: {
        intended_education_level:
          profile.academic.intended_education_level,
        field_of_study: profile.academic.field_of_study.trim(),
        score_type: profile.academic.score_type || 'CGPA',
        score_value: toNumberOrEmpty(profile.academic.score_value),
      },
      geographic: {
        preferred_region: profile.geographic.preferred_region,
        preferred_country: profile.geographic.preferred_country.trim(),
      },
      financial: {
        max_tuition_fee: toNumberOrEmpty(
          profile.financial.max_tuition_fee
        ),
        living_cost_tolerance: toNumberOrEmpty(
          profile.financial.living_cost_tolerance
        ),
        scholarship_requirement:
          profile.financial.scholarship_requirement,
      },
      tests: profile.tests || [],
    }),
    [profile]
  );

  const runProfileMatch = useCallback(
    (extraIgnored = [], preserveIgnored = false) => {
      setMessage('');

      const error = validateProfile();

      if (error) {
        setErrorMessage(error);
        return;
      }

      setPage(1);

      fetchSmartMatch({
        temporaryProfile: buildPayload(),
        extraIgnored,
        preserveIgnored,
        sortBy: normalizedSortBy,
        sortOrder: normalizedSortOrder,
        topN: DEFAULT_TOP_N,
      });
    },
    [
      buildPayload,
      fetchSmartMatch,
      normalizedSortBy,
      normalizedSortOrder,
      setErrorMessage,
      validateProfile,
    ]
  );

  const useTemporarily = useCallback(() => {
    runProfileMatch([]);
    setInfoMessage('Showing results for these changes only. Your saved profile was not changed.');
  }, [runProfileMatch, setInfoMessage]);

  const saveAndUseProfile = useCallback(async () => {
    try {
      setMessage('');

      const error = validateProfile();

      if (error) {
        setErrorMessage(error);
        return;
      }

      if (!userId) {
        setErrorMessage('Your session has expired. Please log in again.');
        return;
      }

      const payload = buildPayload();

      const saveResults = await Promise.all([
        supabase.from('academic_preferences').upsert(
          {
            user_id: userId,
            intended_education_level:
              payload.academic.intended_education_level,
            field_of_study: payload.academic.field_of_study,
            score_type: payload.academic.score_type,
            score_value: payload.academic.score_value,
          },
          { onConflict: 'user_id' }
        ),

        supabase.from('geographic_preferences').upsert(
          {
            user_id: userId,
            preferred_region: payload.geographic.preferred_region,
            preferred_country: payload.geographic.preferred_country,
          },
          { onConflict: 'user_id' }
        ),

        supabase.from('financial_preferences').upsert(
          {
            user_id: userId,
            max_tuition_fee: payload.financial.max_tuition_fee,
            living_cost_tolerance:
              payload.financial.living_cost_tolerance,
            scholarship_requirement:
              payload.financial.scholarship_requirement,
          },
          { onConflict: 'user_id' }
        ),
      ]);

      const errorMessage = getSupabaseErrorMessage(saveResults);

      if (errorMessage) {
        setErrorMessage(errorMessage);
        return;
      }

      runProfileMatch([]);
      setInfoMessage('Profile saved. Your Smart Match results have been updated.');
    } catch (error) {
      console.error('Save profile error:', error);
      setErrorMessage('Could not save profile.');
    }
  }, [
    buildPayload,
    runProfileMatch,
    setErrorMessage,
    setInfoMessage,
    userId,
    validateProfile,
  ]);

  const handleApplySort = useCallback(() => {
    setShowSortOptions(false);
    runProfileMatch([], true);
  }, [runProfileMatch]);

  const openSortModal = useCallback(() => {
    setShowSortOptions(true);
  }, []);

  const closeSortModal = useCallback(() => {
    setShowSortOptions(false);
  }, []);

  const handleIgnoreBlocker = useCallback(() => {
    if (smartNotice?.main_blocker) {
      runProfileMatch([smartNotice.main_blocker]);
    }
  }, [runProfileMatch, smartNotice?.main_blocker]);

  const scholarshipValue =
    profile.financial.scholarship_requirement || 'No preference';

  if (profileLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={authTheme.colors.brandTeal} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {headerComponent ? (
          <View style={{ marginBottom: 12 }}>{headerComponent}</View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Your preferences</Text>
            </View>
          </View>

          {message ? (
            <View
              style={[
                styles.messageBox,
                messageType === 'error'
                  ? styles.messageBoxError
                  : styles.messageBoxInfo,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  messageType === 'error'
                    ? styles.messageTextError
                    : styles.messageTextInfo,
                ]}
              >
                {message}
              </Text>
            </View>
          ) : null}

          <ProfileSection title="Academic" icon="🎓">
            <FieldLabel label="Intended Degree" />
            <ChipSelector
              options={DEGREE_OPTIONS}
              value={profile.academic.intended_education_level}
              placeholder="Select degree"
              onChange={(value) =>
                updateAcademic('intended_education_level', value)
              }
            />

            <FieldLabel label="Field of Study" />
            <TextInput
              style={styles.input}
              value={profile.academic.field_of_study}
              onChangeText={(value) =>
                updateAcademic('field_of_study', value)
              }
              placeholder="Computer Science"
              placeholderTextColor="#94a3b8"
            />

            <FieldLabel label="Score Type" />
            <ChipSelector
              options={SCORE_TYPE_OPTIONS}
              value={profile.academic.score_type}
              onChange={(value) => updateAcademic('score_type', value)}
            />

            <FieldLabel label="Score / CGPA" />
            <TextInput
              style={styles.input}
              value={String(profile.academic.score_value)}
              onChangeText={(value) =>
                updateAcademic('score_value', value)
              }
              placeholder="3.46"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />
          </ProfileSection>

          <ProfileSection title="Location" icon="🌍">
            <FieldLabel label="Preferred Region" />
            <ChipSelector
              options={REGION_OPTIONS}
              value={profile.geographic.preferred_region}
              placeholder="Select region"
              onChange={(value) =>
                updateGeographic('preferred_region', value)
              }
            />

            <FieldLabel label="Preferred Country (optional)" />
            <TextInput
              style={styles.input}
              value={profile.geographic.preferred_country}
              onChangeText={(value) =>
                updateGeographic('preferred_country', value)
              }
              placeholder="United Kingdom"
              placeholderTextColor="#94a3b8"
            />
          </ProfileSection>

          <ProfileSection title="Financial" icon="💳">
            <FieldLabel label="Max Tuition Fee" />
            <TextInput
              style={styles.input}
              value={String(profile.financial.max_tuition_fee)}
              onChangeText={(value) =>
                updateFinancial('max_tuition_fee', value)
              }
              placeholder="78000"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />

            <FieldLabel label="Max Living Cost (USD/year)" />
            <TextInput
              style={styles.input}
              value={String(profile.financial.living_cost_tolerance)}
              onChangeText={(value) =>
                updateFinancial('living_cost_tolerance', value)
              }
              placeholder="6000"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />

            <FieldLabel label="Scholarship Requirement" />
            <ChipSelector
              options={['No preference', ...SCHOLARSHIP_OPTIONS]}
              value={scholarshipValue}
              onChange={(value) =>
                updateFinancial(
                  'scholarship_requirement',
                  value === 'No preference' ? '' : value
                )
              }
            />
          </ProfileSection>

          <View style={styles.actionRow}>
            <GradientButton
              label="Save & Use"
              loading={loading}
              disabled={loading}
              onPress={saveAndUseProfile}
            />

            <GradientButton
              label="Use Temporarily"
              loading={loading}
              disabled={loading}
              onPress={useTemporarily}
              variant="secondary"
            />
          </View>
        </View>

        {smartNotice ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>{smartNotice.message}</Text>

            {smartNotice?.can_ignore && smartNotice?.main_blocker ? (
              <GradientButton
                label={`Show without ${blockerLabel}`}
                loading={loading}
                disabled={loading}
                onPress={handleIgnoreBlocker}
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.resultsCard}>
          {hasResults ? (
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Profile Match Results</Text>

              <TouchableOpacity
                style={modalStyles.sortIconButton}
                activeOpacity={0.85}
                onPress={openSortModal}
                disabled={loading}
              >
                <Text style={modalStyles.sortIconText}>⇅</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.resultsWrapper}>
            <PaginatedResults
              title=""
              description=""
              universities={universities}
              loading={loading}
              activeTab="smart"
              page={page}
              setPage={setPage}
              pageSize={pageSize}
              onToggleCompare={onToggleCompare}
              isCompared={isCompared}
              onToggleSave={onToggleSave}
              isSaved={isSaved}
              onOpenUniversity={onOpenUniversity}
            />
          </View>
        </View>
      </ScrollView>

      <SortOptionsModal
        visible={showSortOptions}
        onClose={closeSortModal}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        pageSize={pageSize}
        setPageSize={setPageSize}
        loading={loading}
        onApply={handleApplySort}
      />
    </>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  sheet: {
    width: '92%',
    maxWidth: 430,
    maxHeight: '72%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  headerTextBox: {
    flex: 1,
    paddingRight: 10,
  },

  sheetTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    color: '#0F172A',
  },

  sheetSubtitle: {
    marginTop: 2,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '700',
    color: authTheme.colors.brandMuted,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D7DDE5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
  },

  scrollContent: {
    paddingBottom: 4,
  },

  sortContent: {
    paddingBottom: 4,
  },

  sortIconButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BCEAD8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sortIconText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },
});