
// src/components/smart-match/SavedSearchesPanel.js

import React from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Text } from '../AppText';

import { LinearGradient } from 'expo-linear-gradient';
import { authTheme } from '../../styles/authTheme';

const safeText = (value, fallback = '') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

const formatDate = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString();
};

const formatField = (value) => {
  return safeText(value, 'field').replace(/_/g, ' ');
};

function SavedSearchCard({ search, onApplySearch, onDeleteSearch }) {
  const filters = Array.isArray(search?.filters) ? search.filters : [];
  const createdDate = formatDate(search?.createdAt);

  const handleDelete = () => {
    Alert.alert(
      'Delete Saved Search',
      `Delete "${safeText(search?.title, 'this search')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteSearch(search.id),
        },
      ]
    );
  };

  return (
    <View style={styles.searchCard}>
      <View style={styles.searchHeader}>
        <View style={styles.searchTextBlock}>
          <Text style={styles.searchTitle} numberOfLines={2}>
            {safeText(search?.title, 'Untitled Search')}
          </Text>

          <Text style={styles.searchMeta} numberOfLines={2}>
            {filters.length} filter{filters.length === 1 ? '' : 's'} · Sort by{' '}
            {formatField(search?.sortBy || 'official_rank')} (
            {safeText(search?.sortOrder || 'asc')})
          </Text>

          {!!createdDate && (
            <Text style={styles.searchDate}>Saved {createdDate}</Text>
          )}
        </View>
      </View>

      {filters.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTagRow}
        >
          {filters.map((filter, index) => (
            <View
              key={`${filter?.field || 'filter'}-${index}`}
              style={styles.filterTag}
            >
              <Text style={styles.filterTagText}>
                {formatField(filter?.field)} {safeText(filter?.operator)}{' '}
                {safeText(filter?.value)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.actionGridTwo}>
        <TouchableOpacity
          style={styles.primaryBtnShell}
          onPress={() => onApplySearch(search)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={authTheme.gradients.button}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Apply</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteOutlineButton}
          onPress={handleDelete}
          activeOpacity={0.85}
        >
          <Text style={styles.deleteOutlineText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SavedSearchesPanel({
  savedSearches = [],
  onApplySearch,
  onDeleteSearch,
}) {
  const safeSavedSearches = Array.isArray(savedSearches) ? savedSearches : [];

  if (safeSavedSearches.length === 0) {
    return null;
  }

  return (
    <View style={styles.savedCard}>
      <View style={styles.savedHeader}>
        <Text style={styles.bigTitle}>Saved Searches</Text>

      </View>

      <View style={styles.list}>
        {safeSavedSearches.map((search, index) => (
          <SavedSearchCard
            key={String(search?.id || index)}
            search={search}
            onApplySearch={onApplySearch}
            onDeleteSearch={onDeleteSearch}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  savedCard: {
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

  savedHeader: {
    marginBottom: 12,
  },

  badgePill: {
    alignSelf: 'flex-start',
    minHeight: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    marginBottom: 8,
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: authTheme.colors.brandGreen,
    marginRight: 7,
  },

  badgePillText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
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

  searchCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 10,
  },

  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  searchTextBlock: {
    flex: 1,
  },

  searchTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    marginBottom: 3,
  },

  searchMeta: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '700',
    color: authTheme.colors.brandMuted,
  },

  searchDate: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '800',
    color: authTheme.colors.brandTeal,
  },

  filterTagRow: {
    paddingBottom: 9,
  },

  filterTag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 7,
  },

  filterTagText: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '800',
    color: authTheme.colors.brandTeal,
  },

  actionGridTwo: {
    flexDirection: 'row',
    marginTop: 2,
  },

  primaryBtnShell: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 8,
    shadowColor: authTheme.colors.brandTeal,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 4,
  },

  primaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
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

  deleteOutlineButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  deleteOutlineText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: '#B91C1C',
    textAlign: 'center',
  },

  list: {
    gap: 0,
  },
});