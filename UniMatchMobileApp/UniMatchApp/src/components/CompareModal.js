
// src/components/CompareModal.js

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { authTheme } from '../styles/authTheme';

const MAX_COMPARE_LIMIT = 3;

const HIDDEN_KEYS = new Set(['raw', 'id', 'university_id']);

const FIELD_LABELS = {
  name: 'University',
  university_name: 'University',
  Institution_Name: 'University',
  country: 'Country',
  Country: 'Country',
  region: 'Region',
  Region: 'Region',
  rank: 'Official Rank',
  Rank: 'Official Rank',
  official_rank: 'Official Rank',
  world_rank: 'World Rank',
  global_rank: 'Global Rank',
  RANK_2025: 'Official Rank',
  personalized_rank: 'Personalized Rank',
  personalized_score: 'Personalized Score',
  final_score: 'Final Score',
  match_score: 'Match Score',
  Overall_Score: 'Overall Score',
  Academic_Reputation_Score: 'Academic Reputation',
  Employer_Reputation_Score: 'Employer Reputation',
  Faculty_Student_Score: 'Faculty-Student Ratio',
  Citations_per_Faculty_Score: 'Citations Per Faculty',
  International_Faculty_Score: 'International Faculty',
  International_Students_Score: 'International Students',
  International_Research_Network_Score: 'International Research Network',
  Employment_Outcomes_Score: 'Employment Outcomes',
  Sustainability_Score: 'Sustainability',
  scores_teaching: 'Teaching',
  scores_research: 'Research',
  scores_citations: 'Citations',
  scores_industry_income: 'Industry Income',
  scores_international_outlook: 'International Outlook',
  Tuition_Fee_Local: 'Local Tuition Fee',
  Tuition_Fee_International: 'International Tuition Fee',
  Living_Cost: 'Living Cost',
  Scholarship: 'Scholarship',
  Acceptance_Rate: 'Acceptance Rate',
  Internship_Available: 'Internship Available',
  Part_Time_Job_Allowed: 'Part-Time Job Allowed',
  Graduate_Employability_Rate: 'Graduate Employability Rate',
  Language: 'Language',
  Public_Private: 'Public / Private',
};

const PRIORITY_FIELDS = [
  'official_rank',
  'rank',
  'Rank',
  'RANK_2025',
  'personalized_rank',
  'personalized_score',
  'final_score',
  'match_score',
  'country',
  'Country',
  'region',
  'Region',
  'Overall_Score',
  'Academic_Reputation_Score',
  'Employer_Reputation_Score',
  'Faculty_Student_Score',
  'Citations_per_Faculty_Score',
  'International_Faculty_Score',
  'International_Students_Score',
  'International_Research_Network_Score',
  'Employment_Outcomes_Score',
  'Sustainability_Score',
  'scores_teaching',
  'scores_research',
  'scores_citations',
  'scores_industry_income',
  'scores_international_outlook',
  'Tuition_Fee_Local',
  'Tuition_Fee_International',
  'Living_Cost',
  'Scholarship',
  'Acceptance_Rate',
  'Internship_Available',
  'Part_Time_Job_Allowed',
  'Graduate_Employability_Rate',
  'Language',
  'Public_Private',
];

function getRaw(item) {
  return item?.raw && typeof item.raw === 'object' ? item.raw : {};
}

function getMergedItem(item) {
  const raw = getRaw(item);

  return {
    ...raw,
    ...(item || {}),
  };
}

function getUniversityName(item) {
  const merged = getMergedItem(item);

  return (
    merged.name ||
    merged.Name ||
    merged.university ||
    merged.university_name ||
    merged.institution ||
    merged.Institution_Name ||
    merged['Institution Name'] ||
    'Unknown University'
  );
}

function getUniversityCountry(item) {
  const merged = getMergedItem(item);

  return (
    merged.country ||
    merged.Country ||
    merged.location ||
    merged.Location ||
    merged.region ||
    merged.Region ||
    'Unknown Country'
  );
}

function getUniversityKey(item) {
  const merged = getMergedItem(item);

  const id = merged.university_id || merged.id || '';
  const name = getUniversityName(item);
  const country = getUniversityCountry(item);

  return `${String(id).toLowerCase()}|${String(name).toLowerCase()}|${String(
    country
  ).toLowerCase()}`;
}

