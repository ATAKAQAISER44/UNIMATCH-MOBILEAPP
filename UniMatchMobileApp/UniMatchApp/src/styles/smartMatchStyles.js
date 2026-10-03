
// src/styles/smartMatchStyles.js

import { StyleSheet, Platform } from 'react-native';
import { authTheme } from './authTheme';

export const smartMatchStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: authTheme.colors.brandMint,
  },

  topBar: {
    minHeight: 78,
    paddingTop: Platform.OS === 'android' ? 28 : 38,
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },

  menuButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuIcon: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginTop: -2,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },

  navLogoWrap: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: authTheme.colors.brandMintDeep,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  navLogo: {
    width: 28,
    height: 28,
  },

  navBrand: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  profileButton: {
    height: 34,
    minWidth: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  profileIconBox: {
    width: 24,
    height: 24,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileIcon: {
    fontSize: 12,
  },

  chevron: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 3,
    marginTop: -3,
  },

  container: {
    flex: 1,
    backgroundColor: authTheme.colors.brandMint,
  },

  panelContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 14,
    backgroundColor: authTheme.colors.brandMint,
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 22,
  },

  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.whiteSoft,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },

  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  heroLogoWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.brandMintDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    ...authTheme.shadow.soft,
  },

  heroLogoIcon: {
    fontSize: 18,
    lineHeight: 22,
  },

  dashboardBadge: {
    minHeight: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: authTheme.colors.brandGreen,
    marginRight: 7,
  },

  dashboardBadgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },

  welcomeTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    letterSpacing: -0.45,
    marginBottom: 5,
  },

  welcomeDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.colors.brandMuted,
    marginBottom: 11,
  },

  datasetSummaryBox: {
    width: '100%',
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },

  profileGrid: {
    gap: 8,
    marginBottom: 10,
  },

  miniCard: {
    width: '100%',
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  miniIconBox: {
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

  miniIcon: {
    fontSize: 15,
  },

  miniTextBlock: {
    flex: 1,
  },

  miniLabel: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 1,
  },

  miniValue: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: authTheme.colors.gray900,
  },
});