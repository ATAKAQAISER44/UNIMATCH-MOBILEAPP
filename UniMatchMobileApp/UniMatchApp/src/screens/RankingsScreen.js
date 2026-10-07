

// src/screens/RankingsScreen.js

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bottomPadding } from '../utils/safeArea';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { apiGet, apiPost, getApiErrorMessage, HEAVY_TIMEOUT_MS } from '../services/api';
import { supabase } from '../services/supabase';
import { getSignedInUser } from '../services/session';
import { normalizeIntendedLevel } from '../utils/profileSetupUtils';

import CompareBar from '../components/CompareBar';
import CompareModal from '../components/CompareModal';
import { useCompareList } from '../services/compareList';
import { useSavedUniversities } from '../services/savedUniversities';

import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import DashboardHeaderMenu from '../components/dashboard/DashboardHeaderMenu';

import RankingsHero from '../components/rankings/RankingsHero';
import RankingTabs from '../components/rankings/RankingTabs';
import RankingStats from '../components/rankings/RankingStats';
import RankingFilterCard from '../components/rankings/RankingFilterCard';
import RankingTableHeader from '../components/rankings/RankingTableHeader';
import UniversityTableRow from '../components/rankings/UniversityTableRow';
import OptionModal from '../components/rankings/OptionModal';
import PaginationControls from '../components/rankings/PaginationControls';
import { useOpenUniversity } from '../components/UniversityLink';

import MyRankingScreen from '../components/rankings/my-ranking/MyRankingScreen';

import {
  ChoiceModal,
  InfoHelpModal,
  SaveRankingNameModal,
  SavedRankingsModal,
} from '../components/rankings/my-ranking/MyRankingModals';

import { rankingsStyles as styles } from '../styles/rankingsStyles';
import { authTheme } from '../styles/authTheme';

import {
  ALL_COUNTRIES,
  DATASET_CONFIG,
  DATASET_INFO,
  ROW_OPTIONS,
} from '../constants/rankingsConstants';

import {
  dedupeUniversities,
  escapeCsv,
  getCountry,
  getOfficialRank,
  getPersonalizedRank,
  getUniName,
  getUniversityKey,
  normalizeResults,
} from '../utils/rankingsUtils';

import {
  ATTRIBUTE_CONFIG,
  DATASET_METRICS,
  DEFAULT_VISIBLE_ATTRIBUTE_KEYS,
  DEFAULT_VISIBLE_RANKING_COUNT,
  INFO_CONTENT,
  MY_RANKING_STORAGE_KEY,
  MY_PAGE_SIZE,
  TOP_N,
} from '../constants/myRankingConstants';

import {
  buildResultsPreview,
  clampNumber,
  createDefaultRankingWeights,
  formatScore,
} from '../utils/myRankingUtils';