function formatKey(key) {
  return (
    FIELD_LABELS[key] ||
    String(key || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatValue(key, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return '—';

  const lowerKey = String(key || '').toLowerCase();
  const numericValue = Number(value);

  const shouldNotPercent =
    lowerKey.includes('rank') ||
    lowerKey.includes('fee') ||
    lowerKey.includes('cost') ||
    lowerKey.includes('cgpa') ||
    lowerKey.includes('year') ||
    lowerKey.includes('id');

  if (!Number.isNaN(numericValue) && value !== '' && !shouldNotPercent) {
    if (numericValue >= 0 && numericValue <= 1) {
      return `${(numericValue * 100).toFixed(1)}%`;
    }

    return String(value);
  }

  return String(value);
}

function getValue(item, key) {
  const merged = getMergedItem(item);
  return merged[key];
}

function getCompareFields(compareList) {
  const fieldSet = new Set();

  compareList.forEach((item) => {
    const merged = getMergedItem(item);

    Object.entries(merged).forEach(([key, value]) => {
      if (HIDDEN_KEYS.has(key)) return;
      if (value === null || value === undefined || value === '') return;
      if (typeof value === 'object') return;

      fieldSet.add(key);
    });
  });

  const priority = PRIORITY_FIELDS.filter((key) => fieldSet.has(key));
  const remaining = Array.from(fieldSet)
    .filter((key) => !priority.includes(key))
    .sort((a, b) => formatKey(a).localeCompare(formatKey(b)));

  return [...priority, ...remaining];
}

function isSameUniversity(first, second) {
  return getUniversityKey(first) === getUniversityKey(second);
}

export default function CompareModal({
  visible,
  compareList = [],
  allUniversities = [],
  onClose,
  onAddUniversity,
  onRemove,
  onGoToRankings,
}) {
  const [searchText, setSearchText] = useState('');

  const canAddMore = compareList.length < MAX_COMPARE_LIMIT;
  const cleanSearch = searchText.trim().toLowerCase();

  const compareFields = useMemo(
    () => getCompareFields(compareList),
    [compareList]
  );

  const filteredUniversities = useMemo(() => {
    if (!cleanSearch) {
      return [];
    }

    const seen = new Set();
    const uniqueUniversities = [];

    allUniversities.forEach((item) => {
      const key = getUniversityKey(item);

      if (!seen.has(key)) {
        seen.add(key);
        uniqueUniversities.push(item);
      }
    });

    return uniqueUniversities
      .filter((item) => {
        const name = getUniversityName(item).toLowerCase();
        const country = getUniversityCountry(item).toLowerCase();

        return name.includes(cleanSearch) || country.includes(cleanSearch);
      })
      .slice(0, 30);
  }, [allUniversities, cleanSearch]);

  const handleAddUniversity = (university) => {
    if (!canAddMore) return;

    onAddUniversity?.(university);
    setSearchText('');
  };

  const handleEmptySlotPress = () => {
    onClose?.();
    onGoToRankings?.();
  };

  const filledSlots = compareList.slice(0, MAX_COMPARE_LIMIT);
  const emptySlots = Math.max(0, MAX_COMPARE_LIMIT - filledSlots.length);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.handle} />

          <LinearGradient
            colors={authTheme.gradients.button}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.header}
          >
            <View style={styles.headerTextBox}>
              <Text style={styles.headerBadge}>UniMatch Compare</Text>

              <Text style={styles.title}>Compare Universities</Text>

              <Text style={styles.subtitle}>
                Compare up to 3 universities side by side.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconBox}>
                <Text style={styles.summaryIcon}>⇄</Text>
              </View>

              <View style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Selected Universities</Text>
                <Text style={styles.summaryValue}>
                  {compareList.length}/{MAX_COMPARE_LIMIT} selected
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {compareList.length}/3
                </Text>
              </View>
            </View>

            <View style={styles.selectedSection}>
              <Text style={styles.sectionTitle}>Selected Universities</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedScroll}
              >
                {filledSlots.map((university) => (
                  <View
                    key={getUniversityKey(university)}
                    style={styles.compareColumn}
                  >
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => onRemove?.(university)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>

                    <View style={styles.uniIconBox}>
                      <Text style={styles.uniIcon}>⌂</Text>
                    </View>

                    <Text style={styles.columnTitle} numberOfLines={3}>
                      {getUniversityName(university)}
                    </Text>

                    <Text style={styles.columnCountry} numberOfLines={2}>
                      📍 {getUniversityCountry(university)}
                    </Text>
                  </View>
                ))}

                {Array.from({ length: emptySlots }).map((_, index) => (
                  <TouchableOpacity
                    key={`empty-${index}`}
                    style={styles.emptyColumn}
                    activeOpacity={0.82}
                    onPress={handleEmptySlotPress}
                  >
                    <Text style={styles.emptySlotIcon}>＋</Text>
                    <Text style={styles.emptySlotText}>
                      University {filledSlots.length + index + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>Add University</Text>

              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>⌕</Text>

                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search by university or country..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                />

                {!!searchText && (
                  <TouchableOpacity
                    onPress={() => setSearchText('')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.clearText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!canAddMore && (
                <View style={styles.limitNotice}>
                  <Text style={styles.limitNoticeText}>
                    You can compare up to 3 universities. Remove one to add another.
                  </Text>
                </View>
              )}

              {cleanSearch ? (
                filteredUniversities.length > 0 ? (
                  filteredUniversities.map((item) => {
                    const alreadyAdded = compareList.some((university) =>
                      isSameUniversity(university, item)
                    );

                    return (
                      <TouchableOpacity
                        key={getUniversityKey(item)}
                        style={[
                          styles.searchItem,
                          alreadyAdded && styles.searchItemAdded,
                          !canAddMore &&
                            !alreadyAdded &&
                            styles.searchItemDisabled,
                        ]}
                        onPress={() => handleAddUniversity(item)}
                        disabled={alreadyAdded || !canAddMore}
                        activeOpacity={0.85}
                      >
                        <View style={styles.searchItemIcon}>
                          <Text style={styles.searchItemIconText}>⌂</Text>
                        </View>

                        <View style={styles.searchItemInfo}>
                          <Text
                            style={styles.searchItemTitle}
                            numberOfLines={2}
                          >
                            {getUniversityName(item)}
                          </Text>

                          <Text
                            style={styles.searchItemCountry}
                            numberOfLines={1}
                          >
                            {getUniversityCountry(item)}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.addChip,
                            alreadyAdded && styles.addChipAdded,
                            !canAddMore &&
                              !alreadyAdded &&
                              styles.addChipDisabled,
                          ]}
                        >
                          <Text style={styles.addChipText}>
                            {alreadyAdded ? 'Added' : 'Add'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptySearchBox}>
                    <Text style={styles.emptySearchTitle}>
                      No universities found
                    </Text>
                    <Text style={styles.emptySearchText}>
                      Try searching with another university name or country.
                    </Text>
                  </View>
                )
              ) : null}
            </View>

            {compareList.length >= 2 && (
              <View style={styles.tableSection}>
                <Text style={styles.sectionTitle}>Side-by-Side Comparison</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <View style={styles.metricHeaderCell}>
                        <Text style={styles.metricHeaderText}>Metric</Text>
                      </View>

                      {compareList.map((university) => (
                        <View
                          key={`header-${getUniversityKey(university)}`}
                          style={styles.universityHeaderCell}
                        >
                          <Text
                            style={styles.universityHeaderText}
                            numberOfLines={3}
                          >
                            {getUniversityName(university)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {compareFields.map((fieldKey, index) => (
                      <View
                        key={fieldKey}
                        style={[
                          styles.tableRow,
                          index === compareFields.length - 1 &&
                            styles.tableLastRow,
                        ]}
                      >
                        <View style={styles.metricCell}>
                          <Text style={styles.metricText}>
                            {formatKey(fieldKey)}
                          </Text>
                        </View>

                        {compareList.map((university) => (
                          <View
                            key={`${fieldKey}-${getUniversityKey(university)}`}
                            style={styles.valueCell}
                          >
                            <Text style={styles.valueText} numberOfLines={4}>
                              {formatValue(
                                fieldKey,
                                getValue(university, fieldKey)
                              )}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {compareList.length < 2 && (
              <View style={styles.helpBox}>
                <Text style={styles.helpTitle}>Add at least 2 universities</Text>
                <Text style={styles.helpText}>
                  Select one more university to view the comparison table.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.48)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '92%',
    overflow: 'hidden',
  },

  handle: {
    width: 46,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  headerTextBox: {
    flex: 1,
    paddingRight: 12,
  },

  headerBadge: {
    alignSelf: 'flex-start',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginBottom: 7,
    opacity: 0.9,
  },

  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.84)',
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  content: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },

  summaryCard: {
    minHeight: 66,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BCEAD8',
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },

  summaryIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: authTheme.colors.brandTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  summaryIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  summaryText: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  summaryValue: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    color: '#020617',
    marginTop: 1,
  },

  countBadge: {
    minWidth: 43,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BCEAD8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },

  countBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  selectedSection: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginBottom: 9,
  },

  selectedScroll: {
    gap: 10,
    paddingRight: 4,
  },

  compareColumn: {
    width: 154,
    minHeight: 148,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  removeButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },

  removeButtonText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DC2626',
  },

  uniIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BCEAD8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  uniIcon: {
    fontSize: 15,
    color: authTheme.colors.brandTeal,
  },

  columnTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#020617',
    lineHeight: 18,
    marginBottom: 6,
  },

  columnCountry: {
    fontSize: 11,
    color: authTheme.colors.brandMuted,
    fontWeight: '700',
    lineHeight: 16,
  },

  emptyColumn: {
    width: 154,
    minHeight: 148,
    backgroundColor: '#F8FAFC',
    borderColor: '#BCEAD8',
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptySlotIcon: {
    fontSize: 25,
    color: authTheme.colors.brandTeal,
    marginBottom: 6,
  },

  emptySlotText: {
    fontSize: 12,
    color: authTheme.colors.brandMuted,
    fontWeight: '800',
  },

  searchSection: {
    marginBottom: 18,
  },

  searchBox: {
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BCEAD8',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  searchIcon: {
    fontSize: 17,
    color: authTheme.colors.brandTeal,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    minHeight: 46,
    fontSize: 13.5,
    color: '#020617',
    fontWeight: '600',
  },

  clearText: {
    color: authTheme.colors.brandMuted,
    fontSize: 15,
    fontWeight: '900',
  },

  limitNotice: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  limitNoticeText: {
    color: '#B91C1C',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },

  searchItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BCEAD8',
    borderRadius: 16,
    padding: 12,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchItemAdded: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },

  searchItemDisabled: {
    opacity: 0.5,
  },

  searchItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  searchItemIconText: {
    fontSize: 15,
    color: authTheme.colors.brandTeal,
  },

  searchItemInfo: {
    flex: 1,
    paddingRight: 10,
  },

  searchItemTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#020617',
    marginBottom: 4,
    lineHeight: 18,
  },

  searchItemCountry: {
    fontSize: 12,
    color: authTheme.colors.brandMuted,
    fontWeight: '700',
  },

  addChip: {
    backgroundColor: authTheme.colors.brandTeal,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  addChipAdded: {
    backgroundColor: authTheme.colors.brandGreen,
  },

  addChipDisabled: {
    backgroundColor: '#CBD5E1',
  },

  addChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  emptySearchBox: {
    backgroundColor: '#F8FFFC',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BCEAD8',
  },

  emptySearchTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#020617',
    marginBottom: 5,
  },

  emptySearchText: {
    fontSize: 12,
    color: authTheme.colors.brandMuted,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },

  tableSection: {
    marginBottom: 18,
  },

  table: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#BCEAD8',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#BCEAD8',
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#BCEAD8',
  },

  tableLastRow: {
    borderBottomWidth: 0,
  },

  metricHeaderCell: {
    width: 135,
    minHeight: 58,
    backgroundColor: '#ECFDF5',
    padding: 10,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#BCEAD8',
  },

  universityHeaderCell: {
    width: 145,
    minHeight: 58,
    backgroundColor: '#ECFDF5',
    padding: 10,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#BCEAD8',
  },

  metricHeaderText: {
    color: '#020617',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },

  universityHeaderText: {
    color: authTheme.colors.brandTeal,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 16,
  },

  metricCell: {
    width: 135,
    minHeight: 54,
    backgroundColor: '#F8FFFC',
    borderRightWidth: 1,
    borderRightColor: '#BCEAD8',
    padding: 10,
    justifyContent: 'center',
  },

  valueCell: {
    width: 145,
    minHeight: 54,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#BCEAD8',
    padding: 10,
    justifyContent: 'center',
  },

  metricText: {
    fontSize: 12,
    color: authTheme.colors.brandTeal,
    fontWeight: '900',
    lineHeight: 17,
  },

  valueText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    lineHeight: 17,
  },

  helpBox: {
    backgroundColor: '#F8FFFC',
    borderWidth: 1,
    borderColor: '#BCEAD8',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },

  helpTitle: {
    fontSize: 15,
    color: authTheme.colors.brandTeal,
    fontWeight: '900',
    marginBottom: 5,
  },

  helpText: {
    fontSize: 12,
    color: authTheme.colors.brandMuted,
    fontWeight: '700',
    lineHeight: 18,
  },
});