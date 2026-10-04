
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { authTheme } from './authTheme';

const { height } = Dimensions.get('window');

const IS_SMALL_HEIGHT = height < 720;

export const signUpStyles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
    backgroundColor: authTheme.colors.brandMint,
  },

  pageGradient: {
    flex: 1,
  },

  safeArea: {
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
    paddingTop: IS_SMALL_HEIGHT ? 7 : 9,
    paddingBottom: IS_SMALL_HEIGHT ? 10 : 12,
    overflow: 'hidden',
    ...authTheme.shadow.card,
  },

  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
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
    marginBottom: 2,
  },

  form: {
    width: '100%',
  },

  alertWrap: {
    marginBottom: 6,
  },

  fieldWrapper: {
    width: '100%',
    marginBottom: IS_SMALL_HEIGHT ? 6 : 7,
  },

  twoColumnRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 8,
  },

  halfField: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: authTheme.colors.gray900,
    marginBottom: 4,
  },

  inputShell: {
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

  input: {
    flex: 1,
    minHeight: IS_SMALL_HEIGHT ? 38 : 40,
    fontSize: 13,
    color: authTheme.colors.gray900,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 7 : 4,
  },

  inputWithRight: {
    paddingRight: 6,
  },

  showBtnText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  strengthWrapper: {
    width: '100%',
    marginTop: -2,
    marginBottom: IS_SMALL_HEIGHT ? 6 : 7,
  },

  strengthTrack: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    backgroundColor: authTheme.colors.gray200,
    overflow: 'hidden',
    marginBottom: 4,
  },

  strengthFill: {
    height: '100%',
    borderRadius: 999,
  },

  strengthInfoRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 6,
  },

  passwordHint: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 12,
    color: authTheme.colors.brandMuted,
  },

  strengthLabel: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '900',
    textAlign: 'right',
  },

  selectBox: {
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
    justifyContent: 'space-between',
  },

  selectText: {
    flex: 1,
    fontSize: 13,
    color: authTheme.colors.gray900,
    fontWeight: '500',
  },

  selectPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: '#8A9AB0',
    fontWeight: '500',
  },

  selectArrow: {
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '700',
    color: authTheme.colors.brandMuted,
    marginLeft: 5,
  },

  selectRightArea: {
    minWidth: 34,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#D7DDE5',
    marginVertical: 7,
    marginRight: 8,
  },

  disabledInput: {
    opacity: 0.72,
  },

  signupButtonOuter: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: IS_SMALL_HEIGHT ? 4 : 5,
    ...authTheme.shadow.button,
  },

  signupButton: {
    width: '100%',
    minHeight: IS_SMALL_HEIGHT ? 40 : 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  signupButtonDisabled: {
    opacity: 0.72,
  },

  signupButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.white,
  },

  loginRow: {
    marginTop: IS_SMALL_HEIGHT ? 7 : 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginText: {
    fontSize: 12,
    lineHeight: 15,
    color: authTheme.colors.brandMuted,
  },

  loginLink: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  dateDoneBtn: {
    alignSelf: 'flex-end',
    marginTop: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: authTheme.colors.brandMintDeep,
  },

  dateDoneText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
    backgroundColor: authTheme.colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 9,
    ...authTheme.shadow.card,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  modalTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: authTheme.colors.gray900,
  },

  modalClose: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  optionItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 5,
    backgroundColor: authTheme.colors.white,
  },

  optionItemActive: {
    backgroundColor: authTheme.colors.brandMintDeep,
  },

  optionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: authTheme.colors.gray700,
  },

  optionTextActive: {
    color: authTheme.colors.brandTeal,
    fontWeight: '900',
  },

  emptyText: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 13,
    color: authTheme.colors.brandMuted,
  },
});