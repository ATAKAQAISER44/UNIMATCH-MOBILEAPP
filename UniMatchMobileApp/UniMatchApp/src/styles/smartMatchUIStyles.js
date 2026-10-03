
// src/styles/smartMatchUIStyles.js

import { StyleSheet } from 'react-native';
import { authTheme } from './authTheme';

export const smartMatchUIStyles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
  },

  loadingBox: {
    minHeight: 220,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    color: authTheme.colors.brandMuted,
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

  sortCard: {
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

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  cardTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    letterSpacing: -0.45,
  },

  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.colors.brandMuted,
  },

  cardHeaderIconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.brandMintDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardHeaderIcon: {
    fontSize: 17,
    lineHeight: 20,
  },

  messageBox: {
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
  },

  messageBoxError: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },

  messageBoxInfo: {
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
  },

  messageText: {
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '700',
  },

  messageTextError: {
    color: '#B91C1C',
  },

  messageTextInfo: {
    color: authTheme.colors.brandTeal,
  },

  profileSection: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 10,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.brandMintDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  sectionIcon: {
    fontSize: 15,
  },

  profileSectionTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.gray900,
  },

  fieldLabel: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 7,
    marginTop: 2,
  },

  placeholderHint: {
    fontSize: 11.5,
    lineHeight: 17,
    color: authTheme.colors.brandMuted,
    marginBottom: 6,
  },

  chipRow: {
    paddingBottom: 9,
  },

  chip: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  chipActive: {
    borderColor: authTheme.colors.brandTeal,
    backgroundColor: '#EAF7F3',
  },

  chipText: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
    color: authTheme.colors.brandMuted,
  },

  chipTextActive: {
    color: authTheme.colors.brandTeal,
    fontWeight: '900',
  },

  input: {
    width: '100%',
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: authTheme.colors.gray900,
    marginBottom: 10,
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: 2,
  },

  primaryButtonShell: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    overflow: 'hidden',
    marginRight: 8,
    shadowColor: authTheme.colors.brandTeal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  primaryButtonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  secondaryButtonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textAlign: 'center',
  },

  disabledButton: {
    opacity: 0.7,
  },

  sortSection: {
    marginBottom: 8,
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
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.11,
    shadowRadius: 14,
    elevation: 3,
  },

  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.colors.brandMuted,
    fontWeight: '700',
    marginBottom: 10,
  },

  resultsWrapper: {
    marginTop: 2,
  },

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
    gap: 9,
  },

  rankBox: {
    width: 54,
    minHeight: 78,
    borderRadius: 16,
    backgroundColor: authTheme.colors.brandTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  rankText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  rankLabel: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.82)',
    textTransform: 'uppercase',
    marginTop: 2,
  },

  cardBody: {
    flex: 1,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
  },

  uniName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    marginBottom: 3,
  },

  countryText: {
    fontSize: 11.5,
    lineHeight: 15,
    color: authTheme.colors.brandMuted,
    fontWeight: '700',
  },

  scorePill: {
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: '#EAF7F3',
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  scorePillText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 7,
  },

  infoBadge: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  infoBadgeLabel: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    textTransform: 'uppercase',
    marginBottom: 1,
  },

  infoBadgeValue: {
    fontSize: 11.5,
    lineHeight: 14,
    fontWeight: '900',
    color: authTheme.colors.gray900,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  metaChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DCEEE8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  metaChipText: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '800',
    color: authTheme.colors.brandMuted,
  },

  explanationBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginTop: 8,
  },

  explanationText: {
    fontSize: 11,
    lineHeight: 16,
    color: authTheme.colors.brandMuted,
    fontWeight: '700',
  },

  stateBox: {
    minHeight: 160,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  stateIcon: {
    fontSize: 28,
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
    minHeight: 38,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: authTheme.colors.brandTeal,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pageButtonDisabled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },

  pageButtonText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  pageButtonTextDisabled: {
    color: '#94A3B8',
  },

  pageIndicator: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pageIndicatorText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.gray900,
  },
});