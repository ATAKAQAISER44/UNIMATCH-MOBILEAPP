
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { authTheme } from './authTheme';

const { width, height } = Dimensions.get('window');

const CARD_WIDTH = Math.min(width * 0.88, 365);
const IS_SMALL_HEIGHT = height < 720;
const OTP_BOX_SIZE = width < 370 ? 28 : 31;

export const otpVerificationStyles = StyleSheet.create({
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

  emailText: {
    maxWidth: 270,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: authTheme.colors.brandTeal,
    textAlign: 'center',
  },

  form: {
    width: '100%',
  },

  alertWrap: {
    marginBottom: 6,
  },

  otpRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: IS_SMALL_HEIGHT ? 10 : 12,
  },

  otpInput: {
    width: OTP_BOX_SIZE,
    height: IS_SMALL_HEIGHT ? 38 : 40,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: '#F3F6FA',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    paddingVertical: 0,
  },

  mainButtonOuter: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: IS_SMALL_HEIGHT ? 4 : 5,
    ...authTheme.shadow.button,
  },

  mainButton: {
    width: '100%',
    minHeight: IS_SMALL_HEIGHT ? 40 : 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainButtonDisabled: {
    opacity: 0.72,
  },

  mainButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.white,
  },

  resendRow: {
    marginTop: IS_SMALL_HEIGHT ? 8 : 9,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resendText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  backRow: {
    marginTop: 7,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
  },
});