
// src/screens/SmartMatchScreen.js

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { View, StatusBar } from 'react-native';

import { apiPost, getApiErrorMessage, HEAVY_TIMEOUT_MS } from '../services/api';
import { supabase } from '../services/supabase';
import { getSignedInUser } from '../services/session';
import { normalizeIntendedLevel } from '../utils/profileSetupUtils';
import { authTheme } from '../styles/authTheme';
import { smartMatchStyles as styles } from '../styles/smartMatchStyles';

import ProfileMatchPanel from '../components/smart-match/ProfileMatchPanel';
import CustomExplorePanel from '../components/smart-match/CustomExplorePanel';
import SmartMatchTopBar from '../components/smart-match/SmartMatchTopBar';
import CompareBar from '../components/CompareBar';
import CompareModal from '../components/CompareModal';
import { useCompareList } from '../services/compareList';
import SmartMatchHeaderCard from '../components/smart-match/SmartMatchHeaderCard';

// 0 = no limit: every matching university is returned and paged in the app.
const DEFAULT_TOP_N = 0;
const DEFAULT_SORT_BY = 'official_rank';
const DEFAULT_SORT_ORDER = 'asc';
const DEFAULT_DEGREE = 'Master';
const DEFAULT_PRIORITY = 'Balanced Preference';

const LOGIN_SCREEN = 'Login';
const DASHBOARD_SCREEN = 'Dashboard';

const PROFILE_TAB = 'profile';

function getErrorMessage(data, fallback = 'Request failed.') {
  if (!data) return fallback;

  if (typeof data.detail === 'string') return data.detail;

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item?.msg || JSON.stringify(item))
      .join('\n');
  }

  if (typeof data.detail === 'object' && data.detail !== null) {
    return data.detail?.msg || JSON.stringify(data.detail);
  }

  if (typeof data.message === 'string') return data.message;

  return fallback;
}

function getDegreeFromProfile(profile) {
  return (
    profile?.academic?.intended_education_level ||
    profile?.degree ||
    DEFAULT_DEGREE
  );
}

function getPriorityFromProfile(profile) {
  return (
    profile?.priority ||
    profile?.priority_type ||
    profile?.academic?.priority ||
    profile?.academic?.priority_type ||
    profile?.priority_preferences?.priority_1 ||
    profile?.priority_preferences?.priority_type ||
    DEFAULT_PRIORITY
  );
}

function getDatasetKey(route) {
  return route?.params?.datasetKey || route?.params?.dataset || 'qs';
}

function getDatasetTitle(route, datasetKey) {
  return route?.params?.title || `${String(datasetKey).toUpperCase()} Smart Match`;
}

function getSupabaseError(results = []) {
  return results.find((result) => result?.error)?.error || null;
}

function createNotice(message, extra = {}) {
  return {
    message,
    can_ignore: false,
    main_blocker: null,
    ...extra,
  };
}

function mergeUniqueValues(firstList = [], secondList = []) {
  return [...new Set([...firstList, ...secondList])];
}

// PERF: goes through the shared API helper, so it has a timeout and fails
// with a clear message instead of hanging when the backend is unreachable.
async function postJson(path, payload) {
  const { ok, data } = await apiPost(path, payload, {
    timeoutMs: HEAVY_TIMEOUT_MS,
  });

  return { ok, data };
}

