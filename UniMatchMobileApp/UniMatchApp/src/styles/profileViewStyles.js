
// src/styles/profileViewStyles.js

import { StyleSheet } from 'react-native';

import { authTheme, CONTENT_MAX_WIDTH } from './authTheme';

export const profileViewStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: authTheme.colors.brandMint,
  },

  scroll: {
    flex: 1,
    backgroundColor: authTheme.colors.brandMint,
  },

  scrollContent: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 24,
  },

  topBackButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },

  topRightPlaceholder: {
    width: 34,
    height: 34,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: authTheme.colors.brandMint,
  },

  loadingCard: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: authTheme.colors.whiteSoft,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  profileHeaderCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.whiteSoft,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },

  profileHeaderGradient: {
    paddingHorizontal: 14,
    paddingVertical: 15,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarOuter: {
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  avatarGradient: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileTitleBlock: {
    flex: 1,
    minWidth: 0,
  },

  profileName: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    letterSpacing: -0.35,
  },

  profileSubtitle: {
    marginTop: 4,
    fontSize: 11.7,
    lineHeight: 17,
    fontWeight: '600',
    color: authTheme.colors.brandMuted,
  },

  headerStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },

  miniInfoPill: {
    flex: 1,
    minHeight: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: 'rgba(255,255,255,0.86)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
  },

  miniInfoIconBox: {
    width: 30,
    height: 30,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.brandMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  miniInfoTextBox: {
    flex: 1,
    minWidth: 0,
  },

  miniInfoLabel: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  miniInfoValue: {
    marginTop: 2,
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '900',
    color: authTheme.colors.gray900,
  },

  editProfilePill: {
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  editProfilePillText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  sectionsWrap: {
    marginTop: 14,
    gap: 12,
  },

  section: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.whiteSoft,
    padding: 13,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.11,
    shadowRadius: 12,
    elevation: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },

  sectionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.brandMintDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  sectionTitleBlock: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    marginTop: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    color: authTheme.colors.brandMuted,
  },

  rowsCard: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: authTheme.colors.gray100,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  row: {
    minHeight: 54,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: authTheme.colors.gray100,
    justifyContent: 'center',
  },

  rowLast: {
    borderBottomWidth: 0,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  rowIconBox: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: authTheme.colors.brandMint,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  rowLabel: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  },

  rowValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    paddingLeft: 33,
  },

  testsBox: {
    paddingHorizontal: 11,
    paddingTop: 12,
    paddingBottom: 11,
    borderTopWidth: 1,
    borderTopColor: authTheme.colors.gray100,
  },

  testsTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    marginBottom: 9,
  },

  testPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  testPill: {
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },

  testPillText: {
    marginLeft: 5,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
    color: authTheme.colors.brandTeal,
  },
});