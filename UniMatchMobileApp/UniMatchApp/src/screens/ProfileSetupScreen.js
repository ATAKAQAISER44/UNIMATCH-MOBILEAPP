
// src/screens/ProfileSetupScreen.js

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '../services/supabase';
import { getSignedInUser } from '../services/session';

import { apiGet } from '../services/api';

import {
  REGION_COUNTRIES,
  TEST_CONFIG,
  PRIORITY_OPTIONS,
} from '../constants';

import {
  INITIAL_ACADEMIC,
  INITIAL_FINANCIAL,
  INITIAL_GEO,
  INITIAL_PICKER,
  INITIAL_PRIORITIES,
  PRIORITY_KEYS,
  TEST_CATEGORY_HEADERS,
  TEST_CATEGORY_OPTIONS,
} from '../constants/profileSetupConstants';

import {
  getSupabaseError,
  normalizeEducationLevel,
  sortOptionsAlphabetically,
} from '../utils/profileSetupUtils';

import ProfileSetupContent from '../components/profile-setup/ProfileSetupContent';

const TOTAL_STEPS = 4;
const LOGIN_SCREEN = 'Login';
const DASHBOARD_SCREEN = 'Dashboard';
const PROFILE_VIEW_SCREEN = 'ProfileView';

const createInitialAcademic = () => ({
  ...INITIAL_ACADEMIC,
  cgpa_scale: INITIAL_ACADEMIC.cgpa_scale || null,
});

const mapAcademicData = (data) => ({
  current_education_level: data?.current_education_level || '',
  intended_education_level: data?.intended_education_level || '',
  field_of_study: data?.field_of_study || '',
  score_type: data?.score_type === 'GPA/CGPA' ? 'CGPA' : data?.score_type || '',
  score_value: String(data?.score_value || ''),
  cgpa_scale: data?.cgpa_scale || null,
});

const mapTestsData = (tests = []) =>
  tests.map((test) => ({
    test_name: test.test_name,
    score: test.score,
  }));

const mapGeoData = (data) => ({
  preferred_region: data?.preferred_region || '',
  preferred_country: data?.preferred_country || '',
});

const mapFinancialData = (data) => ({
  min_tuition_fee: String(data?.min_tuition_fee || ''),
  max_tuition_fee: String(data?.max_tuition_fee || ''),
  living_cost_tolerance: String(data?.living_cost_tolerance || ''),
  scholarship_requirement: data?.scholarship_requirement || '',
});

const mapPriorityData = (data) => ({
  priority_1: data?.priority_1 || data?.priority_type || '',
  priority_2: data?.priority_2 || '',
  priority_3: data?.priority_3 || '',
  priority_4: data?.priority_4 || '',
  priority_5: data?.priority_5 || '',
});

const getEducationLevelRank = (level) => {
  const normalized = String(level || '').trim().toLowerCase();

  if (!normalized) return null;

  if (
    normalized.includes('high school') ||
    normalized.includes('intermediate') ||
    normalized.includes('higher secondary') ||
    normalized.includes('secondary') ||
    normalized.includes('a-level') ||
    normalized.includes('alevel') ||
    normalized.includes('o-level') ||
    normalized.includes('olevel') ||
    normalized.includes('fsc') ||
    normalized.includes('fa') ||
    normalized.includes('ics') ||
    normalized.includes('icom')
  ) {
    return 1;
  }

  if (
    normalized.includes('bachelor') ||
    normalized.includes('undergraduate') ||
    normalized.includes('bs') ||
    normalized.includes('bsc') ||
    normalized.includes('ba') ||
    normalized.includes('be') ||
    normalized.includes('b.e') ||
    normalized.includes('btech') ||
    normalized.includes('b.tech')
  ) {
    return 2;
  }

  if (
    normalized.includes('master') ||
    normalized.includes('postgraduate') ||
    normalized.includes('ms') ||
    normalized.includes('msc') ||
    normalized.includes('ma') ||
    normalized.includes('mphil') ||
    normalized.includes('m.phil') ||
    normalized.includes('mba') ||
    normalized.includes('me') ||
    normalized.includes('m.e')
  ) {
    return 3;
  }

  if (
    normalized.includes('phd') ||
    normalized.includes('ph.d') ||
    normalized.includes('doctorate') ||
    normalized.includes('doctoral')
  ) {
    return 4;
  }

  return null;
};

