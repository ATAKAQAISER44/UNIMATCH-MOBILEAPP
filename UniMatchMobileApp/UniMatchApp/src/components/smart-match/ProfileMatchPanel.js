
// src/components/smart-match/ProfileMatchPanel.js

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Text, TextInput } from '../AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bottomPadding } from '../../utils/safeArea';

import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../services/supabase';
import { getSignedInUser } from '../../services/session';
import { normalizeIntendedLevel } from '../../utils/profileSetupUtils';
import { CGPA_SCALE_OPTIONS, SCORE_TYPE_OPTIONS } from '../../constants/profileSetupConstants';
import {
  SMART_SORT_OPTIONS,
  SMART_SORT_ORDER_OPTIONS,
  sortUniversitiesLocally,
} from '../../utils/smartMatchSort';
import PaginatedResults from './PaginatedResults';
import SelectField from './SelectField';
import useProfileOptions from './useProfileOptions';
import { smartMatchUIStyles as styles } from '../../styles/smartMatchUIStyles';
import { authTheme } from '../../styles/authTheme';
import useKeyboardAwareScroll from '../../utils/useKeyboardAwareScroll';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

const DEFAULT_SORT_BY = 'official_rank';
const DEFAULT_SORT_ORDER = 'asc';
// 0 = no limit: every matching university is returned and paged in the app.
const DEFAULT_TOP_N = 0;
const DEFAULT_PAGE_SIZE = 5;

const FIELD_ORDER = [
  'intended_education_level',
  'field_of_study',
  'score_type',
  'cgpa_scale',
  'score_value',
  'preferred_region',
  'preferred_country',
  'min_tuition_fee',
  'max_tuition_fee',
  'living_cost_tolerance',
  'scholarship_requirement',
];

