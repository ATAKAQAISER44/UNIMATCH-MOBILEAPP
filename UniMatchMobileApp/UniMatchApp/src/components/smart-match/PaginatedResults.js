// src/components/smart-match/PaginatedResults.js

import React, { memo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../AppText';

import { authTheme } from '../../styles/authTheme';
import UniversityLink, { useOpenUniversity } from '../UniversityLink';
import { useSavedUniversities } from '../../services/savedUniversities';
import { useCompareList } from '../../services/compareList';

const safeText = (value, fallback = '') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const formatScore = (value) => {
  const number = safeNumber(value);

  if (number === null) return '—';

  if (number >= 0 && number <= 1) {
    return `${Math.round(number * 100)}%`;
  }

  return number.toFixed(3);
};

const getRaw = (university) => {
  if (university?.raw && typeof university.raw === 'object') {
    return university.raw;
  }

  return {};
};

const getUniversityName = (university) => {
  const raw = getRaw(university);

  return (
    university?.name ||
    university?.university_name ||
    university?.university ||
    university?.institution ||
    university?.Institute ||
    university?.Institution_Name ||
    raw.name ||
    raw.university_name ||
    raw.university ||
    raw.institution ||
    raw.Institute ||
    raw.Institution_Name ||
    'Unknown University'
  );
};

const getCountry = (university) => {
  const raw = getRaw(university);

  return (
    university?.country ||
    university?.Country ||
    university?.location ||
    university?.region ||
    raw.country ||
    raw.Country ||
    raw.location ||
    raw.region ||
    'Unknown Country'
  );
};

const getRank = (university, index) => {
  const raw = getRaw(university);

  return (
    university?.my_rank ||
    university?.personalized_rank ||
    university?.current_rank ||
    university?.official_rank ||
    university?.rank ||
    university?.world_rank ||
    raw.my_rank ||
    raw.current_rank ||
    raw.official_rank ||
    raw.rank ||
    raw.world_rank ||
    index + 1
  );
};

const getOfficialRank = (university) => {
  const raw = getRaw(university);

  return (
    university?.official_rank ||
    university?.rank ||
    university?.world_rank ||
    raw.official_rank ||
    raw.rank ||
    raw.world_rank ||
    'N/A'
  );
};

const getScore = (university) => {
  return (
    university?.final_score ??
    university?.match_score ??
    university?.smart_score ??
    university?.personalized_score ??
    university?.score ??
    null
  );
};

function EmptyState() {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateIcon}>🎓</Text>
      <Text style={styles.stateTitle}>No results yet</Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator size="large" color={authTheme.colors.brandTeal} />
    </View>
  );
}

function InfoBadge({ label, value }) {
  return (
    <View style={styles.infoBadge}>
      <Text style={styles.infoBadgeLabel}>{label}</Text>
      <Text style={styles.infoBadgeValue}>{safeText(value, '—')}</Text>
    </View>
  );
}

function MetaChip({ text }) {
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaChipText} numberOfLines={1}>
        {safeText(text)}
      </Text>
    </View>
  );
}

// PERF: memo() so cards are not rebuilt when the parent re-renders for
// unrelated state (form inputs, notices) while results are on screen.
// Card actions (web PersonalizedCard): View details, Compare, Save.
function CardAction({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, active && styles.actionButtonActive]}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.actionText, active && styles.actionTextActive]} numberOfLines={1}>
        {icon} {label}
      </Text>
    </TouchableOpacity>
  );
}

