
// src/components/smart-match/CustomExplorePanel.js

import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import PaginatedResults from './PaginatedResults';
import CustomFilterBuilder from './CustomFilterBuilder';
import SavedSearchesPanel from './SavedSearchesPanel';
import { authTheme } from '../../styles/authTheme';

const SORT_OPTIONS = [
  { label: 'Official Rank', value: 'official_rank' },
  { label: 'Smart Rank', value: 'smart_rank' },
  { label: 'Personalized Score', value: 'personalized_score' },
  { label: 'Tuition Fee', value: 'tuition_fee' },
  { label: 'Living Cost', value: 'living_cost' },
  { label: 'Acceptance Rate', value: 'acceptance_rate' },
  { label: 'Employability', value: 'graduate_employability_rate' },
];

const ORDER_OPTIONS = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
];

const PAGE_SIZE_OPTIONS = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
];

const DEFAULT_SORT_BY = 'official_rank';
const DEFAULT_SORT_ORDER = 'asc';
const DEFAULT_PAGE_SIZE = 5;
// 0 = no limit: every matching university is returned and paged in the app.
const DEFAULT_TOP_N = 0;

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function GradientButton({
  label,
  loading,
  disabled,
  onPress,
  variant = 'primary',
}) {
  const isGhost = variant === 'ghost';
  const isTeal = variant === 'teal';

  if (isGhost) {
    return (
      <TouchableOpacity
        style={[styles.ghostBtn, disabled && styles.btnDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color={authTheme.colors.brandTeal} />
        ) : (
          <Text style={styles.ghostBtnText}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (isTeal) {
    return (
      <TouchableOpacity
        style={[styles.tealBtn, disabled && styles.btnDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color={'#FFFFFF'} />
        ) : (
          <Text style={styles.tealBtnText}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.primaryBtnShell, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={authTheme.gradients.button}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.primaryBtn}
      >
        {loading ? (
          <ActivityIndicator size="small" color={'#FFFFFF'} />
        ) : (
          <Text style={styles.primaryBtnText}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

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
        const active = value === option.value;

        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
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
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>Sort Results</Text>
              <Text style={styles.sheetSubtitle}>
                Choose sorting and page size
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            <View style={styles.sortSection}>
              <Text style={styles.label}>Sort By</Text>
              <OptionChipSelector
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={setSortBy}
              />
            </View>

            <View style={styles.sortSection}>
              <Text style={styles.label}>Order</Text>
              <OptionChipSelector
                options={ORDER_OPTIONS}
                value={sortOrder}
                onChange={setSortOrder}
              />
            </View>

            <View style={styles.sortSection}>
              <Text style={styles.label}>Results Per Page</Text>
              <OptionChipSelector
                options={PAGE_SIZE_OPTIONS}
                value={pageSize}
                onChange={(value) => setPageSize(Number(value))}
              />
            </View>

            <GradientButton
              label="Apply Sort"
              loading={loading}
              disabled={loading}
              onPress={onApply}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

export default function CustomExplorePanel({
  headerComponent = null,
  datasetKey,
  universities = [],
  loading,
  customNotice,
  fetchCustomExplore,
}) {
  const draftStorageKey = useMemo(
    () => `unimatch_custom_explore_draft_${datasetKey}`,
    [datasetKey]
  );

  const savedStorageKey = useMemo(
    () => `unimatch_saved_custom_searches_${datasetKey}`,
    [datasetKey]
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] = useState(DEFAULT_SORT_ORDER);

  const [filters, setFilters] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  const [showSaveBox, setShowSaveBox] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  const [sortModalVisible, setSortModalVisible] = useState(false);

  const hasResults = Array.isArray(universities) && universities.length > 0;

  useEffect(() => {
    loadSavedState();
  }, [draftStorageKey, savedStorageKey]);

  useEffect(() => {
    AsyncStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        filters,
        sortBy,
        sortOrder,
        pageSize,
      })
    ).catch(() => {});
  }, [filters, sortBy, sortOrder, pageSize, draftStorageKey]);

  const loadSavedState = async () => {
    try {
      const savedDraft = await AsyncStorage.getItem(draftStorageKey);

      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);

        setFilters(Array.isArray(parsed?.filters) ? parsed.filters : []);
        setSortBy(parsed?.sortBy || DEFAULT_SORT_BY);
        setSortOrder(parsed?.sortOrder || DEFAULT_SORT_ORDER);
        setPageSize(Number(parsed?.pageSize) || DEFAULT_PAGE_SIZE);
      }

      const savedItems = await AsyncStorage.getItem(savedStorageKey);

      if (savedItems) {
        const parsedSavedItems = JSON.parse(savedItems);
        setSavedSearches(
          Array.isArray(parsedSavedItems) ? parsedSavedItems : []
        );
      }
    } catch (error) {
      console.error('Failed to load custom explore state:', error);
      setFilters([]);
      setSavedSearches([]);
    }
  };

  const getCleanFilters = () => {
    return (filters || [])
      .map((item) => ({
        field: String(item?.field || '').trim(),
        operator: String(item?.operator || '').trim(),
        value:
          typeof item?.value === 'string' ? item.value.trim() : item?.value,
      }))
      .filter(
        (item) =>
          item.field &&
          item.operator &&
          item.value !== '' &&
          item.value !== null &&
          item.value !== undefined
      );
  };

  const buildPayload = (nextFilters = getCleanFilters()) => ({
    filters: nextFilters,
    sortBy,
    sortOrder,
    topN: DEFAULT_TOP_N,
  });

  const applyFilters = () => {
    const cleanFilters = getCleanFilters();

    if (cleanFilters.length === 0) {
      Alert.alert(
        'No Filters',
        'Please add at least one filter before applying.'
      );
      return;
    }

    setPage(1);
    fetchCustomExplore(buildPayload(cleanFilters));
  };

  const applySort = () => {
    const cleanFilters = getCleanFilters();

    if (cleanFilters.length === 0) {
      Alert.alert(
        'No Filters',
        'Add at least one filter first, then choose how to sort the results.'
      );
      return;
    }

    setSortModalVisible(false);
    setPage(1);
    fetchCustomExplore(buildPayload(cleanFilters));
  };

  const openSortModal = () => {
    setSortBy(DEFAULT_SORT_BY);
    setSortOrder(DEFAULT_SORT_ORDER);
    setSortModalVisible(true);
  };

  const resetFilters = async () => {
    setPage(1);
    setFilters([]);
    setShowSaveBox(false);
    setSaveTitle('');
    setSortBy(DEFAULT_SORT_BY);
    setSortOrder(DEFAULT_SORT_ORDER);
    setPageSize(DEFAULT_PAGE_SIZE);

    await AsyncStorage.removeItem(draftStorageKey).catch(() => {});

    fetchCustomExplore({
      filters: [],
      sortBy: DEFAULT_SORT_BY,
      sortOrder: DEFAULT_SORT_ORDER,
      topN: DEFAULT_TOP_N,
    });
  };

  const openSaveBox = () => {
    const cleanFilters = getCleanFilters();

    if (cleanFilters.length === 0) {
      Alert.alert(
        'No Filters',
        'Add at least one filter before saving this search.'
      );
      return;
    }

    setShowSaveBox(true);
  };

  const saveCurrentSearch = async () => {
    const cleanFilters = getCleanFilters();

    if (cleanFilters.length === 0) {
      Alert.alert(
        'No Filters',
        'Add at least one filter before saving this search.'
      );
      return;
    }

    if (!saveTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a search title.');
      return;
    }

    const newSearch = {
      id: makeId(),
      title: saveTitle.trim(),
      filters: cleanFilters,
      sortBy,
      sortOrder,
      pageSize,
      createdAt: new Date().toISOString(),
    };

    const updatedSearches = [newSearch, ...savedSearches];

    setSavedSearches(updatedSearches);

    await AsyncStorage.setItem(
      savedStorageKey,
      JSON.stringify(updatedSearches)
    ).catch(() => {});

    setSaveTitle('');
    setShowSaveBox(false);
  };

  const applySavedSearch = (search) => {
    const savedFilters = Array.isArray(search?.filters) ? search.filters : [];

    setPage(1);
    setFilters(savedFilters);
    setSortBy(search?.sortBy || DEFAULT_SORT_BY);
    setSortOrder(search?.sortOrder || DEFAULT_SORT_ORDER);
    setPageSize(Number(search?.pageSize) || DEFAULT_PAGE_SIZE);
    setShowSaveBox(false);
    setSaveTitle('');

    fetchCustomExplore({
      filters: savedFilters,
      sortBy: search?.sortBy || DEFAULT_SORT_BY,
      sortOrder: search?.sortOrder || DEFAULT_SORT_ORDER,
      topN: DEFAULT_TOP_N,
    });
  };

  const deleteSavedSearch = async (searchId) => {
    const updatedSearches = savedSearches.filter(
      (search) => search.id !== searchId
    );

    setSavedSearches(updatedSearches);

    await AsyncStorage.setItem(
      savedStorageKey,
      JSON.stringify(updatedSearches)
    ).catch(() => {});
  };

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
          <View style={styles.builderBox}>
            <CustomFilterBuilder
              filters={filters}
              setFilters={setFilters}
              actionsComponent={
                <>
                  <View style={styles.compactActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.compactActionBtn,
                        styles.compactPrimaryBtn,
                        loading && styles.btnDisabled,
                      ]}
                      activeOpacity={0.85}
                      disabled={loading}
                      onPress={applyFilters}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.compactPrimaryText}>✓ Apply</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.compactActionBtn,
                        styles.compactTealBtn,
                        loading && styles.btnDisabled,
                      ]}
                      activeOpacity={0.85}
                      disabled={loading}
                      onPress={openSaveBox}
                    >
                      <Text style={styles.compactTealText}>☆ Save</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.compactActionBtn,
                        styles.compactGhostBtn,
                        loading && styles.btnDisabled,
                      ]}
                      activeOpacity={0.85}
                      disabled={loading}
                      onPress={resetFilters}
                    >
                      <Text style={styles.compactGhostText}>↺ Reset</Text>
                    </TouchableOpacity>
                  </View>

                  {showSaveBox && (
                    <View style={styles.saveBox}>
                      <Text style={styles.saveBoxLabel}>Name this search</Text>

                      <TextInput
                        style={styles.saveInput}
                        value={saveTitle}
                        onChangeText={setSaveTitle}
                        placeholder="e.g. Affordable CS Masters in Europe"
                        placeholderTextColor="#94A3B8"
                        autoFocus
                      />

                      <View style={styles.saveActions}>
                        <GradientButton
                          label="Save"
                          loading={false}
                          disabled={false}
                          onPress={saveCurrentSearch}
                        />

                        <GradientButton
                          label="Cancel"
                          loading={false}
                          disabled={false}
                          onPress={() => {
                            setShowSaveBox(false);
                            setSaveTitle('');
                          }}
                          variant="ghost"
                        />
                      </View>
                    </View>
                  )}
                </>
              }
            />
          </View>
        </View>

        <SavedSearchesPanel
          savedSearches={savedSearches}
          onApplySearch={applySavedSearch}
          onDeleteSearch={deleteSavedSearch}
        />

        {customNotice && (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              {typeof customNotice?.message === 'string'
                ? customNotice.message
                : JSON.stringify(customNotice?.message || customNotice)}
            </Text>
          </View>
        )}

        <View style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <View style={styles.resultsTitleBox}>
              <Text style={styles.bigTitle}>Search Results</Text>
            </View>

            {hasResults ? (
              <TouchableOpacity
                style={styles.sortIconButton}
                activeOpacity={0.85}
                onPress={openSortModal}
                disabled={loading}
              >
                <Text style={styles.sortIconText}>⇅</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {!hasResults ? (
            <Text style={styles.cardSubtitle}>
              Universities matching your filters
            </Text>
          ) : null}

          <View style={styles.resultsBox}>
            <PaginatedResults
              title=""
              description=""
              universities={universities}
              loading={loading}
              activeTab="smart"
              page={page}
              setPage={setPage}
              pageSize={pageSize}
            />
          </View>
        </View>
      </ScrollView>

      <SortOptionsModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        pageSize={pageSize}
        setPageSize={setPageSize}
        loading={loading}
        onApply={applySort}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
  },

  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.whiteSoft,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
    marginBottom: 12,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },

  resultsCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.whiteSoft,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
    marginBottom: 12,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  resultsTitleBox: {
    flex: 1,
    paddingRight: 10,
  },

  bigTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    letterSpacing: -0.45,
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.colors.brandMuted,
  },

  label: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 7,
  },

  builderBox: {
    marginTop: 12,
  },

  compactActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },

  compactActionBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  compactPrimaryBtn: {
    backgroundColor: authTheme.colors.brandTeal,
    shadowColor: authTheme.colors.brandTeal,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 4,
  },

  compactTealBtn: {
    borderWidth: 1,
    borderColor: authTheme.colors.brandTeal,
    backgroundColor: '#EAF7F3',
  },

  compactGhostBtn: {
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
  },

  compactPrimaryText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  compactTealText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textAlign: 'center',
  },

  compactGhostText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textAlign: 'center',
  },

  primaryBtnShell: {
    minHeight: 48,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: authTheme.colors.brandTeal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  primaryBtn: {
    minHeight: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  primaryBtnText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  tealBtn: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: authTheme.colors.brandTeal,
    backgroundColor: '#EAF7F3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  tealBtnText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textAlign: 'center',
  },

  ghostBtn: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  ghostBtnText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textAlign: 'center',
  },

  btnDisabled: {
    opacity: 0.7,
  },

  saveBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    marginTop: 10,
  },

  saveBoxLabel: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 7,
  },

  saveInput: {
    width: '100%',
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: authTheme.colors.gray900,
    marginBottom: 10,
  },

  saveActions: {
    width: '100%',
  },

  noticeCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
    marginBottom: 12,
  },

  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.colors.brandMuted,
    fontWeight: '700',
  },

  resultsBox: {
    marginTop: 12,
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

  modalOverlay: {
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

  sheetHeaderText: {
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

  sheetContent: {
    paddingBottom: 4,
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

  sortSection: {
    marginBottom: 12,
  },

  chipRow: {
    paddingVertical: 2,
    gap: 8,
  },

  chip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: authTheme.colors.brandTeal,
  },

  chipText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: authTheme.colors.brandMuted,
  },

  chipTextActive: {
    color: authTheme.colors.brandTeal,
    fontWeight: '900',
  },
});