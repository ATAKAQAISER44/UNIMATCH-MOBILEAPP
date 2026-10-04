


import { StyleSheet, Dimensions, Platform } from 'react-native';
import { authTheme } from './authTheme';

const { height } = Dimensions.get('window');

const IS_SMALL_HEIGHT = height < 720;

export const forgotPasswordStyles = StyleSheet.create({
  keyboardView: {
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
    // Follows the live window size (rotation, foldables, split screen).
    width: '92%',
    maxWidth: 440,
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
    marginBottom: 4,
    ...authTheme.shadow.soft,
  },

  logoImage: {
    width: IS_SMALL_HEIGHT ? 32 : 36,
    height: IS_SMALL_HEIGHT ? 32 : 36,
  },

  brandText: {
    fontSize: IS_SMALL_HEIGHT ? 16 : 17,
    lineHeight: IS_SMALL_HEIGHT ? 19 : 21,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textAlign: 'center',
    marginBottom: IS_SMALL_HEIGHT ? 8 : 9,
  },

  headline: {
    fontSize: IS_SMALL_HEIGHT ? 19 : 21,
    lineHeight: IS_SMALL_HEIGHT ? 23 : 25,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 5,
  },

  subtitle: {
    maxWidth: 270,
    fontSize: 12,
    lineHeight: 16,
    color: authTheme.colors.brandMuted,
    textAlign: 'center',
  },

  form: {
    width: '100%',
  },

  alertWrap: {
    marginBottom: 6,
  },

  field: {
    width: '100%',
    marginBottom: IS_SMALL_HEIGHT ? 6 : 7,
  },

  label: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: authTheme.colors.gray900,
    marginBottom: 4,
  },

  input: {
    width: '100%',
    minHeight: IS_SMALL_HEIGHT ? 38 : 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: '#F3F6FA',
    paddingHorizontal: 11,
    fontSize: 13,
    color: authTheme.colors.gray900,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 7 : 4,
  },

  sendButtonOuter: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: IS_SMALL_HEIGHT ? 4 : 5,
    ...authTheme.shadow.button,
  },

  sendButton: {
    width: '100%',
    minHeight: IS_SMALL_HEIGHT ? 40 : 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.72,
  },

  sendButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.white,
  },

  backRow: {
    marginTop: IS_SMALL_HEIGHT ? 8 : 9,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backMutedText: {
    fontSize: 12,
    lineHeight: 15,
    color: authTheme.colors.brandMuted,
  },

  backText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },
});