
import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';
import { authTheme } from './authTheme';

const { width, height } = Dimensions.get('window');

const CARD_WIDTH = Math.min(width * 0.92, 390);
const IS_SMALL_HEIGHT = height < 720;
const ANDROID_STATUS_TOP =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

export const profileSetupStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: authTheme.colors.brandMint,
  },

  keyboardRoot: {
    flex: 1,
    backgroundColor: authTheme.colors.brandMint,
  },

  pageGradient: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 14 : ANDROID_STATUS_TOP + 16,
    paddingBottom: Platform.OS === 'ios' ? 18 : 26,
  },

  pageShell: {
    width: CARD_WIDTH,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.colors.brandMint,
  },

  loadingText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: authTheme.colors.brandMuted,
  },

  progressWrap: {
    width: '100%',
    marginBottom: 12,
    paddingTop: 0,
  },

  progressHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  progressLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.gray900,
  },

  progressPercent: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#DDE9E4',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: authTheme.colors.brandGreen,
  },

  card: {
    width: '100%',
    backgroundColor: authTheme.colors.whiteSoft,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    overflow: 'hidden',
    ...authTheme.shadow.card,
  },

  headerPanel: {
    backgroundColor: '#EAF7F3',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DCEEE8',
  },

  setupBadge: {
    alignSelf: 'flex-start',
    minHeight: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F7FFFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 9,
  },

  setupBadgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  headline: {
    fontSize: IS_SMALL_HEIGHT ? 18 : 19,
    lineHeight: IS_SMALL_HEIGHT ? 22 : 24,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    letterSpacing: -0.35,
    marginBottom: 10,
  },

  headlineAccent: {
    color: authTheme.colors.brandTeal,
  },

  stepsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 6,
  },

  stepBox: {
    flex: 1,
    minHeight: IS_SMALL_HEIGHT ? 72 : 78,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    position: 'relative',
  },

  stepBoxActive: {
    backgroundColor: authTheme.colors.brandGreen,
    borderColor: authTheme.colors.brandGreen,
  },

  stepBoxDone: {
    backgroundColor: '#F8FFFC',
    borderColor: authTheme.colors.brandBorder,
  },

  doneBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 15,
    height: 15,
    borderRadius: 999,
    backgroundColor: authTheme.colors.brandTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  doneBadgeText: {
    fontSize: 9,
    lineHeight: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  stepIconBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#EFF6F3',
    borderWidth: 1,
    borderColor: '#DCEEE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  stepIconBoxActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.25)',
  },

  stepIcon: {
    fontSize: 12,
    lineHeight: 14,
  },

  stepNumber: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '800',
    color: '#7A879A',
    marginBottom: 1,
    textAlign: 'center',
  },

  stepName: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textAlign: 'center',
  },

  stepTextActive: {
    color: '#FFFFFF',
  },

  formPanel: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: authTheme.colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  sectionIcon: {
    fontSize: 14,
    lineHeight: 16,
    color: '#FFFFFF',
  },

  sectionTitle: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    letterSpacing: -0.3,
  },

  alertWrap: {
    marginBottom: 8,
  },

  inputGroup: {
    width: '100%',
    marginBottom: 10,
  },

  inputLabel: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '800',
    color: authTheme.colors.gray900,
    marginBottom: 6,
  },

  optionalText: {
    color: '#94A3B8',
    fontWeight: '700',
  },

  textInput: {
    width: '100%',
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#D7DDE5',
    backgroundColor: '#F7F9FB',
    paddingHorizontal: 12,
    fontSize: 14,
    color: authTheme.colors.gray900,
    fontWeight: '600',
    paddingVertical: Platform.OS === 'ios' ? 8 : 5,
  },

  disabledInput: {
    opacity: 0.72,
    backgroundColor: '#F3F4F6',
  },

  amountInputWrap: {
    width: '100%',
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#D7DDE5',
    backgroundColor: '#F7F9FB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  amountPrefix: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    marginRight: 10,
  },

  amountInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: authTheme.colors.gray900,
    fontWeight: '700',
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },

  testCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFE8D8',
    backgroundColor: '#F6FBF9',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    marginTop: 2,
    marginBottom: 10,
  },

  testTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    marginBottom: 10,
  },

  addButtonOuter: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 4,
    ...authTheme.shadow.button,
  },

  addButton: {
    width: '100%',
    minHeight: 41,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  addButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  addedTestsWrap: {
    marginTop: 8,
    gap: 7,
  },

  testChip: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#BFE8D8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  testChipTextBlock: {
    flex: 1,
    paddingRight: 8,
  },

  testChipName: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    marginBottom: 1,
  },

  testChipScore: {
    fontSize: 11,
    lineHeight: 14,
    color: authTheme.colors.brandMuted,
  },

  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeBtnText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '900',
    color: '#B91C1C',
  },

  countryHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  clearText: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  infoBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFE8D8',
    backgroundColor: '#EAF7F3',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 10,
  },

  infoText: {
    fontSize: 11,
    lineHeight: 16,
    color: authTheme.colors.brandMuted,
  },

  priorityBlock: {
    width: '100%',
    marginBottom: 10,
  },

  lockedPriority: {
    opacity: 0.72,
  },

  priorityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  priorityLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 7,
    backgroundColor: authTheme.colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  priorityBadgeText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  priorityLabel: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '800',
    color: authTheme.colors.gray900,
  },

  navRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7E5DF',
    backgroundColor: '#F8FBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hiddenBackButton: {
    opacity: 0,
  },

  backButtonText: {
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    marginTop: -1,
  },

  nextButtonOuter: {
    minWidth: 88,
    borderRadius: 15,
    overflow: 'hidden',
    ...authTheme.shadow.button,
  },

  nextButton: {
    minHeight: 41,
    borderRadius: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  nextButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  nextButtonArrow: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 6,
  },

  disabledButton: {
    opacity: 0.72,
  },
});