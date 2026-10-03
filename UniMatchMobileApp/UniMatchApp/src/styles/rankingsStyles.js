
// src/styles/rankingsStyles.js

import { StyleSheet, Platform } from 'react-native';
import { authTheme } from './authTheme';

const colors = authTheme.colors;

const WHITE = '#FFFFFF';
const SOFT_WHITE = '#F8FFFC';
const INPUT_BG = '#F3F6FA';
const INPUT_BORDER = '#D7DDE5';

const center = {
  alignItems: 'center',
  justifyContent: 'center',
};

const cardBorder = {
  borderWidth: 1,
  borderColor: colors.brandBorder,
};

const softCard = {
  ...cardBorder,
  backgroundColor: colors.whiteSoft,
};

const cardShadow = {
  shadowColor: '#94A3B8',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.13,
  shadowRadius: 14,
  elevation: 4,
};

const smallShadow = {
  shadowColor: '#94A3B8',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.11,
  shadowRadius: 12,
  elevation: 3,
};

const uppercaseLabel = {
  fontWeight: '900',
  textTransform: 'uppercase',
  letterSpacing: 1,
};

const tealHeavy = {
  fontWeight: '900',
  color: colors.brandTeal,
};

export const rankingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandMint,
  },

  fullLoading: {
    flex: 1,
    backgroundColor: colors.brandMint,
    ...center,
  },

  loadingText: {
    marginTop: 8,
    color: colors.brandMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },

  appHeader: {
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
    ...center,
  },

  menuIcon: {
    color: WHITE,
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
    backgroundColor: colors.brandMintDeep,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    marginRight: 8,
    ...center,
  },

  navLogo: {
    width: 28,
    height: 28,
  },

  navBrand: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: WHITE,
    letterSpacing: -0.3,
  },

  headerRightPlaceholder: {
    width: 34,
    height: 34,
  },

  listContent: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: colors.brandMint,
  },

  listContentWithCompareBar: {
    paddingBottom: 120,
  },

  heroCard: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
    marginBottom: 12,
    ...softCard,
    ...cardShadow,
  },

  datasetBadge: {
    alignSelf: 'flex-start',
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: SOFT_WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    marginBottom: 8,
    ...cardBorder,
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.brandGreen,
    marginRight: 7,
  },

  datasetBadgeText: {
    fontSize: 10,
    lineHeight: 13,
    color: colors.brandTeal,
    ...uppercaseLabel,
  },

  heroTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
    color: colors.gray900,
    letterSpacing: -0.4,
    marginBottom: 5,
  },

  heroSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.brandMuted,
  },

  tabsWrapper: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 11,
    ...softCard,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },

  tabBtn: {
    flex: 1,
    minHeight: 48,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    backgroundColor: colors.whiteSoft,
    ...center,
  },

  tabBtnActive: {
    backgroundColor: colors.brandMintDeep,
    borderBottomColor: colors.brandTeal,
  },

  tabIcon: {
    fontSize: 12,
    marginBottom: 2,
  },

  tabText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.brandMuted,
  },

  tabTextActive: {
    color: colors.brandTeal,
    fontWeight: '900',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: 12,
  },

  statCard: {
    width: '48.5%',
    minHeight: 64,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...softCard,
  },

  statTextBlock: {
    flex: 1,
  },

  statValue: {
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 1,
    ...tealHeavy,
  },

  statLabel: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.brandMuted,
  },

  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.brandMintDeep,
    marginLeft: 7,
    ...cardBorder,
    ...center,
  },

  statIcon: {
    fontSize: 14,
    color: colors.brandTeal,
  },

  filterCard: {
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 13,
    marginBottom: 12,
    ...softCard,
    ...smallShadow,
  },

  filterLabel: {
    fontSize: 10,
    lineHeight: 13,
    color: colors.brandTeal,
    marginBottom: 5,
    ...uppercaseLabel,
  },

  searchBox: {
    minHeight: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  searchIcon: {
    fontSize: 15,
    color: colors.brandTeal,
    marginRight: 7,
  },

  searchInput: {
    flex: 1,
    minHeight: 40,
    fontSize: 13,
    color: colors.gray900,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 7 : 4,
  },

  clearText: {
    color: colors.brandMuted,
    fontSize: 13,
    fontWeight: '900',
  },

  selectBox: {
    minHeight: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  selectText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.gray900,
  },

  selectArrow: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.brandTeal,
  },

  exportButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 1,
    ...authTheme.shadow.button,
  },

  exportButtonDisabled: {
    opacity: 0.7,
  },

  exportGradient: {
    minHeight: 42,
    ...center,
  },

  exportText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: WHITE,
  },

  savedInfoCard: {
    backgroundColor: SOFT_WHITE,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 12,
    ...cardBorder,
  },

  savedInfoTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.brandTeal,
    fontWeight: '900',
    marginBottom: 3,
  },

  savedInfoText: {
    fontSize: 12,
    color: colors.brandMuted,
    fontWeight: '600',
    lineHeight: 17,
  },

  tableIntro: {
    marginTop: 0,
    marginBottom: 10,
  },

  tableTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  tableCheckBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.brandTeal,
    marginRight: 9,
    ...center,
  },

  tableCheck: {
    fontSize: 13,
    fontWeight: '900',
    color: WHITE,
  },

  tableTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    color: colors.gray900,
  },

  tableMeta: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.brandMuted,
  },

  metaStrong: {
    ...tealHeavy,
  },

  tableBox: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.brandBorder,
    backgroundColor: colors.whiteSoft,
    overflow: 'hidden',
  },

  tableHead: {
    minHeight: 40,
    backgroundColor: colors.brandMintDeep,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.brandBorder,
  },

  tableHeadRank: {
    width: 76,
    paddingLeft: 13,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: colors.gray900,
    textTransform: 'uppercase',
  },

  tableHeadUniversity: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: colors.gray900,
    textTransform: 'uppercase',
  },

  tableRow: {
    minHeight: 56,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.brandBorder,
    backgroundColor: colors.whiteSoft,
    flexDirection: 'row',
    alignItems: 'center',
  },

  rankColumn: {
    width: 76,
    paddingLeft: 12,
    paddingRight: 6,
  },

  rankPill: {
    minWidth: 38,
    height: 26,
    borderRadius: 9,
    backgroundColor: colors.brandMintDeep,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
    ...cardBorder,
    ...center,
  },

  rankPillTop: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },

  rankText: {
    fontSize: 11.5,
    lineHeight: 15,
    ...tealHeavy,
  },

  rankTextTop: {
    color: WHITE,
  },

  universityColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 5,
  },

  uniIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.brandMintDeep,
    marginRight: 8,
    ...cardBorder,
    ...center,
  },

  uniIcon: {
    fontSize: 14,
    color: colors.brandTeal,
  },

  uniTextBlock: {
    flex: 1,
  },

  universityName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    color: colors.gray900,
  },

  universitySub: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.brandMuted,
    marginTop: 1,
  },

  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 7,
    gap: 5,
  },

  rowActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: WHITE,
    ...cardBorder,
    ...center,
  },

  rowActionActive: {
    backgroundColor: colors.brandMintDeep,
    borderColor: colors.brandTeal,
  },

  rowSaveActive: {
    backgroundColor: colors.brandMintDeep,
    borderColor: colors.brandGreen,
  },

  rowActionText: {
    fontSize: 12,
    lineHeight: 15,
    ...tealHeavy,
  },

  loadingBox: {
    paddingVertical: 34,
    alignItems: 'center',
  },

  emptyBox: {
    paddingVertical: 42,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.brandBorder,
    backgroundColor: colors.whiteSoft,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.gray900,
    marginBottom: 5,
  },

  emptyText: {
    fontSize: 12,
    color: colors.brandMuted,
  },

  paginationRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pageBtn: {
    backgroundColor: colors.whiteSoft,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
    ...cardBorder,
  },

  disabledBtn: {
    opacity: 0.4,
  },

  pageBtnText: {
    fontSize: 12,
    ...tealHeavy,
  },

  pageText: {
    fontSize: 12,
    color: colors.brandMuted,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.48)',
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    backgroundColor: colors.whiteSoft,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    maxHeight: '75%',
  },

  detailsSheet: {
    backgroundColor: colors.whiteSoft,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    maxHeight: '85%',
  },

  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },

  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.gray900,
  },

  closeText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.brandMuted,
  },

  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 11,
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  optionText: {
    fontSize: 13,
    color: colors.gray900,
    fontWeight: '700',
  },

  optionCheck: {
    fontSize: 15,
    fontWeight: '900',
  },

  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  detailsHeaderText: {
    flex: 1,
  },

  detailsTitle: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
    marginBottom: 3,
    color: colors.brandTeal,
  },

  detailsCountry: {
    fontSize: 12,
    color: colors.brandMuted,
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: INPUT_BG,
    marginLeft: 10,
    ...center,
  },

  closeBtnText: {
    color: colors.brandMuted,
    fontSize: 13,
    fontWeight: '900',
  },

  detailsActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  detailActionBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 13,
    backgroundColor: WHITE,
    ...cardBorder,
    ...center,
  },

  detailActionActive: {
    backgroundColor: colors.brandMintDeep,
    borderColor: colors.brandTeal,
  },

  detailSaveActive: {
    backgroundColor: colors.brandMintDeep,
    borderColor: colors.brandGreen,
  },

  detailActionText: {
    fontSize: 12,
    ...tealHeavy,
  },

  detailBlock: {
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.gray900,
    marginBottom: 8,
  },

  detailRow: {
    backgroundColor: SOFT_WHITE,
    borderRadius: 13,
    padding: 11,
    marginBottom: 8,
    ...cardBorder,
  },

  detailKey: {
    fontSize: 10.5,
    color: colors.brandTeal,
    fontWeight: '900',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  detailValue: {
    fontSize: 13,
    color: colors.gray900,
    fontWeight: '700',
    lineHeight: 18,
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    paddingTop: 58,
    paddingHorizontal: 12,
  },

  menuCard: {
    width: 210,
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