/**
 * My Wallet Design System & Visual Identity
 *
 * DESIGN PHILOSOPHY: "Botanical Wealth & Quiet Luxury"
 * - Escapes the fintech cliché of sterile corporate blue and stressful neon crypto colors.
 * - Primary: Deep Juniper Emerald & Nordic Pine — projects grounded growth, stability, and tranquility.
 * - Accent: Warm Champagne Gold — adds a tactile, sovereign, premium edge to highlights and card badges.
 * - Semantic Outflows: Carmine Rose / Terracotta Coral — distinct and legible without causing anxiety.
 * - Semantic Inflows: Crisp Lush Mint/Jade — rewarding and clear.
 * - Tabular Typography: Explicit tabular-nums variant presets to prevent financial numbers from jittering.
 */

import { Platform, StyleSheet, TextStyle } from 'react-native';

export const BrandColors = {
  // Primary Pine & Emerald spectrum
  pine900: '#042F27',
  pine800: '#07483C',
  pine700: '#0B6454',
  pine600: '#0E7465', // Main Primary brand color
  pine500: '#109381',
  pine400: '#14B8A6',
  pine300: '#5EEAD4',
  pine100: '#CCFBF1',
  pine50: '#F0FDFA',

  // Champagne Gold accent spectrum
  gold700: '#8A691E',
  gold600: '#B08826',
  gold500: '#D4AF37', // Main Gold Accent
  gold400: '#E5C578',
  gold300: '#F3DFC1',
  gold100: '#FDF7E7',

  // Terracotta / Carmine Rose (Expense / Outflow)
  rose600: '#BE123C',
  rose500: '#E11D48', // Main Expense color
  rose400: '#F43F5E',
  rose100: '#FFE4E6',
  rose50: '#FFF1F2',

  // Lush Jade (Income / Inflow)
  jade600: '#047857',
  jade500: '#059669', // Main Income color
  jade400: '#10B981',
  jade100: '#D1FAE5',
  jade50: '#ECFDF5',

  // Amber (Warning / Budget Alert)
  amber600: '#D97706',
  amber500: '#F59E0B',
  amber100: '#FEF3C7',
  amber50: '#FFFBEB',
};

export const ThemeColors = {
  light: {
    // Core template compatibility
    text: '#111816',
    background: '#F8FAF9', // Warm botanical alabaster
    backgroundElement: '#F1F5F3',
    backgroundSelected: '#E3ECE7',
    textSecondary: '#4F615A',

    // Brand
    primary: BrandColors.pine600,
    primaryHover: BrandColors.pine700,
    primaryMuted: BrandColors.pine100,
    accent: BrandColors.gold500,
    accentMuted: BrandColors.gold100,

    // Surfaces & Canvas
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSubtle: '#F1F5F3',
    surfaceSelected: '#E3ECE7',

    // Borders & Dividers
    border: '#E3ECE7',
    borderSubtle: '#EFF4F1',
    borderFocus: BrandColors.pine600,

    // Typography
    textPrimary: '#111816',
    textTertiary: '#869891',
    textInverse: '#FFFFFF',
    textBrand: BrandColors.pine600,

    // Semantics
    income: BrandColors.jade500,
    incomeBg: BrandColors.jade50,
    incomeBorder: BrandColors.jade100,

    expense: BrandColors.rose500,
    expenseBg: BrandColors.rose50,
    expenseBorder: BrandColors.rose100,

    warning: BrandColors.amber500,
    warningBg: BrandColors.amber50,
    warningBorder: BrandColors.amber100,

    cardOverlay: 'rgba(255, 255, 255, 0.85)',
    modalBackdrop: 'rgba(10, 15, 13, 0.45)',
  },
  dark: {
    // Core template compatibility
    text: '#F3F6F4',
    background: '#090D0C', // Deep Obsidian Pine
    backgroundElement: '#17221E',
    backgroundSelected: '#253731',
    textSecondary: '#9CB0A8',

    // Brand
    primary: BrandColors.pine400,
    primaryHover: BrandColors.pine300,
    primaryMuted: 'rgba(20, 184, 166, 0.16)',
    accent: BrandColors.gold400,
    accentMuted: 'rgba(229, 197, 120, 0.16)',

    // Surfaces & Canvas
    surface: '#111816',
    surfaceElevated: '#17221E',
    surfaceSubtle: '#1E2C27',
    surfaceSelected: '#253731',

    // Borders & Dividers
    border: '#20312B',
    borderSubtle: '#16221E',
    borderFocus: BrandColors.pine400,

    // Typography
    textPrimary: '#F3F6F4',
    textTertiary: '#5C7168',
    textInverse: '#090D0C',
    textBrand: BrandColors.pine400,

    // Semantics
    income: BrandColors.jade400,
    incomeBg: 'rgba(16, 185, 129, 0.14)',
    incomeBorder: 'rgba(16, 185, 129, 0.28)',

    expense: BrandColors.rose400,
    expenseBg: 'rgba(244, 63, 94, 0.14)',
    expenseBorder: 'rgba(244, 63, 94, 0.28)',

    warning: BrandColors.amber500,
    warningBg: 'rgba(245, 158, 11, 0.14)',
    warningBorder: 'rgba(245, 158, 11, 0.28)',

    cardOverlay: 'rgba(17, 24, 22, 0.85)',
    modalBackdrop: 'rgba(0, 0, 0, 0.70)',
  },
} as const;

// Colors export matching template expectations
export const Colors = ThemeColors;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorTheme = typeof ThemeColors.light;
export type ColorThemeName = keyof typeof ThemeColors;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/**
 * Modern Spacing System (8pt base grid with 4pt half-steps)
 */
export const Spacing = {
  // Classic template aliases
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,

  // Semantic modern scale
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Fluid, refined border-radii
 */
export const Radii = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const Typography = StyleSheet.create({
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
  } as TextStyle,
  title1: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,
  title2: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.3,
  } as TextStyle,
  title3: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.2,
  } as TextStyle,
  headline: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.1,
  } as TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
  } as TextStyle,
  bodyMedium: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  } as TextStyle,
  callout: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '400',
  } as TextStyle,
  subhead: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  } as TextStyle,
  footnote: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } as TextStyle,
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  } as TextStyle,
  overline: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  } as TextStyle,

  // Specialized Financial Typography (Tabular Figures)
  moneyHero: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  } as TextStyle,
  moneyLarge: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  } as TextStyle,
  moneyRegular: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  moneySmall: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  } as TextStyle,
});

/**
 * Elevation & Layering Shadows
 */
export const Shadows = StyleSheet.create({
  subtle: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: {
      elevation: 1,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
  }),
  card: Platform.select({
    ios: {
      shadowColor: '#0B1C16',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
    },
    android: {
      elevation: 3,
    },
    default: {
      shadowColor: '#0B1C16',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
    },
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#0B1C16',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: '#0B1C16',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
  }),
});
