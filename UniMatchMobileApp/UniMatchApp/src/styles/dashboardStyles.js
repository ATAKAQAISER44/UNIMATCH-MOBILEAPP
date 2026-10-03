
// src/styles/dashboardStyles.js

import { StyleSheet, Platform } from 'react-native';
import { authTheme } from './authTheme';

export const dashboardStyles = StyleSheet.create({
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

  topBarRightPlaceholder: {
    width: 34,
    height: 34,
  },

  container: {
    flex: 1,
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

  heroLogo: {
    width: 31,
    height: 31,
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

  welcomeName: {
    color: authTheme.colors.brandTeal,
  },

  welcomeDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.colors.brandMuted,
    marginBottom: 11,
  },

  profileGrid: {
    gap: 8,
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

  miniCardHighlighted: {
    borderColor: authTheme.colors.brandTeal,
    borderWidth: 1.2,
    backgroundColor: '#F8FFFC',
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

  miniIconBoxHighlighted: {
    backgroundColor: authTheme.colors.brandTeal,
    borderColor: authTheme.colors.brandTeal,
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

  miniValueHighlighted: {
    color: authTheme.colors.brandTeal,
  },

  miniAction: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: authTheme.colors.brandTeal,
    marginTop: 3,
  },

  arrowPill: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  arrowPillText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  justificationBox: {
    marginTop: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  justificationTitle: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    marginBottom: 3,
  },

  justificationText: {
    fontSize: 11.5,
    lineHeight: 17,
    color: authTheme.colors.brandMuted,
  },

  datasetSection: {
    marginTop: 15,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    letterSpacing: -0.35,
    marginBottom: 2,
  },

  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.colors.brandMuted,
    marginBottom: 10,
  },

  datasetList: {
    gap: 9,
  },

  datasetTile: {
    position: 'relative',
    width: '100%',
    minHeight: 132,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.whiteSoft,
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 11,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.11,
    shadowRadius: 12,
    elevation: 3,
  },

  datasetTileRecommended: {
    borderColor: authTheme.colors.brandTeal,
    borderWidth: 1.3,
    backgroundColor: '#F8FFFC',
  },

  recommendedStar: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: authTheme.colors.brandTeal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 2,
  },

  recommendedStarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  datasetLogoBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  datasetLogoText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
  },

  datasetTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    marginBottom: 5,
    paddingRight: 38,
  },

  datasetDescription: {
    fontSize: 11.5,
    lineHeight: 17,
    color: authTheme.colors.brandMuted,
    marginBottom: 8,
  },

  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },

  featurePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  featureText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    color: authTheme.colors.brandTeal,
  },

  openText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  logoutButton: {
    marginTop: 14,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutButtonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: '#B91C1C',
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    paddingTop: 58,
    paddingHorizontal: 12,
  },

  menuCard: {
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 7,
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  menuItem: {
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 8,
    marginVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  menuIconBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#B7E9D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  profileMenuIconBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#B7E9D4',
  },

  menuText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },

  menuDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 5,
    marginHorizontal: 8,
  },

  logoutItem: {
    backgroundColor: '#FEF2F2',
  },

  logoutIconBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },

  logoutText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#DC2626',
  },
});