export default function RankingsScreen({ route = {}, navigation }) {
  const insets = useSafeAreaInsets();
  const { dataset = 'qs', searchText, openTab, searchNonce } = route?.params || {};

  const datasetKey = String(dataset || 'qs').toLowerCase();
  const config = DATASET_CONFIG[datasetKey] || DATASET_CONFIG.qs;
  const datasetInfo = DATASET_INFO[datasetKey] || DATASET_INFO.qs;
  const metricConfig = DATASET_METRICS[datasetKey] || DATASET_METRICS.qs;

  const [activeTab, setActiveTab] = useState('official');
  const [summary, setSummary] = useState(null);
  const [countries, setCountries] = useState([ALL_COUNTRIES]);

  const [officialResults, setOfficialResults] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const savedStore = useSavedUniversities();
  const savedList = savedStore.items;
  const { reload: reloadSaved, toggle: toggleSaved } = savedStore;
  // Shared with Saved / Compare Universities and Smart Match.
  const compare = useCompareList();
  const compareList = compare.items;
  const [search, setSearch] = useState(searchText || '');

  // Opened from "Search Universities" with text: show it in the official list.
  useEffect(() => {
    if (searchText === undefined) return;
    setActiveTab(openTab || 'official');
    setSearch(searchText || '');
    // searchNonce marks a new search request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, openTab, searchNonce]);
  const [countryFilter, setCountryFilter] = useState(ALL_COUNTRIES);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [countryModal, setCountryModal] = useState(false);
  const [rowsModal, setRowsModal] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const [rankingImportance, setRankingImportance] = useState(50);
  const [importanceSelected, setImportanceSelected] = useState(false);

  const [rankingWeights, setRankingWeights] = useState(() =>
    createDefaultRankingWeights(metricConfig)
  );

  const [attributeWeights, setAttributeWeights] = useState({});

  const [visibleRankingKeys, setVisibleRankingKeys] = useState(() =>
    metricConfig.slice(0, DEFAULT_VISIBLE_RANKING_COUNT).map((item) => item.key)
  );

  const [visibleAttributeKeys, setVisibleAttributeKeys] = useState(
    DEFAULT_VISIBLE_ATTRIBUTE_KEYS
  );

  const [selectedRankingToAdd, setSelectedRankingToAdd] = useState('');
  const [selectedAttributeToAdd, setSelectedAttributeToAdd] = useState('');

  const [myRankingLoading, setMyRankingLoading] = useState(false);
  const [myRankingError, setMyRankingError] = useState('');
  const [myPage, setMyPage] = useState(1);
  const [openBreakdownKey, setOpenBreakdownKey] = useState(null);

  const [rankingWeightsOpen, setRankingWeightsOpen] = useState(false);
  const [attributeWeightsOpen, setAttributeWeightsOpen] = useState(false);

  const [savedRankingMessage, setSavedRankingMessage] = useState('');
  const [savedRankings, setSavedRankings] = useState([]);
  const [savedRankingsModal, setSavedRankingsModal] = useState(false);
  const [saveNameModal, setSaveNameModal] = useState(false);
  const [rankingNameInput, setRankingNameInput] = useState('');
  const [choiceModal, setChoiceModal] = useState(null);
  const [infoModal, setInfoModal] = useState(null);
  const [rankingError, setRankingError] = useState('');
  const [recomputeToken, setRecomputeToken] = useState(0);
  const rankingRequestIdRef = useRef(0);

  const currentResults = useMemo(() => {
    if (activeTab === 'official') return officialResults;
    if (activeTab === 'my') return myResults;
    return savedList;
  }, [activeTab, officialResults, myResults, savedList]);

  const allUniversities = useMemo(
    () =>
      dedupeUniversities([
        ...officialResults,
        ...myResults,
        ...savedList,
        ...compareList,
      ]),
    [officialResults, myResults, savedList, compareList]
  );

  const summaryCards = useMemo(
    () => [
      {
        label: 'Universities',
        value:
          summary?.total_universities ||
          summary?.total_count ||
          totalResults ||
          '—',
        icon: 'school-outline',
      },
      {
        label: 'Countries',
        value: summary?.total_countries || countries.length - 1 || '—',
        icon: 'earth-outline',
      },
      {
        label: 'Indicators',
        value:
          summary?.total_parameters ||
          summary?.total_indicators ||
          summary?.indicators ||
          summary?.metrics_count ||
          config.indicators ||
          '—',
        icon: 'stats-chart-outline',
      },
      {
        label: 'Published',
        value: summary?.published || summary?.published_at || config.published,
        icon: 'calendar-outline',
      },
    ],
    [
      summary,
      countries.length,
      totalResults,
      config.indicators,
      config.published,
    ]
  );

  const tableTitle = useMemo(() => {
    if (activeTab === 'official') {
      return `${config.label} Official Ranking Table`;
    }

    if (activeTab === 'my') {
      return `${config.label} My Ranking`;
    }

    return 'Saved Universities';
  }, [activeTab, config.label]);

  const visibleTotalResults =
    activeTab === 'saved' ? savedList.length : totalResults;

  const visibleTotalPages =
    activeTab === 'saved'
      ? Math.max(1, Math.ceil(savedList.length / rowsPerPage))
      : totalPages;

  const rankingImportanceNumber = Number.isFinite(Number(rankingImportance))
    ? Number(rankingImportance)
    : 0;

  const attributeImportance = 100 - rankingImportanceNumber;

  const showRankingSection = importanceSelected && rankingImportanceNumber > 0;
  const showAttributeSection =
    importanceSelected && rankingImportanceNumber < 100;

  const isRankingOnly = importanceSelected && rankingImportanceNumber === 100;
  const isAttributeOnly = importanceSelected && rankingImportanceNumber === 0;

  const isMixed =
    importanceSelected &&
    rankingImportanceNumber > 0 &&
    rankingImportanceNumber < 100;

  const visibleRankingItems = useMemo(
    () => metricConfig.filter((item) => visibleRankingKeys.includes(item.key)),
    [metricConfig, visibleRankingKeys]
  );

  const availableRankingItems = useMemo(
    () => metricConfig.filter((item) => !visibleRankingKeys.includes(item.key)),
    [metricConfig, visibleRankingKeys]
  );

  const visibleAttributeItems = useMemo(
    () =>
      ATTRIBUTE_CONFIG.filter((item) => visibleAttributeKeys.includes(item.key)),
    [visibleAttributeKeys]
  );

  const availableAttributeItems = useMemo(
    () =>
      ATTRIBUTE_CONFIG.filter(
        (item) => !visibleAttributeKeys.includes(item.key)
      ),
    [visibleAttributeKeys]
  );

  const myTotalPages = Math.max(
    Math.ceil((myResults?.length || 0) / MY_PAGE_SIZE),
    1
  );

  const paginatedMyResults = useMemo(() => {
    const start = (myPage - 1) * MY_PAGE_SIZE;
    return (myResults || []).slice(start, start + MY_PAGE_SIZE);
  }, [myResults, myPage]);

  const buildParams = useCallback(
    (targetPage = 1) => {
      const params = new URLSearchParams({
        page: String(targetPage),
        page_size: String(rowsPerPage),
      });

      const trimmedSearch = search.trim();

      if (trimmedSearch) {
        params.append('search', trimmedSearch);
      }

      if (countryFilter !== ALL_COUNTRIES) {
        params.append('country', countryFilter);
      }

      return params.toString();
    },
    [countryFilter, rowsPerPage, search]
  );

  const fetchSummary = useCallback(async () => {
    try {
      const { ok, data } = await apiGet(`/rankings/${datasetKey}/summary`);

      if (!ok) {
        throw new Error('Summary request failed.');
      }

      setSummary(data || null);
    } catch (error) {
      console.log('Summary fetch error:', error?.message || error);
      setSummary(null);
    }
  }, [datasetKey]);

  const fetchCountries = useCallback(async () => {
    try {
      const { ok, data } = await apiGet(`/rankings/${datasetKey}/countries`);

      if (!ok) {
        throw new Error('Countries request failed.');
      }

      setCountries([ALL_COUNTRIES, ...(data?.countries || [])]);
    } catch (error) {
      console.log('Countries fetch error:', error?.message || error);
      setCountries([ALL_COUNTRIES]);
    }
  }, [datasetKey]);

  const fetchTabData = useCallback(
    async (tab = activeTab, targetPage = 1) => {
      if (tab === 'saved' || tab === 'my') return;

      // PERF/correctness: when the user types quickly, several requests can
      // be in flight. Only the newest one is allowed to update the screen.
      const requestId = ++rankingRequestIdRef.current;

      setTabLoading(true);
      setRankingError('');

      try {
        const params = buildParams(targetPage);
        const { ok, data } = await apiGet(`/rankings/${datasetKey}?${params}`);

        if (requestId !== rankingRequestIdRef.current) return;

        if (!ok) {
          throw new Error(getApiErrorMessage(data, 'Rankings could not be loaded.'));
        }

        const results = data?.results || data?.universities || data?.data || [];
        const normalizedResults = normalizeResults(results);
        const total =
          data?.total_count || data?.total || normalizedResults.length;

        setOfficialResults(normalizedResults);
        setTotalPages(
          data?.total_pages || Math.max(1, Math.ceil(total / rowsPerPage))
        );
        setTotalResults(total);
        setPage(targetPage);
      } catch (error) {
        if (requestId !== rankingRequestIdRef.current) return;

        console.log('Ranking fetch error:', error?.message || error);
        setRankingError(
          getApiErrorMessage(error, 'Rankings could not be loaded. Please try again.')
        );
        setOfficialResults([]);
        setTotalPages(1);
        setTotalResults(0);
        setPage(1);
      } finally {
        if (requestId === rankingRequestIdRef.current) {
          setTabLoading(false);
        }
      }
    },
    [activeTab, buildParams, datasetKey, rowsPerPage]
  );

  // Saved universities are shared with every student screen
  // (services/savedUniversities.js); this reloads them on demand.
  const loadSavedUniversities = useCallback(async () => {
    reloadSaved();
  }, [reloadSaved]);
  const loadSavedRankings = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(MY_RANKING_STORAGE_KEY);
      const parsed = JSON.parse(raw || '[]');
      const allItems = Array.isArray(parsed) ? parsed : [];

      setSavedRankings(
        allItems.filter((item) => {
          const savedDataset = String(
            item?.datasetKey || item?.dataset || ''
          ).toLowerCase();

          return savedDataset === datasetKey;
        })
      );
    } catch {
      setSavedRankings([]);
    }
  }, [datasetKey]);

  // PERF: keep a reference to the latest fetchTabData so loadInitial does
  // not depend on it. Before, loadInitial changed whenever the search text,
  // country filter, rows-per-page or tab changed, so the WHOLE screen
  // (full-screen loader + summary + countries + list) reloaded on every
  // keystroke and every tab switch.
  const fetchTabDataRef = useRef(fetchTabData);
  fetchTabDataRef.current = fetchTabData;

  // The first official-list load is done by loadInitial; this flag stops the
  // debounced effect below from sending the same request a second time.
  const skipNextDebouncedFetchRef = useRef(true);

  const loadInitial = useCallback(async () => {
    setLoading(true);

    try {
      // PERF: all five loads are independent, so run them in parallel
      // (the ranking list used to wait for summary + countries first).
      await Promise.all([
        fetchSummary(),
        fetchCountries(),
        loadSavedUniversities(),
        loadSavedRankings(),
        fetchTabDataRef.current('official', 1),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchCountries, fetchSummary, loadSavedRankings, loadSavedUniversities]);

  useEffect(() => {
    skipNextDebouncedFetchRef.current = true;
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (activeTab !== 'official') return undefined;

    if (skipNextDebouncedFetchRef.current) {
      skipNextDebouncedFetchRef.current = false;
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchTabData(activeTab, 1);
    }, 350);

    return () => clearTimeout(timer);
  }, [activeTab, countryFilter, fetchTabData, rowsPerPage, search]);

  useEffect(() => {
    setRankingImportance(50);
    setImportanceSelected(false);
    setRankingWeights(createDefaultRankingWeights(metricConfig));
    setAttributeWeights({});
    setVisibleRankingKeys(
      metricConfig
        .slice(0, DEFAULT_VISIBLE_RANKING_COUNT)
        .map((item) => item.key)
    );
    setVisibleAttributeKeys(DEFAULT_VISIBLE_ATTRIBUTE_KEYS);
    setSelectedRankingToAdd('');
    setSelectedAttributeToAdd('');
    setMyResults([]);
    setMyRankingError('');
    setMyPage(1);
    setOpenBreakdownKey(null);
    setRankingWeightsOpen(false);
    setAttributeWeightsOpen(false);
  }, [datasetKey, metricConfig]);

  const closeMenu = useCallback(() => setMenuVisible(false), []);
  const openMenu = useCallback(() => setMenuVisible(true), []);

  const closeCountryModal = useCallback(() => setCountryModal(false), []);
  const openCountryModal = useCallback(() => setCountryModal(true), []);

  const closeRowsModal = useCallback(() => setRowsModal(false), []);
  const openRowsModal = useCallback(() => setRowsModal(true), []);

  // Tapping a university opens its introduction page.
  const openUniversity = useOpenUniversity();
  const handleOpenUniversity = useCallback(
    (item) => {
      openUniversity({
        name: getUniName(item),
        country: getCountry(item),
        dataset: datasetKey,
        rank: activeTab === 'my' ? getPersonalizedRank(item, 0) : getOfficialRank(item),
      });
    },
    [activeTab, datasetKey, openUniversity]
  );
  const openCompareModal = useCallback(() => setCompareModalVisible(true), []);
  const closeCompareModal = useCallback(() => setCompareModalVisible(false), []);
  const clearCompareList = compare.clear;

  const openInfo = useCallback((type) => {
    setInfoModal(INFO_CONTENT[type] || null);
  }, []);

  const closeInfo = useCallback(() => {
    setInfoModal(null);
  }, []);

  const handleGoDashboard = useCallback(() => {
    closeMenu();
    navigation.navigate('Dashboard', undefined, { pop: true });
  }, [closeMenu, navigation]);

  const handleProfilePress = useCallback(() => {
    closeMenu();

    navigation.navigate('ProfileView', {
      mode: 'edit',
    }, { pop: true });
  }, [closeMenu, navigation]);

  const handleLogout = useCallback(async () => {
    closeMenu();
    await supabase.auth.signOut();
    navigation.replace('Login');
  }, [closeMenu, navigation]);

  const handleOpenSmartMatch = useCallback(() => {
    navigation.navigate('SmartMatch', {
      dataset: datasetKey,
      datasetKey,
      title: datasetInfo.title,
    }, { pop: true });
  }, [datasetKey, datasetInfo.title, navigation]);

  // PERF: Set lookups instead of scanning the compare/saved lists for every
  // row on every render (50-100 rows x list length).
  const isCompared = compare.isCompared;
  const isSaved = savedStore.isSaved;
  const handleAddToCompare = compare.add;
  const handleRemoveFromCompare = compare.remove;
  const handleToggleCompare = compare.toggle;

  const handleToggleSave = useCallback(
    (university) => {
      toggleSaved(university, datasetKey);
    },
    [toggleSaved, datasetKey]
  );

  const flattenExportRows = useCallback(
    (rows) =>
      (rows || []).map((item) => ({
        ...item,
        ...(item.raw || {}),
      })),
    []
  );

  const shareCsvFile = useCallback(async (rowsToExport, fileName) => {
    const keys = Array.from(
      new Set(rowsToExport.flatMap((row) => Object.keys(row || {})))
    ).filter((key) => key !== 'raw');

    const header = keys.map(escapeCsv).join(',');
    const csvRows = rowsToExport.map((item) =>
      keys.map((key) => escapeCsv(item[key])).join(',')
    );

    const csv = [header, ...csvRows].join('\n');
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csv);

    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export CSV',
      });
    } else {
      Alert.alert('CSV saved', fileUri);
    }
  }, []);

  const exportCurrentPageCsv = useCallback(async () => {
    try {
      const rowsToExport = flattenExportRows(currentResults);

      if (!rowsToExport.length) {
        Alert.alert('No data', 'There is no visible data to export.');
        return;
      }

      setExporting(true);
      await shareCsvFile(rowsToExport, `${datasetKey}_${activeTab}_page_${page}.csv`);
    } catch (error) {
      Alert.alert('Export failed', error.message || 'Could not export CSV.');
    } finally {
      setExporting(false);
    }
  }, [activeTab, currentResults, datasetKey, flattenExportRows, page, shareCsvFile]);

  // Every row that matches the current search and country (web
  // RankingPage exportCompleteCSV -> GET /rankings/{dataset}/export).
  const exportAllFilteredCsv = useCallback(async () => {
    try {
      setExporting(true);

      const params = new URLSearchParams();
      const trimmedSearch = search.trim();

      if (countryFilter !== ALL_COUNTRIES) params.append('country', countryFilter);
      if (trimmedSearch) params.append('search', trimmedSearch);

      const query = params.toString();
      const { ok, data } = await apiGet(
        `/rankings/${datasetKey}/export${query ? `?${query}` : ''}`,
        { timeoutMs: HEAVY_TIMEOUT_MS }
      );

      if (!ok) {
        throw new Error(getApiErrorMessage(data, 'Could not export CSV.'));
      }

      const rowsToExport = flattenExportRows(normalizeResults(data?.results || []));

      if (!rowsToExport.length) {
        Alert.alert('No data', 'No universities match these filters.');
        return;
      }

      await shareCsvFile(rowsToExport, `${datasetKey}_all_filtered.csv`);
    } catch (error) {
      Alert.alert('Export failed', getApiErrorMessage(error, 'Could not export CSV.'));
    } finally {
      setExporting(false);
    }
  }, [countryFilter, datasetKey, flattenExportRows, search, shareCsvFile]);

  const exportCsv = useCallback(() => {
    Alert.alert('Export CSV', 'What should be exported?', [
      { text: 'Current page', onPress: exportCurrentPageCsv },
      { text: 'All (filtered)', onPress: exportAllFilteredCsv },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [exportAllFilteredCsv, exportCurrentPageCsv]);

  const exportMyRankingCsv = useCallback(
    async (rows, fileNamePrefix) => {
      try {
        if (!rows?.length) {
          Alert.alert('No data', 'Please compute My Ranking before exporting.');
          return;
        }

        setExporting(true);

        const headers = [
          'My Rank',
          'Official Rank',
          'University',
          'Country',
          'Final Score',
          'Ranking Score',
          'Attribute Score',
          'Top Explanation',
        ];

        const csvRows = rows.map((uni) =>
          [
            uni?.my_rank || uni?.current_rank || '',
            uni?.official_rank || '',
            uni?.name || uni?.university_name || '',
            uni?.country || '',
            formatScore(uni?.final_score),
            formatScore(uni?.ranking_score),
            formatScore(uni?.attribute_score),
            Array.isArray(uni?.explanation)
              ? uni.explanation.join(' | ')
              : '',
          ]
            .map(escapeCsv)
            .join(',')
        );

        const csv = [headers.map(escapeCsv).join(','), ...csvRows].join('\n');

        const fileName = `${fileNamePrefix}-${datasetKey}-${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;

        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, csv);

        const isAvailable = await Sharing.isAvailableAsync();

        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export My Ranking CSV',
          });
        } else {
          Alert.alert('CSV saved', fileUri);
        }
      } catch (error) {
        Alert.alert(
          'Export failed',
          error.message || 'Could not export My Ranking CSV.'
        );
      } finally {
        setExporting(false);
      }
    },
    [datasetKey]
  );

  const loadCurrentProfile = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await getSignedInUser();

    if (userError || !user) {
      navigation.replace('Login');
      return null;
    }

    // PERF: the four profile queries are independent - run them together
    // instead of one after another.
    const [
      { data: academic },
      { data: geographic },
      { data: financial },
      { data: tests },
      { data: account },
    ] = await Promise.all([
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
      supabase.from('user_test_scores').select('*').eq('user_id', user.id),
      // Home country: the backend uses the local fee when it matches.
      supabase.from('profiles').select('country').eq('id', user.id).maybeSingle(),
    ]);

    return {
      user: { country: account?.country || '' },
      academic: academic
        ? { ...academic, intended_education_level: normalizeIntendedLevel(academic.intended_education_level) }
        : {},
      geographic: geographic || {},
      financial: financial || {},
      tests: tests || [],
    };
  }, [navigation]);

  const updateRankingWeight = useCallback((key, value) => {
    setRankingWeights((previous) => ({
      ...previous,
      [key]: clampNumber(value, 0, 100),
    }));
  }, []);

  const updateAttributeWeight = useCallback((key, value) => {
    setAttributeWeights((previous) => ({
      ...previous,
      [key]: clampNumber(value, 0, 100),
    }));
  }, []);

  const getActiveRankingWeights = useCallback(() => {
    const active = {};

    visibleRankingKeys.forEach((key) => {
      active[key] = Number(rankingWeights?.[key] || 0);
    });

    return active;
  }, [rankingWeights, visibleRankingKeys]);

  const getActiveAttributeWeights = useCallback(() => {
    const active = {};

    visibleAttributeKeys.forEach((key) => {
      active[key] = Number(attributeWeights?.[key] || 0);
    });

    return active;
  }, [attributeWeights, visibleAttributeKeys]);

  const fetchMyRanking = useCallback(async () => {
    if (!importanceSelected) {
      Alert.alert(
        'Choose importance',
        'Please choose overall importance before computing My Ranking.'
      );
      return;
    }

    if (rankingImportanceNumber > 0 && visibleRankingKeys.length === 0) {
      setMyRankingError(
        'Please add at least one ranking metric before computing My Ranking.'
      );

      Alert.alert(
        'Ranking metric required',
        'Please add at least one ranking metric before computing My Ranking.'
      );

      setRankingWeightsOpen(true);
      return;
    }

    if (rankingImportanceNumber < 100 && visibleAttributeKeys.length === 0) {
      setMyRankingError(
        'Please add at least one university attribute before computing My Ranking.'
      );

      Alert.alert(
        'University attribute required',
        'Please add at least one university attribute before computing My Ranking.'
      );

      setAttributeWeightsOpen(true);
      return;
    }

    try {
      setMyRankingLoading(true);
      setMyRankingError('');
      setMyPage(1);
      setOpenBreakdownKey(null);

      const profile = await loadCurrentProfile();

      if (!profile) return;

      const { ok, data } = await apiPost(
        `/rankings/${datasetKey}/my-ranking`,
        {
          profile,
          ranking_importance: rankingImportanceNumber,
          ranking_weights: getActiveRankingWeights(),
          attribute_weights: getActiveAttributeWeights(),
          top_n: TOP_N,
        },
        { timeoutMs: HEAVY_TIMEOUT_MS }
      );

      if (!ok) {
        setMyRankingError(
          getApiErrorMessage(data, 'My Ranking could not be calculated. Please try again.')
        );
        setMyResults([]);
        return;
      }

      setMyResults(data?.results || []);
    } catch (error) {
      console.log('My Ranking error:', error?.message || error);
      setMyRankingError(
        getApiErrorMessage(error, 'My Ranking could not be calculated. Please try again.')
      );
      setMyResults([]);
    } finally {
      setMyRankingLoading(false);
    }
  }, [
    datasetKey,
    getActiveAttributeWeights,
    getActiveRankingWeights,
    importanceSelected,
    loadCurrentProfile,
    rankingImportanceNumber,
    visibleAttributeKeys.length,
    visibleRankingKeys.length,
  ]);

  const handleImportanceChange = useCallback((value) => {
    setRankingImportance(clampNumber(value, 0, 100));
    setImportanceSelected(true);
    setMyPage(1);
    setOpenBreakdownKey(null);
  }, []);

  const handleAddRankingMetric = useCallback(() => {
    if (!selectedRankingToAdd) return;

    setVisibleRankingKeys((previous) =>
      previous.includes(selectedRankingToAdd)
        ? previous
        : [...previous, selectedRankingToAdd]
    );

    const selectedMetric = metricConfig.find(
      (item) => item.key === selectedRankingToAdd
    );

    const officialDefaultWeight =
      Number(String(selectedMetric?.weight || '0').replace('%', '')) || 0;

    if (Number(rankingWeights?.[selectedRankingToAdd] || 0) === 0) {
      updateRankingWeight(selectedRankingToAdd, officialDefaultWeight);
    }

    setRankingWeightsOpen(true);
    setMyRankingError('');
    setSelectedRankingToAdd('');
  }, [
    metricConfig,
    rankingWeights,
    selectedRankingToAdd,
    updateRankingWeight,
  ]);

  const handleRemoveRankingMetric = useCallback(
    (key) => {
      setVisibleRankingKeys((previous) =>
        previous.filter((item) => item !== key)
      );

      updateRankingWeight(key, 0);
    },
    [updateRankingWeight]
  );

  const handleAddAttribute = useCallback(() => {
    if (!selectedAttributeToAdd) return;

    setVisibleAttributeKeys((previous) =>
      previous.includes(selectedAttributeToAdd)
        ? previous
        : [...previous, selectedAttributeToAdd]
    );

    if (attributeWeights?.[selectedAttributeToAdd] === undefined) {
      updateAttributeWeight(selectedAttributeToAdd, 0);
    }

    setAttributeWeightsOpen(true);
    setMyRankingError('');
    setSelectedAttributeToAdd('');
  }, [attributeWeights, selectedAttributeToAdd, updateAttributeWeight]);

  const handleRemoveAttribute = useCallback(
    (key) => {
      setVisibleAttributeKeys((previous) =>
        previous.filter((item) => item !== key)
      );

      updateAttributeWeight(key, 0);
    },
    [updateAttributeWeight]
  );

  const resetMyRanking = useCallback(() => {
    setRankingImportance(50);
    setImportanceSelected(false);
    setRankingWeights(createDefaultRankingWeights(metricConfig));
    setAttributeWeights({});
    setVisibleRankingKeys(
      metricConfig
        .slice(0, DEFAULT_VISIBLE_RANKING_COUNT)
        .map((item) => item.key)
    );
    setVisibleAttributeKeys(DEFAULT_VISIBLE_ATTRIBUTE_KEYS);
    setSelectedRankingToAdd('');
    setSelectedAttributeToAdd('');
    setMyResults([]);
    setMyRankingError('');
    setMyPage(1);
    setOpenBreakdownKey(null);
    setRankingWeightsOpen(false);
    setAttributeWeightsOpen(false);
  }, [metricConfig]);

  const openSaveRankingModal = useCallback(() => {
    if (!importanceSelected) {
      Alert.alert('Choose importance', 'Please choose overall importance first.');
      return;
    }

    if (!myResults.length) {
      Alert.alert('No results', 'Please compute your ranking before saving.');
      return;
    }

    setRankingNameInput(
      `${datasetKey.toUpperCase()} My Ranking - ${new Date().toLocaleDateString()}`
    );
    setSaveNameModal(true);
  }, [datasetKey, importanceSelected, myResults.length]);

  const saveMyRanking = useCallback(async () => {
    const cleanName = String(rankingNameInput || '').trim();

    if (!cleanName) {
      Alert.alert('Name required', 'Please enter a name for this ranking.');
      return;
    }

    try {
      const raw = await AsyncStorage.getItem(MY_RANKING_STORAGE_KEY);
      const previous = JSON.parse(raw || '[]');
      const previousItems = Array.isArray(previous) ? previous : [];

      const savedItem = {
        id: Date.now(),
        rankingName: cleanName,
        datasetKey,
        dataset: datasetKey,
        savedAt: new Date().toISOString(),
        rankingImportance: rankingImportanceNumber,
        attributeImportance,
        visibleRankingKeys: [...visibleRankingKeys],
        visibleAttributeKeys: [...visibleAttributeKeys],
        rankingWeights: getActiveRankingWeights(),
        attributeWeights: getActiveAttributeWeights(),
        totalResults: myResults.length,
        resultsPreview: buildResultsPreview(myResults),
      };

      const updated = [savedItem, ...previousItems].slice(0, 60);

      await AsyncStorage.setItem(
        MY_RANKING_STORAGE_KEY,
        JSON.stringify(updated)
      );

      setSaveNameModal(false);
      setSavedRankingMessage('My Ranking saved successfully.');
      await loadSavedRankings();
      setSavedRankingsModal(true);

      setTimeout(() => setSavedRankingMessage(''), 3000);
    } catch {
      Alert.alert(
        'Save failed',
        'My Ranking could not be saved. Please try again.'
      );
    }
  }, [
    attributeImportance,
    datasetKey,
    getActiveAttributeWeights,
    getActiveRankingWeights,
    loadSavedRankings,
    myResults,
    rankingImportanceNumber,
    rankingNameInput,
    visibleAttributeKeys,
    visibleRankingKeys,
  ]);

  const applySavedRanking = useCallback(
    async (savedItem) => {
      if (!savedItem) return;

      const savedDataset = String(
        savedItem?.datasetKey || savedItem?.dataset || ''
      ).toLowerCase();

      if (savedDataset && savedDataset !== datasetKey) {
        Alert.alert(
          'Different ranking system',
          `This saved ranking was made for ${savedDataset.toUpperCase()}. Open the ${savedDataset.toUpperCase()} rankings to use it.`
        );
        return;
      }

      setImportanceSelected(true);
      setRankingImportance(Number(savedItem.rankingImportance || 0));
      setVisibleRankingKeys(savedItem.visibleRankingKeys || []);
      setVisibleAttributeKeys(savedItem.visibleAttributeKeys || []);
      setRankingWeights(savedItem.rankingWeights || {});
      setAttributeWeights(savedItem.attributeWeights || {});
      setMyPage(1);
      setOpenBreakdownKey(null);
      setSavedRankingsModal(false);
      setRankingWeightsOpen((savedItem.visibleRankingKeys || []).length > 0);
      setAttributeWeightsOpen(
        (savedItem.visibleAttributeKeys || []).length > 0
      );
      setSavedRankingMessage('Saved settings loaded.');
      // Recompute once the loaded settings are in state.
      setRecomputeToken((token) => token + 1);

      setTimeout(() => setSavedRankingMessage(''), 4000);
    },
    [datasetKey]
  );

  const fetchMyRankingRef = useRef(fetchMyRanking);
  fetchMyRankingRef.current = fetchMyRanking;

  useEffect(() => {
    if (recomputeToken > 0) fetchMyRankingRef.current();
  }, [recomputeToken]);

  const deleteSavedRanking = useCallback(
    async (id) => {
      try {
        const raw = await AsyncStorage.getItem(MY_RANKING_STORAGE_KEY);
        const previous = JSON.parse(raw || '[]');
        const previousItems = Array.isArray(previous) ? previous : [];
        const updated = previousItems.filter((item) => item.id !== id);

        await AsyncStorage.setItem(
          MY_RANKING_STORAGE_KEY,
          JSON.stringify(updated)
        );

        setSavedRankingMessage('Saved ranking deleted.');
        await loadSavedRankings();

        setTimeout(() => setSavedRankingMessage(''), 3000);
      } catch {
        Alert.alert('Delete failed', 'Could not delete saved ranking.');
      }
    },
    [loadSavedRankings]
  );

  const handleTabPress = useCallback(
    (tabKey) => {
      if (tabKey === 'smart') {
        handleOpenSmartMatch();
        return;
      }

      setActiveTab(tabKey);
      setPage(1);

      if (tabKey === 'saved') {
        setSearch('');
        setCountryFilter(ALL_COUNTRIES);
      }

      if (tabKey === 'my') {
        loadSavedRankings();
      }
    },
    [handleOpenSmartMatch, loadSavedRankings]
  );

  const handleCountrySelect = useCallback(
    (value) => {
      setCountryFilter(value);
      closeCountryModal();
      setPage(1);
    },
    [closeCountryModal]
  );

  const handleRowsSelect = useCallback(
    (value) => {
      setRowsPerPage(Number(value));
      closeRowsModal();
      setPage(1);
    },
    [closeRowsModal]
  );

  const renderUniversityRow = useCallback(
    ({ item, index }) => (
      <UniversityTableRow
        item={item}
        index={index}
        activeTab={activeTab}
        compared={isCompared(item)}
        saved={isSaved(item)}
        // PERF: stable handlers (the row passes `item` back), so memoized
        // rows whose state did not change are skipped on re-render.
        onDetails={handleOpenUniversity}
        onCompare={handleToggleCompare}
        onSave={handleToggleSave}
      />
    ),
    [activeTab, handleToggleCompare, handleToggleSave, isCompared, isSaved]
  );

  const rowOptionLabels = useMemo(() => ROW_OPTIONS.map(String), []);

  const handleChoiceSelect = useCallback(
    (key) => {
      choiceModal?.onSelect?.(key);
      setChoiceModal(null);
    },
    [choiceModal]
  );

  const closeChoiceModal = useCallback(() => setChoiceModal(null), []);
  const closeSaveNameModal = useCallback(() => setSaveNameModal(false), []);
  const closeSavedRankingsModal = useCallback(
    () => setSavedRankingsModal(false),
    []
  );



  const keyExtractor = useCallback(
    (item, index) => `${getUniversityKey(item)}-${index}`,
    []
  );

  if (loading) {
    return (
      <View style={styles.fullLoading}>
        <ActivityIndicator size="large" color={authTheme.colors.brandTeal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardTopBar onMenuPress={openMenu} />

      <DashboardHeaderMenu
        visible={menuVisible}
        onClose={closeMenu}
        onDashboard={handleGoDashboard}
        onProfile={handleProfilePress}
        onLogout={handleLogout}
      />

      {activeTab === 'my' ? (
        <MyRankingScreen
          config={config}
          activeTab={activeTab}
          handleTabPress={handleTabPress}
          summaryCards={summaryCards}
          compareList={compareList}
          importanceSelected={importanceSelected}
          rankingImportanceNumber={rankingImportanceNumber}
          attributeImportance={attributeImportance}
          handleImportanceChange={handleImportanceChange}
          isRankingOnly={isRankingOnly}
          isAttributeOnly={isAttributeOnly}
          isMixed={isMixed}
          showRankingSection={showRankingSection}
          showAttributeSection={showAttributeSection}
          visibleRankingItems={visibleRankingItems}
          availableRankingItems={availableRankingItems}
          visibleAttributeItems={visibleAttributeItems}
          availableAttributeItems={availableAttributeItems}
          rankingWeights={rankingWeights}
          attributeWeights={attributeWeights}
          rankingWeightsOpen={rankingWeightsOpen}
          attributeWeightsOpen={attributeWeightsOpen}
          setRankingWeightsOpen={setRankingWeightsOpen}
          setAttributeWeightsOpen={setAttributeWeightsOpen}
          selectedRankingToAdd={selectedRankingToAdd}
          selectedAttributeToAdd={selectedAttributeToAdd}
          setChoiceModal={setChoiceModal}
          setSelectedRankingToAdd={setSelectedRankingToAdd}
          setSelectedAttributeToAdd={setSelectedAttributeToAdd}
          updateRankingWeight={updateRankingWeight}
          updateAttributeWeight={updateAttributeWeight}
          handleAddRankingMetric={handleAddRankingMetric}
          handleRemoveRankingMetric={handleRemoveRankingMetric}
          handleAddAttribute={handleAddAttribute}
          handleRemoveAttribute={handleRemoveAttribute}
          openInfo={openInfo}
          fetchMyRanking={fetchMyRanking}
          resetMyRanking={resetMyRanking}
          openSaveRankingModal={openSaveRankingModal}
          loadSavedRankings={loadSavedRankings}
          setSavedRankingsModal={setSavedRankingsModal}
          exportMyRankingCsv={exportMyRankingCsv}
          myRankingLoading={myRankingLoading}
          myRankingError={myRankingError}
          myResults={myResults}
          paginatedMyResults={paginatedMyResults}
          savedRankings={savedRankings}
          savedRankingMessage={savedRankingMessage}
          exporting={exporting}
          myPage={myPage}
          setMyPage={setMyPage}
          myTotalPages={myTotalPages}
          openBreakdownKey={openBreakdownKey}
          setOpenBreakdownKey={setOpenBreakdownKey}
          isCompared={isCompared}
          isSaved={isSaved}
          setSelectedUni={handleOpenUniversity}
          handleToggleCompare={handleToggleCompare}
          handleToggleSave={handleToggleSave}
        />
      ) : (
        <FlatList
          data={tabLoading ? [] : currentResults}
          keyExtractor={keyExtractor}
          renderItem={renderUniversityRow}
          // PERF: render the first rows quickly, then fill in the rest.
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={9}
          contentContainerStyle={[
            styles.listContent,
            bottomPadding(insets, compareList.length > 0 ? 120 : 24),
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <RankingsHero config={config} />

              <RankingTabs activeTab={activeTab} onTabPress={handleTabPress} />

              <RankingStats cards={summaryCards} />

              {activeTab !== 'saved' ? (
                <RankingFilterCard
                  search={search}
                  onSearchChange={setSearch}
                  countryFilter={countryFilter}
                  rowsPerPage={rowsPerPage}
                  onCountryPress={openCountryModal}
                  onRowsPress={openRowsModal}
                  onExport={exportCsv}
                  exporting={exporting}
                />
              ) : (
                <View style={{ height: 4 }} />
              )}

              <RankingTableHeader
                title={tableTitle}
                page={page}
                totalPages={visibleTotalPages}
                totalResults={visibleTotalResults}
              />

              <View style={styles.tableBox}>
                <View style={styles.tableHead}>
                  <Text style={styles.tableHeadRank}>Rank</Text>
                  <Text style={styles.tableHeadUniversity}>University</Text>
                </View>
              </View>

              {tabLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator
                    color={authTheme.colors.brandTeal}
                    size="large"
                  />
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={
            !tabLoading ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'saved'
                    ? 'No saved universities yet'
                    : rankingError
                      ? 'Rankings could not be loaded'
                      : 'No universities found'}
                </Text>

                <Text style={styles.emptyText}>
                  {activeTab === 'saved'
                    ? 'Tap ☆ on a university to save it.'
                    : rankingError ||
                      'Try another search or country.'}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            currentResults.length > 0 && activeTab !== 'saved' && !tabLoading ? (
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={(target) => fetchTabData(activeTab, target)}
              />
            ) : null
          }
        />
      )}

      <OptionModal
        visible={countryModal}
        title="Select Country"
        options={countries}
        selected={countryFilter}
        activeColor={authTheme.colors.brandTeal}
        activeLightColor="#ECFDF5"
        onSelect={handleCountrySelect}
        onClose={closeCountryModal}
      />

      <OptionModal
        visible={rowsModal}
        title="Rows Per Page"
        options={rowOptionLabels}
        selected={String(rowsPerPage)}
        activeColor={authTheme.colors.brandTeal}
        activeLightColor="#ECFDF5"
        onSelect={handleRowsSelect}
        onClose={closeRowsModal}
      />

      <ChoiceModal
        visible={!!choiceModal}
        title={choiceModal?.title}
        items={choiceModal?.items || []}
        onSelect={handleChoiceSelect}
        onClose={closeChoiceModal}
      />

      <SaveRankingNameModal
        visible={saveNameModal}
        value={rankingNameInput}
        datasetKey={datasetKey}
        onChange={setRankingNameInput}
        onClose={closeSaveNameModal}
        onSave={saveMyRanking}
      />

      <SavedRankingsModal
        visible={savedRankingsModal}
        savedRankings={savedRankings}
        datasetKey={datasetKey}
        onClose={closeSavedRankingsModal}
        onApply={applySavedRanking}
        onDelete={deleteSavedRanking}
      />

      <InfoHelpModal
        visible={!!infoModal}
        info={infoModal}
        onClose={closeInfo}
      />

      <CompareModal
        visible={compareModalVisible}
        compareList={compareList}
        allUniversities={allUniversities}
        onClose={closeCompareModal}
        onAddUniversity={handleAddToCompare}
        onRemove={handleRemoveFromCompare}
        onGoToRankings={closeCompareModal}
      />

      <CompareBar
        compareList={compareList}
        onOpenCompare={openCompareModal}
        onClearCompare={clearCompareList}
      />
    </View>
  );
}