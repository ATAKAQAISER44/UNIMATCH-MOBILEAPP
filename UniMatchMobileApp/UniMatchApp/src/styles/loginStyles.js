
// src/styles/loginStyles.js

import { StyleSheet, Dimensions, Platform } from 'react-native';
import { authTheme } from './authTheme';

const { height } = Dimensions.get('window');

const IS_SMALL_HEIGHT = height < 720;

export const loginStyles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  pageGradient: {
    flex: 1,
  },

  page: {
    flex: 1,
  },

  pageContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 16 : 14,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },

  card: {
    // Follows the live window size (rotation, foldables, split screen).
    width: '92%',
    maxWidth: 440,
    backgroundColor: authTheme.colors.whiteSoft,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    overflow: 'hidden',
    ...authTheme.shadow.card,
  },

  cardInner: {
    width: '100%',
    paddingHorizontal: 15,
    paddingTop: IS_SMALL_HEIGHT ? 8 : 9,
    paddingBottom: IS_SMALL_HEIGHT ? 12 : 14,
    alignItems: 'center',
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
    marginBottom: 3,
    ...authTheme.shadow.soft,
  },

  logoImage: {
    width: IS_SMALL_HEIGHT ? 32 : 36,
    height: IS_SMALL_HEIGHT ? 32 : 36,
  },

  brandName: {
    fontSize: IS_SMALL_HEIGHT ? 16 : 17,
    lineHeight: IS_SMALL_HEIGHT ? 19 : 21,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    textAlign: 'center',
    marginBottom: IS_SMALL_HEIGHT ? 8 : 10,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: authTheme.colors.brandMuted,
    textAlign: 'center',
    marginBottom: 0,
  },

  googleButton: {
    width: '100%',
    minHeight: IS_SMALL_HEIGHT ? 40 : 43,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: '#F3F6FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    marginBottom: IS_SMALL_HEIGHT ? 8 : 9,
  },

  googleButtonDisabled: {
    opacity: 0.72,
  },

  googleIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: authTheme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7DDE5',
  },

  googleIcon: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  googleText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: authTheme.colors.gray900,
  },

  divider: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: IS_SMALL_HEIGHT ? 8 : 9,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: authTheme.colors.gray200,
  },

  dividerText: {
    fontSize: 10.5,
    lineHeight: 13,
    color: authTheme.colors.brandMuted,
    marginHorizontal: 8,
    fontWeight: '600',
  },

  form: {
    width: '100%',
  },

  alertWrap: {
    marginBottom: 5,
  },

  field: {
    width: '100%',
    marginBottom: IS_SMALL_HEIGHT ? 5 : 6,
  },

  label: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: authTheme.colors.gray900,
    marginBottom: 3,
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

  passwordInputWrap: {
    width: '100%',
    minHeight: IS_SMALL_HEIGHT ? 38 : 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: '#F3F6FA',
    paddingLeft: 11,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    minHeight: IS_SMALL_HEIGHT ? 38 : 40,
    fontSize: 13,
    color: authTheme.colors.gray900,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 7 : 4,
    paddingRight: 6,
  },

  showText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -2,
    marginBottom: IS_SMALL_HEIGHT ? 5 : 6,
  },

  forgotText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  loginButtonOuter: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: IS_SMALL_HEIGHT ? 3 : 4,
    ...authTheme.shadow.button,
  },

  loginButton: {
    width: '100%',
    minHeight: IS_SMALL_HEIGHT ? 40 : 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonDisabled: {
    opacity: 0.72,
  },

  loginText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.white,
  },

  signupRow: {
    marginTop: IS_SMALL_HEIGHT ? 6 : 7,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  signupText: {
    fontSize: 12,
    lineHeight: 15,
    color: authTheme.colors.brandMuted,
  },

  signupLink: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },
});