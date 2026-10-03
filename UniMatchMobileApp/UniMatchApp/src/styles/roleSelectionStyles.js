
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { authTheme } from './authTheme';

const { width, height } = Dimensions.get('window');

const CARD_WIDTH = Math.min(width * 0.88, 365);
const IS_SMALL_HEIGHT = height < 720;

export const roleSelectionStyles = StyleSheet.create({
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
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 4 : 2,
    paddingBottom: Platform.OS === 'ios' ? 10 : 14,
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: authTheme.colors.whiteSoft,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    paddingHorizontal: 15,
    paddingTop: IS_SMALL_HEIGHT ? 8 : 10,
    paddingBottom: IS_SMALL_HEIGHT ? 12 : 14,
    overflow: 'hidden',
    ...authTheme.shadow.card,
  },

  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: IS_SMALL_HEIGHT ? 10 : 12,
  },

  logoWrap: {
    width: IS_SMALL_HEIGHT ? 38 : 42,
    height: IS_SMALL_HEIGHT ? 38 : 42,
    borderRadius: 13,
    backgroundColor: authTheme.colors.brandMintDeep,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...authTheme.shadow.soft,
  },

  logoImage: {
    width: IS_SMALL_HEIGHT ? 32 : 36,
    height: IS_SMALL_HEIGHT ? 32 : 36,
  },

  badge: {
    minHeight: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  badgeText: {
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  headline: {
    fontSize: IS_SMALL_HEIGHT ? 18 : 19,
    lineHeight: IS_SMALL_HEIGHT ? 22 : 24,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 5,
  },

  highlightText: {
    color: authTheme.colors.brandTeal,
  },

  subtitle: {
    maxWidth: 280,
    fontSize: 11.5,
    lineHeight: 16,
    color: authTheme.colors.brandMuted,
    textAlign: 'center',
  },

  roleList: {
    width: '100%',
    gap: 8,
  },

  roleCard: {
    width: '100%',
    minHeight: IS_SMALL_HEIGHT ? 72 : 78,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  roleIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.brandMintDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  roleIcon: {
    fontSize: 16,
  },

  roleTextBlock: {
    flex: 1,
  },

  roleTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    marginBottom: 2,
  },

  roleDescription: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
    color: authTheme.colors.brandMuted,
    marginBottom: 4,
  },

  selectText: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
  },

  selectedBox: {
    marginTop: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  selectedText: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textAlign: 'center',
  },

  alertWrap: {
    marginTop: 8,
  },

  continueButtonOuter: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
    ...authTheme.shadow.button,
  },

  continueButton: {
    width: '100%',
    minHeight: IS_SMALL_HEIGHT ? 40 : 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueButtonDisabled: {
    opacity: 0.72,
  },

  continueButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.white,
  },
});