const INITIAL_PROFILE = {
  user: {
    country: '',
  },
  academic: {
    intended_education_level: '',
    field_of_study: '',
    score_type: 'CGPA',
    score_value: '',
    cgpa_scale: '',
  },
  geographic: {
    preferred_region: '',
    preferred_country: [],
  },
  financial: {
    min_tuition_fee: '',
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

function splitCountries(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeScoreType(value) {
  if (value === 'GPA/CGPA') return 'CGPA';
  return value || 'CGPA';
}

function getCgpaScaleNumber(scale) {
  const match = String(scale || '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function formatAmount(value) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return String(value);
  return String(number).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getRange(ranges, key) {
  const range = ranges?.[key];
  if (!range) return null;

  const min = Number(range.min);
  const max = Number(range.max);

  return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : null;
}

function rangeHint(ranges, key) {
  const range = getRange(ranges, key);
  return range ? `Range: ${formatAmount(range.min)}–${formatAmount(range.max)}` : '';
}

// Same rules as web ProfileMatchPanel. Messages are kept short.
function getValidationErrors(profile, ranges, regionCountries) {
  const errors = {};
  const { academic, geographic, financial } = profile;

  if (!academic.intended_education_level) errors.intended_education_level = 'Select a degree.';
  if (!academic.field_of_study) errors.field_of_study = 'Select a field.';
  if (!academic.score_type) errors.score_type = 'Select a score type.';

  if (academic.score_type === 'CGPA' && !academic.cgpa_scale) {
    errors.cgpa_scale = 'Select a CGPA scale.';
  }

  if (String(academic.score_value).trim() === '') {
    errors.score_value = academic.score_type === 'Percentage' ? 'Enter your percentage.' : 'Enter your CGPA.';
  } else {
    const score = Number(academic.score_value);

    if (Number.isNaN(score) || score < 0) {
      errors.score_value = 'Enter a number, 0 or more.';
    } else if (academic.score_type === 'Percentage' && score > 100) {
      errors.score_value = 'Must be 0–100.';
    } else if (academic.score_type === 'CGPA') {
      const scale = getCgpaScaleNumber(academic.cgpa_scale);
      if (scale && score > scale) errors.score_value = `Must be 0–${scale}.`;
    }
  }

  if (!geographic.preferred_region) {
    errors.preferred_region = 'Select a region.';
  } else if (geographic.preferred_country.length > 0) {
    const allowed = regionCountries[geographic.preferred_region] || [];

    if (geographic.preferred_country.some((country) => !allowed.includes(country))) {
      errors.preferred_country = 'Pick countries in this region.';
    }
  }

  const tuitionRange = getRange(ranges, 'tuition_fee_international');
  const livingRange = getRange(ranges, 'living_cost');

  const checkAmount = (key, emptyMessage, range) => {
    const text = String(financial[key]).trim();

    if (text === '') {
      errors[key] = emptyMessage;
      return null;
    }

    const number = Number(text);

    if (Number.isNaN(number) || number < 0) {
      errors[key] = 'Enter a number, 0 or more.';
      return null;
    }

    if (range && (number < range.min || number > range.max)) {
      errors[key] = `Outside range (${formatAmount(range.min)}–${formatAmount(range.max)}).`;
    }

    return number;
  };

  const minTuition = checkAmount('min_tuition_fee', 'Enter a min fee.', tuitionRange);
  const maxTuition = checkAmount('max_tuition_fee', 'Enter a max fee.', tuitionRange);
  checkAmount('living_cost_tolerance', 'Enter a living cost.', livingRange);

  if (minTuition !== null && maxTuition !== null && minTuition > maxTuition && !errors.max_tuition_fee) {
    errors.max_tuition_fee = 'Max must be at least the min.';
  }

  if (!financial.scholarship_requirement) {
    errors.scholarship_requirement = 'Choose a scholarship option.';
  }

  return errors;
}

function getSupabaseErrorMessage(results = []) {
  return results.find((result) => result?.error)?.error?.message || '';
}

const FieldLabel = memo(function FieldLabel({ label }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
});

const FieldError = memo(function FieldError({ error }) {
  if (!error) return null;
  return <Text style={localStyles.fieldError}>{error}</Text>;
});

const FieldHint = memo(function FieldHint({ text }) {
  if (!text) return null;
  return <Text style={localStyles.fieldHint}>{text}</Text>;
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
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((option) => {
        const active = value === option;

        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, localStyles.chipTouch, active && styles.chipActive]}
            onPress={() => onChange(option)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
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
            style={[styles.chip, localStyles.chipTouch, active && styles.chipActive]}
            onPress={() => onChange(optionValue)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
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
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
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
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
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
          options={SMART_SORT_OPTIONS}
          value={sortBy}
          onChange={setSortBy}
        />
      </View>

      <View style={styles.sortSection}>
        <FieldLabel label="Order" />
        <OptionChipSelector
          options={SMART_SORT_ORDER_OPTIONS}
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
              accessibilityRole="button"
              accessibilityLabel="Close"
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
  datasetKey,
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
  const insets = useSafeAreaInsets();
  // Keeps the focused field above the keyboard.
  const keyboard = useKeyboardAwareScroll();
  const [userId, setUserId] = useState(null);

  const {
    ranges,
    regions,
    regionCountries,
    fieldsOfStudy,
    scholarshipOptions,
    degreeLevels,
  } = useProfileOptions();

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

  // Same local sort as the web, so the chosen order holds on every page.
  const sortedUniversities = useMemo(
    () => sortUniversitiesLocally(universities, sortBy, sortOrder),
    [universities, sortBy, sortOrder]
  );

  const blockerLabel = useMemo(
    () =>
      smartNotice?.main_blocker
        ? String(smartNotice.main_blocker).replace(/_/g, ' ')
        : '',
    [smartNotice?.main_blocker]
  );

  const validationErrors = useMemo(
    () => getValidationErrors(profile, ranges, regionCountries),
    [profile, ranges, regionCountries]
  );

  const hasErrors = Object.keys(validationErrors).length > 0;

  // Keep a saved value visible even if the dataset list does not have it.
  const withCurrent = useCallback(
    (list, current) => (current && !list.includes(current) ? [...list, current] : list),
    []
  );

  const regionOptions = useMemo(
    () => withCurrent(regions, profile.geographic.preferred_region),
    [profile.geographic.preferred_region, regions, withCurrent]
  );

  const countryOptions = useMemo(
    () => regionCountries[profile.geographic.preferred_region] || [],
    [profile.geographic.preferred_region, regionCountries]
  );

  const fieldOptions = useMemo(
    () => withCurrent(fieldsOfStudy, profile.academic.field_of_study),
    [fieldsOfStudy, profile.academic.field_of_study, withCurrent]
  );

  const scholarshipChoices = useMemo(
    () => withCurrent(scholarshipOptions, profile.financial.scholarship_requirement),
    [profile.financial.scholarship_requirement, scholarshipOptions, withCurrent]
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

        supabase.from('profiles').select('country').eq('id', user.id).maybeSingle(),
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
        accountResponse,
      ] = responses;

      const academic = academicResponse.data || {};
      const geographic = geographicResponse.data || {};
      const financial = financialResponse.data || {};
      const tests = testsResponse.data || [];
      const scoreType = normalizeScoreType(academic.score_type);

      setProfile({
        user: {
          country: accountResponse.data?.country || '',
        },
        academic: {
          intended_education_level: normalizeIntendedLevel(academic.intended_education_level),
          field_of_study: academic.field_of_study || '',
          score_type: scoreType,
          score_value: normalizeValue(academic.score_value),
          cgpa_scale: scoreType === 'CGPA' ? academic.cgpa_scale || '' : '',
        },
        geographic: {
          preferred_region: geographic.preferred_region || '',
          preferred_country: splitCountries(geographic.preferred_country),
        },
        financial: {
          min_tuition_fee: normalizeValue(financial.min_tuition_fee),
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
    setProfile((prev) => {
      const nextAcademic = { ...prev.academic, [key]: value };

      if (key === 'score_type' && value !== 'CGPA') {
        nextAcademic.cgpa_scale = '';
      }

      return { ...prev, academic: nextAcademic };
    });
  }, []);

  const updateGeographic = useCallback((key, value) => {
    setProfile((prev) => {
      const nextGeographic = { ...prev.geographic, [key]: value };

      // Countries must belong to the chosen region.
      if (key === 'preferred_region' && value !== prev.geographic.preferred_region) {
        nextGeographic.preferred_country = [];
      }

      return { ...prev, geographic: nextGeographic };
    });
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

  const firstError = useCallback(() => {
    const field = FIELD_ORDER.find((key) => validationErrors[key]);
    return field ? validationErrors[field] : '';
  }, [validationErrors]);

  const buildPayload = useCallback(
    () => ({
      user: {
        country: profile.user?.country || '',
      },
      academic: {
        intended_education_level:
          profile.academic.intended_education_level,
        field_of_study: profile.academic.field_of_study,
        score_type: profile.academic.score_type || 'CGPA',
        score_value: toNumberOrEmpty(profile.academic.score_value),
        cgpa_scale:
          profile.academic.score_type === 'CGPA'
            ? profile.academic.cgpa_scale
            : null,
      },
      geographic: {
        preferred_region: profile.geographic.preferred_region,
        preferred_country: profile.geographic.preferred_country.join(', '),
      },
      financial: {
        min_tuition_fee: toNumberOrEmpty(profile.financial.min_tuition_fee),
        max_tuition_fee: toNumberOrEmpty(profile.financial.max_tuition_fee),
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

      const error = firstError();

      if (error) {
        setErrorMessage(error);
        return false;
      }

      setPage(1);

      fetchSmartMatch({
        temporaryProfile: buildPayload(),
        extraIgnored,
        preserveIgnored,
        sortBy,
        sortOrder,
        topN: DEFAULT_TOP_N,
      });

      return true;
    },
    [
      buildPayload,
      fetchSmartMatch,
      firstError,
      setErrorMessage,
      sortBy,
      sortOrder,
    ]
  );

  const useTemporarily = useCallback(() => {
    if (runProfileMatch([])) {
      setInfoMessage('Showing results for these changes only. Your saved profile was not changed.');
    }
  }, [runProfileMatch, setInfoMessage]);

  const saveAndUseProfile = useCallback(async () => {
    try {
      setMessage('');

      const error = firstError();

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
            cgpa_scale: payload.academic.cgpa_scale,
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
            min_tuition_fee: payload.financial.min_tuition_fee,
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

      if (runProfileMatch([])) {
        setInfoMessage('Profile saved. Your Smart Match results have been updated.');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      setErrorMessage('Could not save profile.');
    }
  }, [
    buildPayload,
    firstError,
    runProfileMatch,
    setErrorMessage,
    setInfoMessage,
    userId,
  ]);

  const handleApplySort = useCallback(() => {
    setShowSortOptions(false);
    setPage(1);

    // Results already on screen are re-sorted locally; the backend is asked
    // again only when the form is valid (same as the web).
    if (!hasErrors) runProfileMatch([], true);
  }, [hasErrors, runProfileMatch]);

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

  const isPercentage = profile.academic.score_type === 'Percentage';
  const cgpaScaleNumber = getCgpaScaleNumber(profile.academic.cgpa_scale);
  const scoreHint = isPercentage
    ? 'Range: 0–100'
    : cgpaScaleNumber
      ? `Range: 0–${cgpaScaleNumber}`
      : '';
  const tuitionHint = rangeHint(ranges, 'tuition_fee_international');
  const livingHint = rangeHint(ranges, 'living_cost');

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
        contentContainerStyle={[styles.scroll, bottomPadding(insets, 120), keyboard.extraSpace(24)]}
        ref={keyboard.ref}
        onScroll={keyboard.onScroll}
        scrollEventThrottle={32}
        keyboardShouldPersistTaps="handled"
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
              options={degreeLevels}
              value={profile.academic.intended_education_level}
              onChange={(value) =>
                updateAcademic('intended_education_level', value)
              }
            />
            <FieldError error={validationErrors.intended_education_level} />

            <FieldLabel label="Field of Study" />
            <SelectField
              title="Field of Study"
              placeholder="Select field"
              value={profile.academic.field_of_study}
              options={fieldOptions}
              invalid={!!validationErrors.field_of_study}
              onChange={(value) => updateAcademic('field_of_study', value)}
            />
            <FieldError error={validationErrors.field_of_study} />

            <FieldLabel label="Score Type" />
            <ChipSelector
              options={SCORE_TYPE_OPTIONS}
              value={profile.academic.score_type}
              onChange={(value) => updateAcademic('score_type', value)}
            />
            <FieldError error={validationErrors.score_type} />

            {profile.academic.score_type === 'CGPA' ? (
              <>
                <FieldLabel label="CGPA Scale" />
                <ChipSelector
                  options={CGPA_SCALE_OPTIONS}
                  value={profile.academic.cgpa_scale}
                  onChange={(value) => updateAcademic('cgpa_scale', value)}
                />
                <FieldError error={validationErrors.cgpa_scale} />
              </>
            ) : null}

            <FieldLabel label={isPercentage ? 'Percentage' : 'CGPA'} />
            <TextInput
              style={[styles.input, localStyles.inputTight, validationErrors.score_value && localStyles.inputInvalid]}
              value={String(profile.academic.score_value)}
              onChangeText={(value) =>
                updateAcademic('score_value', value)
              }
              placeholder={isPercentage ? '85' : '3.46'}
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
            />
            <FieldHint text={scoreHint} />
            <FieldError error={validationErrors.score_value} />
          </ProfileSection>

          <ProfileSection title="Location" icon="🌍">
            <FieldLabel label="Preferred Region" />
            <ChipSelector
              options={regionOptions}
              value={profile.geographic.preferred_region}
              onChange={(value) =>
                updateGeographic('preferred_region', value)
              }
            />
            <FieldError error={validationErrors.preferred_region} />

            <FieldLabel label="Preferred Countries (optional)" />
            <SelectField
              multiple
              title="Countries"
              placeholder={profile.geographic.preferred_region ? 'Any country in region' : 'Select region first'}
              value={profile.geographic.preferred_country}
              options={countryOptions}
              disabled={!profile.geographic.preferred_region}
              invalid={!!validationErrors.preferred_country}
              onChange={(value) => updateGeographic('preferred_country', value)}
            />
            <FieldError error={validationErrors.preferred_country} />
          </ProfileSection>

          <ProfileSection title="Financial" icon="💳">
            <FieldLabel label="Min Tuition Fee (USD/year)" />
            <TextInput
              style={[styles.input, localStyles.inputTight, validationErrors.min_tuition_fee && localStyles.inputInvalid]}
              value={String(profile.financial.min_tuition_fee)}
              onChangeText={(value) =>
                updateFinancial('min_tuition_fee', value)
              }
              placeholder="0"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />
            <FieldHint text={tuitionHint} />
            <FieldError error={validationErrors.min_tuition_fee} />

            <FieldLabel label="Max Tuition Fee (USD/year)" />
            <TextInput
              style={[styles.input, localStyles.inputTight, validationErrors.max_tuition_fee && localStyles.inputInvalid]}
              value={String(profile.financial.max_tuition_fee)}
              onChangeText={(value) =>
                updateFinancial('max_tuition_fee', value)
              }
              placeholder="78000"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />
            <FieldHint text={tuitionHint} />
            <FieldError error={validationErrors.max_tuition_fee} />

            <FieldLabel label="Max Living Cost (USD/year)" />
            <TextInput
              style={[styles.input, localStyles.inputTight, validationErrors.living_cost_tolerance && localStyles.inputInvalid]}
              value={String(profile.financial.living_cost_tolerance)}
              onChangeText={(value) =>
                updateFinancial('living_cost_tolerance', value)
              }
              placeholder="6000"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />
            <FieldHint text={livingHint} />
            <FieldError error={validationErrors.living_cost_tolerance} />

            <FieldLabel label="Scholarship" />
            <ChipSelector
              options={scholarshipChoices}
              value={profile.financial.scholarship_requirement}
              onChange={(value) =>
                updateFinancial('scholarship_requirement', value)
              }
            />
            <FieldError error={validationErrors.scholarship_requirement} />
          </ProfileSection>

          {hasErrors ? (
            <Text style={localStyles.blockedText}>Fix the fields in red to continue.</Text>
          ) : null}

          <View style={styles.actionRow}>
            <GradientButton
              label="Save & Use"
              loading={loading}
              disabled={loading || hasErrors}
              onPress={saveAndUseProfile}
            />

            <GradientButton
              label="Use Temporarily"
              loading={loading}
              disabled={loading || hasErrors}
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
                disabled={loading || hasErrors}
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
                accessibilityRole="button"
                accessibilityLabel="Sort results"
              >
                <Text style={modalStyles.sortIconText}>⇅</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.resultsWrapper}>
            <PaginatedResults
              title=""
              description=""
              dataset={datasetKey}
              universities={sortedUniversities}
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

const localStyles = StyleSheet.create({
  chipTouch: {
    minHeight: 40,
  },

  inputTight: {
    marginBottom: 4,
  },

  inputInvalid: {
    borderColor: '#FCA5A5',
  },

  fieldHint: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: authTheme.colors.brandMuted,
    marginBottom: 4,
  },

  fieldError: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
    color: '#B91C1C',
    marginTop: 2,
    marginBottom: 8,
  },

  blockedText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 8,
    textAlign: 'center',
  },
});

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
    width: 40,
    height: 40,
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
    width: 40,
    height: 40,
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