const getEducationProgressionError = (currentLevel, intendedLevel) => {
  const currentRank = getEducationLevelRank(currentLevel);
  const intendedRank = getEducationLevelRank(intendedLevel);

  if (!currentRank || !intendedRank) {
    return '';
  }

  if (intendedRank <= currentRank) {
    return 'Intended education level must be higher than your current education level.';
  }

  if (currentRank === 1 && intendedRank > 2) {
    return 'After high school/intermediate, you can apply for a Bachelor’s degree first.';
  }

  if (currentRank === 2 && intendedRank > 3) {
    return 'After Bachelor’s, you can apply for a Master’s degree first.';
  }

  if (currentRank === 3 && intendedRank > 4) {
    return 'After Master’s, you can apply for a PhD degree first.';
  }

  return '';
};

export default function ProfileSetupScreen({ navigation, route }) {
  const routeParams = route?.params || {};
  const explicitEditMode = routeParams.mode === 'edit';
  const returnTo = routeParams.returnTo || PROFILE_VIEW_SCREEN;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(explicitEditMode);
  const [message, setMessage] = useState('');
  const [ranges, setRanges] = useState({});
  const [picker, setPicker] = useState(INITIAL_PICKER);

  const [academic, setAcademic] = useState(createInitialAcademic);
  const [selectedTest, setSelectedTest] = useState('');
  const [testScore, setTestScore] = useState('');
  const [tests, setTests] = useState([]);

  const [geo, setGeo] = useState(INITIAL_GEO);
  const [financial, setFinancial] = useState(INITIAL_FINANCIAL);
  const [priorities, setPriorities] = useState(INITIAL_PRIORITIES);

  const progressPercent = useMemo(() => step * 25, [step]);

  const countriesForRegion = useMemo(() => {
    if (!geo.preferred_region) return [];
    return REGION_COUNTRIES[geo.preferred_region] || [];
  }, [geo.preferred_region]);

  const pickerSelected = useMemo(() => {
    const { key } = picker;

    if (key === 'geo.region') return geo.preferred_region;
    if (key === 'geo.country') return geo.preferred_country;
    if (key === 'financial.scholarship') return financial.scholarship_requirement;
    if (key === 'test') return selectedTest;

    if (key.startsWith('academic.')) {
      return academic[key.replace('academic.', '')] || '';
    }

    if (key.startsWith('priority.')) {
      return priorities[key.replace('priority.', '')] || '';
    }

    return '';
  }, [
    academic,
    financial.scholarship_requirement,
    geo.preferred_country,
    geo.preferred_region,
    picker,
    priorities,
    selectedTest,
  ]);

  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

  const getCurrentUser = useCallback(async () => {
    const {
      data: { user },
      error,
    } = await getSignedInUser();

    if (error || !user) {
      navigation.replace(LOGIN_SCREEN);
      return null;
    }

    return user;
  }, [navigation]);

  const fetchRanges = useCallback(async () => {
    try {
      // PERF: these ranges are only helper hints, so use a short timeout -
      // the form must never wait minutes for them.
      const { ok, data } = await apiGet('/profile-setup/ranges', {
        timeoutMs: 8000,
      });

      if (!ok) {
        throw new Error('Failed to load profile setup ranges.');
      }

      setRanges(data || {});
    } catch (error) {
      console.log('Profile setup ranges error:', error?.message || error);
      setRanges({});
    }
  }, []);

  const fetchExistingProfileData = useCallback(async (userId) => {
    const [
      academicResponse,
      testResponse,
      geoResponse,
      financialResponse,
      priorityResponse,
    ] = await Promise.all([
      supabase
        .from('academic_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),

      supabase.from('user_test_scores').select('*').eq('user_id', userId),

      supabase
        .from('geographic_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),

      supabase
        .from('financial_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),

      supabase
        .from('priority_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const loadError = getSupabaseError([
      academicResponse,
      testResponse,
      geoResponse,
      financialResponse,
      priorityResponse,
    ]);

    if (loadError) throw loadError;

    return {
      academicData: academicResponse.data,
      testData: testResponse.data || [],
      geoData: geoResponse.data,
      financialData: financialResponse.data,
      priorityData: priorityResponse.data,
    };
  }, []);

  const applyExistingProfileData = useCallback(
    ({ academicData, testData, geoData, financialData, priorityData }) => {
      if (academicData) setAcademic(mapAcademicData(academicData));
      if (testData.length > 0) setTests(mapTestsData(testData));
      if (geoData) setGeo(mapGeoData(geoData));
      if (financialData) setFinancial(mapFinancialData(financialData));
      if (priorityData) setPriorities(mapPriorityData(priorityData));

      const foundExistingData = Boolean(
        academicData ||
          testData.length ||
          geoData ||
          financialData ||
          priorityData
      );

      setIsEditMode(explicitEditMode || foundExistingData);
    },
    [explicitEditMode]
  );

  const loadExistingProfile = useCallback(async () => {
    try {
      const user = await getCurrentUser();

      if (!user) return;

      const profileData = await fetchExistingProfileData(user.id);
      applyExistingProfileData(profileData);
    } catch (error) {
      console.log('Load profile error:', error);
      setMessage('Your saved profile could not be loaded. Please check your connection and try again.');
    }
  }, [applyExistingProfileData, fetchExistingProfileData, getCurrentUser]);

  const initializeProfileSetup = useCallback(async () => {
    setPageLoading(true);

    try {
      await Promise.all([fetchRanges(), loadExistingProfile()]);
    } catch (error) {
      console.log('Profile setup init error:', error);
      setMessage('Some of your saved details could not be loaded. Please check your connection and try again.');
    } finally {
      setPageLoading(false);
    }
  }, [fetchRanges, loadExistingProfile]);

  useEffect(() => {
    initializeProfileSetup();
  }, [initializeProfileSetup]);

  const openPicker = useCallback((title, options, key) => {
    setPicker({
      visible: true,
      title,
      options:
        key === 'test'
          ? TEST_CATEGORY_OPTIONS
          : sortOptionsAlphabetically(options),
      key,
    });
  }, []);

  const closePicker = useCallback(() => {
    setPicker((prev) => ({ ...prev, visible: false }));
  }, []);

  const clearPreferredCountry = useCallback(() => {
    setGeo((prev) => ({
      ...prev,
      preferred_country: '',
    }));

    clearMessage();
  }, [clearMessage]);

  const clearPriority = useCallback(
    (priorityKey) => {
      const startIndex = PRIORITY_KEYS.indexOf(priorityKey);

      setPriorities((prev) => {
        const updated = { ...prev };

        for (let index = startIndex; index < PRIORITY_KEYS.length; index += 1) {
          updated[PRIORITY_KEYS[index]] = '';
        }

        return updated;
      });

      clearMessage();
    },
    [clearMessage]
  );

  const isPriorityLocked = useCallback(
    (priorityKey) => {
      const currentIndex = PRIORITY_KEYS.indexOf(priorityKey);

      if (currentIndex <= 0) return false;

      const previousKey = PRIORITY_KEYS[currentIndex - 1];
      return !priorities[previousKey];
    },
    [priorities]
  );

  const getPriorityPlaceholder = useCallback(
    (priorityKey) => {
      const currentIndex = PRIORITY_KEYS.indexOf(priorityKey);

      if (currentIndex > 0 && isPriorityLocked(priorityKey)) {
        return `Select priority ${currentIndex} first`;
      }

      return 'Select priority';
    },
    [isPriorityLocked]
  );

  const handleAcademicPickerSelect = useCallback((key, value) => {
    if (key === 'academic.score_type') {
      setAcademic((prev) => ({
        ...prev,
        score_type: value,
        score_value: '',
        cgpa_scale: value === 'CGPA' ? prev.cgpa_scale : null,
      }));
      return;
    }

    if (key === 'academic.cgpa_scale') {
      setAcademic((prev) => ({
        ...prev,
        cgpa_scale: value,
        score_value: '',
      }));
      return;
    }

    setAcademic((prev) => ({
      ...prev,
      [key.replace('academic.', '')]: value,
    }));
  }, []);

  const handleGeoPickerSelect = useCallback((key, value) => {
    if (key === 'geo.region') {
      setGeo({
        preferred_region: value,
        preferred_country: '',
      });
      return;
    }

    if (key === 'geo.country') {
      setGeo((prev) => ({
        ...prev,
        preferred_country: value,
      }));
    }
  }, []);

  const handlePriorityPickerSelect = useCallback(
    (key, value) => {
      const priorityKey = key.replace('priority.', '');

      if (isPriorityLocked(priorityKey)) {
        const currentIndex = PRIORITY_KEYS.indexOf(priorityKey);
        setMessage(`Please select priority ${currentIndex} first.`);
        return false;
      }

      setPriorities((prev) => ({
        ...prev,
        [priorityKey]: value,
      }));

      clearMessage();
      return true;
    },
    [clearMessage, isPriorityLocked]
  );

  const onPickerSelect = useCallback(
    (value) => {
      const { key } = picker;

      if (key === 'test' && TEST_CATEGORY_HEADERS.includes(value)) {
        return;
      }

      if (key.startsWith('academic.')) {
        handleAcademicPickerSelect(key, value);
      }

      if (key.startsWith('geo.')) {
        handleGeoPickerSelect(key, value);
      }

      if (key === 'financial.scholarship') {
        setFinancial((prev) => ({
          ...prev,
          scholarship_requirement: value,
        }));
      }

      if (key === 'test') {
        setSelectedTest(value);
        setTestScore('');
      }

      if (key.startsWith('priority.')) {
        const success = handlePriorityPickerSelect(key, value);

        if (!success) return;
      }

      closePicker();
    },
    [
      closePicker,
      handleAcademicPickerSelect,
      handleGeoPickerSelect,
      handlePriorityPickerSelect,
      picker,
    ]
  );

  const addTest = useCallback(() => {
    if (!selectedTest || testScore === '') {
      setMessage('Please select a test and enter its score.');
      return;
    }

    const numericScore = Number(testScore);

    if (Number.isNaN(numericScore)) {
      setMessage('Test score must be a valid number.');
      return;
    }

    if (numericScore < 0) {
      setMessage('Test score cannot be negative.');
      return;
    }

    const range = TEST_CONFIG[selectedTest];

    if (range && (numericScore < range.min || numericScore > range.max)) {
      setMessage(
        `${selectedTest} score must be between ${range.min} and ${range.max}.`
      );
      return;
    }

    const alreadyExists = tests.some((test) => test.test_name === selectedTest);

    if (alreadyExists) {
      setMessage('This test has already been added.');
      return;
    }

    setTests((prev) => [
      ...prev,
      {
        test_name: selectedTest,
        score: numericScore,
      },
    ]);

    setSelectedTest('');
    setTestScore('');
    clearMessage();
  }, [clearMessage, selectedTest, testScore, tests]);

  const removeTest = useCallback((index) => {
    setTests((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const isNumberInRange = useCallback(
    (value, rangeKey) => {
      if (!ranges[rangeKey]) return false;

      const numericValue = Number(value);
      const min = Number(ranges[rangeKey].min);
      const max = Number(ranges[rangeKey].max);

      return numericValue >= min && numericValue <= max;
    },
    [ranges]
  );

  const rangeText = useCallback(
    (rangeKey) => {
      if (!ranges[rangeKey]) return 'Range not loaded yet.';

      return `Allowed range: ${ranges[rangeKey].min} - ${ranges[rangeKey].max} USD per year`;
    },
    [ranges]
  );

  const getCgpaMaxValue = useCallback(() => {
    if (!academic.cgpa_scale) return null;

    return Number(String(academic.cgpa_scale).replace('Out of ', ''));
  }, [academic.cgpa_scale]);

  const areEducationLevelsSame = useCallback(() => {
    const currentLevel = normalizeEducationLevel(
      academic.current_education_level
    );

    const intendedLevel = normalizeEducationLevel(
      academic.intended_education_level
    );

    return currentLevel && intendedLevel && currentLevel === intendedLevel;
  }, [academic.current_education_level, academic.intended_education_level]);

  const validateAcademicStep = useCallback(() => {
    if (
      !academic.current_education_level ||
      !academic.intended_education_level ||
      !academic.field_of_study ||
      !academic.score_type
    ) {
      return 'Please complete all academic fields.';
    }

    if (areEducationLevelsSame()) {
      return 'Current education level and intended education level cannot be the same.';
    }

    const educationProgressionError = getEducationProgressionError(
      academic.current_education_level,
      academic.intended_education_level
    );

    if (educationProgressionError) {
      return educationProgressionError;
    }

    if (academic.score_type === 'CGPA' && !academic.cgpa_scale) {
      return 'Please select your CGPA scale.';
    }

    if (academic.score_value === '') {
      return academic.score_type === 'Percentage'
        ? 'Please enter your percentage.'
        : 'Please enter your CGPA.';
    }

    const scoreValue = Number(academic.score_value);

    if (Number.isNaN(scoreValue) || scoreValue < 0) {
      return 'Academic score must be a valid non-negative number.';
    }

    if (academic.score_type === 'Percentage' && scoreValue > 100) {
      return 'Percentage must be between 0 and 100.';
    }

    if (academic.score_type === 'CGPA') {
      const selectedScale = getCgpaMaxValue();

      if (!selectedScale) {
        return 'Please select your CGPA scale.';
      }

      if (scoreValue > selectedScale) {
        return `CGPA must be between 0 and ${selectedScale}.`;
      }
    }

    return '';
  }, [academic, areEducationLevelsSame, getCgpaMaxValue]);

  const validateGeographicStep = useCallback(() => {
    if (!geo.preferred_region) {
      return 'Please select a preferred region.';
    }

    if (!geo.preferred_country) {
      return '';
    }

    const validCountries = REGION_COUNTRIES[geo.preferred_region] || [];

    if (!validCountries.includes(geo.preferred_country)) {
      return 'Selected country does not belong to the selected region.';
    }

    return '';
  }, [geo.preferred_country, geo.preferred_region]);

  const validateFinancialStep = useCallback(() => {
    if (
      !financial.min_tuition_fee ||
      !financial.max_tuition_fee ||
      !financial.living_cost_tolerance ||
      !financial.scholarship_requirement
    ) {
      return 'Please complete all annual financial fields.';
    }

    const minTuition = Number(financial.min_tuition_fee);
    const maxTuition = Number(financial.max_tuition_fee);
    const livingCost = Number(financial.living_cost_tolerance);

    if (
      Number.isNaN(minTuition) ||
      Number.isNaN(maxTuition) ||
      Number.isNaN(livingCost)
    ) {
      return 'Annual financial values must be valid numbers.';
    }

    if (minTuition < 0 || maxTuition < 0 || livingCost < 0) {
      return 'Annual financial values cannot be negative.';
    }

    if (minTuition > maxTuition) {
      return 'Minimum annual tuition fee cannot be greater than maximum annual tuition fee.';
    }

    if (!ranges.tuition_fee_international || !ranges.living_cost) {
      return "We couldn't load the allowed fee ranges from the server. Please check your connection and try again.";
    }

    if (!isNumberInRange(financial.min_tuition_fee, 'tuition_fee_international')) {
      return `Minimum annual tuition fee is outside the allowed range. ${rangeText(
        'tuition_fee_international'
      )}`;
    }

    if (!isNumberInRange(financial.max_tuition_fee, 'tuition_fee_international')) {
      return `Maximum annual tuition fee is outside the allowed range. ${rangeText(
        'tuition_fee_international'
      )}`;
    }

    if (!isNumberInRange(financial.living_cost_tolerance, 'living_cost')) {
      return `Maximum annual living cost is outside the allowed range. ${rangeText(
        'living_cost'
      )}`;
    }

    return '';
  }, [financial, isNumberInRange, rangeText, ranges]);

  const validatePriorityStep = useCallback(() => {
    if (!priorities.priority_1) {
      return 'Please select at least your 1st priority.';
    }

    return '';
  }, [priorities.priority_1]);

  const validateCurrentStep = useCallback(() => {
    if (step === 1) return validateAcademicStep();
    if (step === 2) return validateGeographicStep();
    if (step === 3) return validateFinancialStep();
    if (step === 4) return validatePriorityStep();

    return '';
  }, [
    step,
    validateAcademicStep,
    validateFinancialStep,
    validateGeographicStep,
    validatePriorityStep,
  ]);

  const validateAllSteps = useCallback(() => {
    return (
      validateAcademicStep() ||
      validateGeographicStep() ||
      validateFinancialStep() ||
      validatePriorityStep()
    );
  }, [
    validateAcademicStep,
    validateFinancialStep,
    validateGeographicStep,
    validatePriorityStep,
  ]);

  const handleNext = useCallback(() => {
    clearMessage();

    const error = validateCurrentStep();

    if (error) {
      setMessage(error);
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
    }
  }, [clearMessage, step, validateCurrentStep]);

  const handleBack = useCallback(() => {
    clearMessage();

    if (step > 1) {
      setStep((prev) => prev - 1);
      return;
    }

    if (explicitEditMode) {
      navigation.navigate(returnTo || PROFILE_VIEW_SCREEN, {
        refreshAt: Date.now(),
      }, { pop: true });
    }
  }, [clearMessage, explicitEditMode, navigation, returnTo, step]);

  const handleStepPress = useCallback(
    (targetStep) => {
      clearMessage();

      if (targetStep <= step) {
        setStep(targetStep);
        return;
      }

      setMessage('Please complete the current step before moving forward.');
    },
    [clearMessage, step]
  );

  const getAvailablePriorityOptions = useCallback(
    (currentKey) => {
      const selectedValues = Object.entries(priorities)
        .filter(([key]) => key !== currentKey)
        .map(([, value]) => value)
        .filter(Boolean);

      return PRIORITY_OPTIONS.filter(
        (option) => !selectedValues.includes(option)
      );
    },
    [priorities]
  );

  const buildAcademicPayload = useCallback(
    (userId) => ({
      user_id: userId,
      current_education_level: academic.current_education_level,
      intended_education_level: academic.intended_education_level,
      field_of_study: academic.field_of_study,
      score_type: academic.score_type,
      score_value: Number(academic.score_value),
      cgpa_scale: academic.score_type === 'CGPA' ? academic.cgpa_scale : null,
    }),
    [academic]
  );

  const buildGeoPayload = useCallback(
    (userId) => ({
      user_id: userId,
      preferred_region: geo.preferred_region,
      preferred_country: geo.preferred_country || '',
    }),
    [geo.preferred_country, geo.preferred_region]
  );

  const buildFinancialPayload = useCallback(
    (userId) => ({
      user_id: userId,
      min_tuition_fee: Number(financial.min_tuition_fee),
      max_tuition_fee: Number(financial.max_tuition_fee),
      living_cost_tolerance: Number(financial.living_cost_tolerance),
      scholarship_requirement: financial.scholarship_requirement,
    }),
    [financial]
  );

  const buildPriorityPayload = useCallback(
    (userId) => ({
      user_id: userId,
      priority_type: priorities.priority_1,
      priority_1: priorities.priority_1,
      priority_2: priorities.priority_2,
      priority_3: priorities.priority_3,
      priority_4: priorities.priority_4,
      priority_5: priorities.priority_5,
    }),
    [priorities]
  );

  const saveProfilePreferences = useCallback(
    async (userId) => {
      const saveResults = await Promise.all([
        supabase
          .from('academic_preferences')
          .upsert(buildAcademicPayload(userId), { onConflict: 'user_id' }),

        supabase
          .from('geographic_preferences')
          .upsert(buildGeoPayload(userId), { onConflict: 'user_id' }),

        supabase
          .from('financial_preferences')
          .upsert(buildFinancialPayload(userId), { onConflict: 'user_id' }),

        supabase
          .from('priority_preferences')
          .upsert(buildPriorityPayload(userId), { onConflict: 'user_id' }),

        supabase
          .from('profiles')
          .update({ profile_completed: true })
          .eq('id', userId),
      ]);

      const saveError = getSupabaseError(saveResults);

      if (saveError) throw saveError;
    },
    [
      buildAcademicPayload,
      buildFinancialPayload,
      buildGeoPayload,
      buildPriorityPayload,
    ]
  );

  const saveTestScores = useCallback(
    async (userId) => {
      const { error: deleteTestsError } = await supabase
        .from('user_test_scores')
        .delete()
        .eq('user_id', userId);

      if (deleteTestsError) throw deleteTestsError;

      if (tests.length === 0) return;

      const testPayload = tests.map((test) => ({
        user_id: userId,
        test_name: test.test_name,
        score: test.score,
      }));

      const { error: testsError } = await supabase
        .from('user_test_scores')
        .insert(testPayload);

      if (testsError) throw testsError;
    },
    [tests]
  );

  const goAfterSuccessfulSubmit = useCallback(() => {
    if (explicitEditMode) {
      navigation.navigate(returnTo || PROFILE_VIEW_SCREEN, {
        refreshAt: Date.now(),
      }, { pop: true });
      return;
    }

    navigation.replace(DASHBOARD_SCREEN);
  }, [explicitEditMode, navigation, returnTo]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    clearMessage();

    const validationError = validateAllSteps();

    if (validationError) {
      setMessage(validationError);
      setLoading(false);
      return;
    }

    try {
      const user = await getCurrentUser();

      if (!user) return;

      await saveProfilePreferences(user.id);
      await saveTestScores(user.id);

      goAfterSuccessfulSubmit();
    } catch (error) {
      console.log('Profile submit error:', error);
      setMessage(error?.message || 'Something went wrong while saving your profile.');
    } finally {
      setLoading(false);
    }
  }, [
    clearMessage,
    getCurrentUser,
    goAfterSuccessfulSubmit,
    saveProfilePreferences,
    saveTestScores,
    validateAllSteps,
  ]);

  return (
    <ProfileSetupContent
      step={step}
      loading={loading}
      pageLoading={pageLoading}
      isEditMode={isEditMode}
      message={message}
      ranges={ranges}
      picker={picker}
      pickerSelected={pickerSelected}
      progressPercent={progressPercent}
      academic={academic}
      setAcademic={setAcademic}
      selectedTest={selectedTest}
      testScore={testScore}
      tests={tests}
      setTestScore={setTestScore}
      geo={geo}
      countriesForRegion={countriesForRegion}
      financial={financial}
      setFinancial={setFinancial}
      priorities={priorities}
      openPicker={openPicker}
      closePicker={closePicker}
      onPickerSelect={onPickerSelect}
      addTest={addTest}
      removeTest={removeTest}
      clearPreferredCountry={clearPreferredCountry}
      clearPriority={clearPriority}
      isPriorityLocked={isPriorityLocked}
      getPriorityPlaceholder={getPriorityPlaceholder}
      getAvailablePriorityOptions={getAvailablePriorityOptions}
      handleStepPress={handleStepPress}
      handleBack={handleBack}
      handleNext={handleNext}
      handleSubmit={handleSubmit}
    />
  );
}