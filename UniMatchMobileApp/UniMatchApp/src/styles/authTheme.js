
// src/styles/authTheme.js

export const authTheme = {
  colors: {
    brandMint: '#EFFFF8',
    brandMintDeep: '#DFFBF0',
    brandCyanSoft: '#E8FAFF',

    brandTealDark: '#0F766E',
    brandTeal: '#0D9488',
    brandGreen: '#22C55E',
    brandGreenDark: '#16A34A',

    brandBorder: '#BCEAD8',
    brandMuted: '#64748B',

    white: '#FFFFFF',
    whiteSoft: '#FFFFFFF2',

    gray50: '#F8FAFC',
    gray100: '#F1F5F9',
    gray200: '#E2E8F0',
    gray300: '#CBD5E1',
    gray500: '#64748B',
    gray700: '#334155',
    gray900: '#0F172A',

    errorBg: '#FEF2F2',
    errorText: '#B91C1C',
    errorBorder: '#FECACA',

    successBg: '#F0FDF4',
    successText: '#15803D',
    successBorder: '#BBF7D0',
  },

  gradients: {
    page: ['#EFFFF8', '#FFFFFF', '#E8FAFF'],
    button: ['#0D9488', '#22C55E'],
    buttonPressed: ['#0F766E', '#16A34A'],
    brandText: ['#0D9488', '#22C55E'],
  },

  radius: {
    card: 28,
    logo: 18,
    input: 13,
    button: 13,
    pill: 999,
  },

  shadow: {
    card: {
      shadowColor: '#0F766E',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 10,
    },

    button: {
      shadowColor: '#0F766E',
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.24,
      shadowRadius: 10,
      elevation: 5,
    },

    soft: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
  },
};