export default function SmartMatchScreen({ route = {}, navigation }) {
  const datasetKey = useMemo(() => getDatasetKey(route), [route]);

  const datasetTitle = useMemo(() => {
    return getDatasetTitle(route, datasetKey);
  }, [datasetKey, route]);

  const [activeSubTab, setActiveSubTab] = useState(PROFILE_TAB);

  const [profileResults, setProfileResults] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileNotice, setProfileNotice] = useState(null);
  const [ignoredFilters, setIgnoredFilters] = useState([]);
  const [lastSmartProfile, setLastSmartProfile] = useState(null);

  const [customResults, setCustomResults] = useState([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customNotice, setCustomNotice] = useState(null);

  const loadCurrentUser = useCallback(async () => {
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

  const fetchProfilePreferences = useCallback(async (userId) => {
    const responses = await Promise.all([
      supabase
        .from('academic_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),

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
        .from('user_test_scores')
        .select('*')
        .eq('user_id', userId),

      supabase
        .from('priority_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),

      // Home country: the backend uses the local fee when it matches.
      supabase.from('profiles').select('country').eq('id', userId).maybeSingle(),
    ]);

    const loadError = getSupabaseError(responses);

    if (loadError) throw loadError;

    const [
      academicResponse,
      geographicResponse,
      financialResponse,
      testsResponse,
      priorityResponse,
      accountResponse,
    ] = responses;

    const priorityData = priorityResponse.data || {};

    const academic = academicResponse.data || {};

    return {
      user: { country: accountResponse.data?.country || '' },
      academic: { ...academic, intended_education_level: normalizeIntendedLevel(academic.intended_education_level) },
      geographic: geographicResponse.data || {},
      financial: financialResponse.data || {},
      tests: testsResponse.data || [],
      priority_preferences: priorityData,
      priority:
        priorityData.priority_1 ||
        priorityData.priority_type ||
        DEFAULT_PRIORITY,
    };
  }, []);

  const loadCurrentProfile = useCallback(async () => {
    try {
      const user = await loadCurrentUser();

      if (!user) return null;

      return await fetchProfilePreferences(user.id);
    } catch (error) {
      console.error('Smart profile load error:', error);
      return null;
    }
  }, [fetchProfilePreferences, loadCurrentUser]);

  const resetProfileRunState = useCallback(() => {
    setIgnoredFilters([]);
    setProfileNotice(null);
    setProfileResults([]);
  }, []);

  // The student's home country, so a temporary profile typed in Profile
  // Match also gets local fees where they apply.
  const homeCountryRef = useRef('');
  useEffect(() => {
    let active = true;
    getSignedInUser()
      .then(({ data }) =>
        data?.user ? supabase.from('profiles').select('country').eq('id', data.user.id).maybeSingle() : { data: null }
      )
      .then(({ data }) => {
        if (active) homeCountryRef.current = data?.country || '';
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const buildSmartMatchPayload = useCallback(
    ({ profileToSend, ignoredList, sortBy, sortOrder, topN }) => ({
      priority: getPriorityFromProfile(profileToSend),
      degree: getDegreeFromProfile(profileToSend),
      top_n: topN,
      sort_by: sortBy,
      sort_order: sortOrder,
      profile: {
        ...profileToSend,
        user: profileToSend?.user?.country ? profileToSend.user : { country: homeCountryRef.current },
        _ignored_filters: ignoredList,
      },
    }),
    []
  );

  const fetchSmartMatch = useCallback(
    async ({
      temporaryProfile = null,
      extraIgnored = [],
      preserveIgnored = false,
      sortBy = DEFAULT_SORT_BY,
      sortOrder = DEFAULT_SORT_ORDER,
      topN = DEFAULT_TOP_N,
    } = {}) => {
      try {
        setProfileLoading(true);
        setProfileResults([]);

        const isNewStrictRun = extraIgnored.length === 0 && !preserveIgnored;

        if (isNewStrictRun) {
          resetProfileRunState();
        }

        let profileToSend = temporaryProfile || lastSmartProfile;

        if (!profileToSend) {
          profileToSend = await loadCurrentProfile();
        }

        if (!profileToSend) {
          setProfileNotice(
            createNotice(
              'We could not find your profile. Please log in again and complete your profile setup.'
            )
          );
          return;
        }

        const ignoredList = isNewStrictRun
          ? []
          : mergeUniqueValues(ignoredFilters, extraIgnored);

        setLastSmartProfile(profileToSend);

        if (extraIgnored.length > 0) {
          setIgnoredFilters((prev) => mergeUniqueValues(prev, extraIgnored));
        }

        const payload = buildSmartMatchPayload({
          profileToSend,
          ignoredList,
          sortBy,
          sortOrder,
          topN,
        });

        const { ok, data } = await postJson(
          `/rankings/${datasetKey}/smart-match`,
          payload
        );

        if (!ok) {
          setProfileNotice(
            createNotice(getErrorMessage(data, 'Smart Match could not load results. Please try again.'))
          );
          setProfileResults([]);
          return;
        }

        setProfileResults(data?.results || []);
        setProfileNotice(data?.empty_analysis || null);
      } catch (error) {
        console.log('Smart match error:', error?.message || error);

        setProfileNotice(
          createNotice(
            getApiErrorMessage(
              error,
              'Smart Match could not load results. Please try again.'
            )
          )
        );

        setProfileResults([]);
      } finally {
        setProfileLoading(false);
      }
    },
    [
      buildSmartMatchPayload,
      datasetKey,
      ignoredFilters,
      lastSmartProfile,
      loadCurrentProfile,
      resetProfileRunState,
    ]
  );

  const buildCustomExplorePayload = useCallback(
    ({ filters, sortBy, sortOrder, topN }) => ({
      filters,
      sort_by: sortBy,
      sort_order: sortOrder,
      top_n: topN,
    }),
    []
  );

  const fetchCustomExplore = useCallback(
    async ({
      filters = [],
      sortBy = DEFAULT_SORT_BY,
      sortOrder = DEFAULT_SORT_ORDER,
      topN = DEFAULT_TOP_N,
    } = {}) => {
      try {
        setCustomLoading(true);
        setCustomNotice(null);
        setCustomResults([]);

        const payload = buildCustomExplorePayload({
          filters,
          sortBy,
          sortOrder,
          topN,
        });

        const { ok, data } = await postJson(
          `/rankings/${datasetKey}/custom-explore`,
          payload
        );

        if (!ok) {
          setCustomNotice({
            message: getErrorMessage(data, 'Custom Explore could not load results. Please try again.'),
          });
          setCustomResults([]);
          return;
        }

        setCustomResults(data?.results || []);
        setCustomNotice(data?.empty_analysis || null);
      } catch (error) {
        console.log('Custom Explore error:', error?.message || error);

        setCustomNotice({
          message: getApiErrorMessage(
            error,
            'Custom Explore could not load results. Please try again.'
          ),
        });

        setCustomResults([]);
      } finally {
        setCustomLoading(false);
      }
    },
    [buildCustomExplorePayload, datasetKey]
  );

  const handleBackPress = useCallback(() => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate(DASHBOARD_SCREEN, undefined, { pop: true });
  }, [navigation]);

  const headerComponent = useMemo(
    () => (
      <SmartMatchHeaderCard
        datasetKey={datasetKey}
        datasetTitle={datasetTitle}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
      />
    ),
    [activeSubTab, datasetKey, datasetTitle]
  );

  const isProfileTab = activeSubTab === PROFILE_TAB;

  // Compare up to 3 results (shared with Saved / Compare Universities).
  const compare = useCompareList();
  const [compareOpen, setCompareOpen] = useState(false);
  const comparePool = useMemo(() => [...profileResults, ...customResults], [profileResults, customResults]);
  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={authTheme.colors.brandTeal}
      />

      <SmartMatchTopBar onBackPress={handleBackPress} />

      <View style={styles.container}>
        <View style={styles.panelContent}>
          {isProfileTab ? (
            <ProfileMatchPanel
              headerComponent={headerComponent}
              datasetKey={datasetKey}
              universities={profileResults}
              loading={profileLoading}
              smartNotice={profileNotice}
              fetchSmartMatch={fetchSmartMatch}
            />
          ) : (
            <CustomExplorePanel
              headerComponent={headerComponent}
              datasetKey={datasetKey}
              universities={customResults}
              loading={customLoading}
              customNotice={customNotice}
              fetchCustomExplore={fetchCustomExplore}
            />
          )}
        </View>
      </View>

      <CompareBar
        compareList={compare.items}
        onOpenCompare={() => setCompareOpen(true)}
        onClearCompare={compare.clear}
      />
      <CompareModal
        visible={compareOpen}
        compareList={compare.items}
        allUniversities={comparePool}
        onClose={() => setCompareOpen(false)}
        onAddUniversity={compare.add}
        onRemove={compare.remove}
        onGoToRankings={() => setCompareOpen(false)}
      />
    </View>
  );
}