const UniversityCard = memo(function UniversityCard({
  university = {},
  index,
  dataset,
  saved,
  compared,
  onOpen,
  onToggleSave,
  onToggleCompare,
}) {
  const raw = getRaw(university);

  const rank = getRank(university, index);
  const name = getUniversityName(university);
  const country = getCountry(university);
  const officialRank = getOfficialRank(university);
  const score = getScore(university);

  const rankingScore = university?.ranking_score;
  const attributeScore = university?.attribute_score;

  const explanation = Array.isArray(university?.explanation)
    ? university.explanation
    : [];

  const tuition =
    university?.tuition ||
    university?.tuition_fee ||
    university?.max_tuition_fee ||
    raw.tuition ||
    raw.tuition_fee ||
    raw.max_tuition_fee ||
    raw['Tuition Fee (international)'];

  const cgpa =
    university?.cgpa ||
    university?.minimum_cgpa ||
    university?.min_cgpa ||
    raw.cgpa ||
    raw.minimum_cgpa ||
    raw.min_cgpa ||
    raw['Minimum CGPA Requirement'];

  const scholarship =
    university?.scholarship ||
    raw.scholarship ||
    raw['Scholarship (Yes/No)'];

  return (
    <View style={styles.universityCard}>
      <View style={styles.topLine}>
        <View style={styles.rankBox}>
          <Text style={styles.rankText}>#{safeText(rank, '—')}</Text>
          <Text style={styles.rankLabel}>Rank</Text>
        </View>

        <View style={styles.titleBlock}>
          <UniversityLink
            name={safeText(name, 'Unknown University')}
            country={country}
            dataset={dataset}
            rank={officialRank !== 'N/A' ? officialRank : undefined}
            style={styles.uniName}
            numberOfLines={2}
          />

          <Text style={styles.countryText} numberOfLines={1}>
            📍 {safeText(country, 'Unknown Country')}
          </Text>
        </View>

        {score !== null && score !== undefined ? (
          <View style={styles.scorePill}>
            <Text style={styles.scorePillText}>{formatScore(score)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.badgeRow}>
        <InfoBadge label="Official" value={officialRank} />

        {rankingScore !== null && rankingScore !== undefined ? (
          <InfoBadge label="Ranking" value={formatScore(rankingScore)} />
        ) : null}

        {attributeScore !== null && attributeScore !== undefined ? (
          <InfoBadge label="Attribute" value={formatScore(attributeScore)} />
        ) : null}
      </View>

      {(tuition || cgpa || scholarship) && (
        <View style={styles.metaRow}>
          {tuition !== null && tuition !== undefined && tuition !== '' ? (
            <MetaChip text={`Tuition: ${safeText(tuition)}`} />
          ) : null}

          {cgpa !== null && cgpa !== undefined && cgpa !== '' ? (
            <MetaChip text={`CGPA: ${safeText(cgpa)}`} />
          ) : null}

          {scholarship !== null &&
          scholarship !== undefined &&
          scholarship !== '' ? (
            <MetaChip text={`Scholarship: ${safeText(scholarship)}`} />
          ) : null}
        </View>
      )}

      {explanation.length > 0 ? (
        <View style={styles.explanationBox}>
          {explanation.slice(0, 2).map((item, itemIndex) => (
            <Text
              key={`${itemIndex}-${item}`}
              style={styles.explanationText}
              numberOfLines={1}
            >
              ✓ {safeText(item)}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <CardAction label="Details" icon="›" onPress={() => onOpen(university)} />
        <CardAction label={compared ? 'Compared' : 'Compare'} icon={compared ? '✓' : '+'} active={compared} onPress={() => onToggleCompare(university)} />
        <CardAction label={saved ? 'Saved' : 'Save'} icon={saved ? '★' : '☆'} active={saved} onPress={() => onToggleSave(university)} />
      </View>
    </View>
  );
});

export default function PaginatedResults({
  universities = [],
  loading,
  page,
  setPage,
  pageSize,
  title = 'Search Results',
  description = '',
  dataset,
}) {
  const safeUniversities = Array.isArray(universities) ? universities : [];
  const { isSaved, toggle: toggleSaved } = useSavedUniversities();
  const { isCompared, toggle: toggleCompared } = useCompareList();
  const openUniversity = useOpenUniversity();
  const openCard = useCallback(
    (university) =>
      openUniversity({
        name: getUniversityName(university),
        country: getCountry(university),
        dataset,
        rank: getOfficialRank(university),
      }),
    [dataset, openUniversity]
  );
  const toggleSave = useCallback((university) => toggleSaved({ ...university, dataset }, dataset), [dataset, toggleSaved]);
  const safePageSize = Number(pageSize) || 5;

  const totalPages = Math.max(
    1,
    Math.ceil(safeUniversities.length / safePageSize)
  );

  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);

  const start = (currentPage - 1) * safePageSize;
  const end = start + safePageSize;

  const visible = safeUniversities.slice(start, end);

  if (loading) {
    return <LoadingState />;
  }

  if (safeUniversities.length === 0) {
    return <EmptyState />;
  }

  return (
    <View style={styles.container}>
      {(title || description) && (
        <View style={styles.header}>
          {!!title && <Text style={styles.title}>{title}</Text>}

          {!!description && (
            <Text style={styles.description}>{description}</Text>
          )}

          <Text style={styles.countText}>
            {start + 1}–{Math.min(end, safeUniversities.length)} of {safeUniversities.length}
          </Text>
        </View>
      )}

      <View style={styles.list}>
        {visible.map((university, index) => (
          <UniversityCard
            key={String(
              university?.university_id ||
                university?.id ||
                university?.name ||
                university?.university_name ||
                `${start}-${index}`
            )}
            university={university || {}}
            index={start + index}
            dataset={dataset}
            saved={isSaved(university)}
            compared={isCompared(university)}
            onOpen={openCard}
            onToggleSave={toggleSave}
            onToggleCompare={toggleCompared}
          />
        ))}
      </View>

      {safeUniversities.length > safePageSize && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[
              styles.pageButton,
              currentPage === 1 && styles.pageButtonDisabled,
            ]}
            disabled={currentPage === 1}
            onPress={() => setPage(Math.max(1, currentPage - 1))}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.pageButtonText,
                currentPage === 1 && styles.pageButtonTextDisabled,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>
              {currentPage} / {totalPages}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.pageButton,
              currentPage === totalPages && styles.pageButtonDisabled,
            ]}
            disabled={currentPage === totalPages}
            onPress={() => setPage(Math.min(totalPages, currentPage + 1))}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.pageButtonText,
                currentPage === totalPages && styles.pageButtonTextDisabled,
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  header: {
    marginBottom: 10,
  },

  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    letterSpacing: -0.35,
    marginBottom: 2,
  },

  description: {
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.colors.brandMuted,
    marginBottom: 8,
  },

  countText: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  list: {
    gap: 8,
  },

  universityCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 11,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 2,
  },

  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rankBox: {
    width: 48,
    height: 54,
    borderRadius: 15,
    backgroundColor: authTheme.colors.brandTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  rankText: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  rankLabel: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.82)',
    textTransform: 'uppercase',
    marginTop: 1,
  },

  titleBlock: {
    flex: 1,
    paddingRight: 8,
  },

  uniName: {
    fontSize: 13.5,
    lineHeight: 17,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    marginBottom: 3,
  },

  countryText: {
    fontSize: 11,
    lineHeight: 14,
    color: authTheme.colors.brandMuted,
    fontWeight: '800',
  },

  scorePill: {
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: '#EAF7F3',
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scorePillText: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },

  infoBadge: {
    minWidth: 70,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  infoBadgeLabel: {
    fontSize: 8.8,
    lineHeight: 11,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    textTransform: 'uppercase',
    marginBottom: 1,
  },

  infoBadgeValue: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: authTheme.colors.gray900,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },

  metaChip: {
    maxWidth: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DCEEE8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  metaChipText: {
    fontSize: 10.2,
    lineHeight: 13,
    fontWeight: '800',
    color: authTheme.colors.brandMuted,
  },

  explanationBox: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 8,
  },

  explanationText: {
    fontSize: 10.8,
    lineHeight: 15,
    color: authTheme.colors.brandMuted,
    fontWeight: '700',
  },

  stateBox: {
    minHeight: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  stateIcon: {
    fontSize: 26,
    marginBottom: 8,
  },

  stateTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    marginBottom: 4,
  },

  stateText: {
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.colors.brandMuted,
    textAlign: 'center',
    fontWeight: '700',
  },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  pageButton: {
    minHeight: 36,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: authTheme.colors.brandTeal,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pageButtonDisabled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },

  pageButtonText: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  pageButtonTextDisabled: {
    color: '#94A3B8',
  },

  pageIndicator: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },

  actionButton: {
    flexGrow: 1,
    flexBasis: 80,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  actionButtonActive: {
    borderColor: authTheme.colors.brandTeal,
    backgroundColor: authTheme.colors.brandTeal,
  },

  actionText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  actionTextActive: {
    color: '#FFFFFF',
  },

  pageIndicatorText: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.gray900,
  },
});