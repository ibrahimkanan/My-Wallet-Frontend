import { getStrings, interpolate } from '../i18n';
import { useLanguageStore } from '../store/languageStore';

/**
 * Dynamic localized strings proxy that resolves to the currently selected language
 * (English by default, Arabic when toggled).
 */
export const Strings = {
  get common() {
    return getStrings().common;
  },

  get auth() {
    const s = getStrings().auth;
    return {
      ...s,
      waitCooldown: (seconds: number) => interpolate(s.waitCooldown, { seconds }),
      rateLimitWarning: (seconds: number) => interpolate(s.rateLimitWarning, { seconds }),
      resendIn: (seconds: number) => interpolate(s.resendIn, { seconds }),
    };
  },

  get onboarding() {
    return getStrings().onboarding;
  },

  get dashboard() {
    const s = getStrings().dashboard;
    const isAr = useLanguageStore.getState().language === 'ar';
    return {
      ...s,
      greeting: (name?: string | null) =>
        name ? interpolate(s.greeting, { name }) : s.greetingGuest,
      accountsUnit: (count: number) => {
        if (isAr) {
          if (count === 1) return s.accountOne;
          if (count === 2) return s.accountTwo;
          return interpolate(s.accountMultiple, { count });
        }
        return count === 1 ? s.accountOne : interpolate(s.accountMultiple, { count });
      },
      accountTypeSuffix: (type: string) => {
        switch (type) {
          case 'bank':
            return s.accountTypeBank;
          case 'cash':
            return s.accountTypeCash;
          case 'card':
            return s.accountTypeCard;
          default:
            return s.accountTypeDefault;
        }
      },
    };
  },

  get tabs() {
    return getStrings().tabs;
  },

  get home() {
    const s = getStrings().home;
    return {
      ...s,
      greetingWelcome: (name?: string | null) =>
        name ? interpolate(s.greetingWelcome, { name }) : s.greetingWelcomeGuest,
      overBudgetWarning: (amount: string) => interpolate(s.overBudgetWarning, { amount }),
      budgetUsagePercent: (percent: number) => interpolate(s.budgetUsagePercent, { percent }),
    };
  },

  get placeholders() {
    return getStrings().placeholders;
  },

  get wallets() {
    const s = getStrings().wallets;
    return {
      ...s,
      deleteWalletWarningBody: (name: string) =>
        interpolate(s.deleteWalletWarningBody, { name }),
    };
  },

  get categories() {
    const s = getStrings().categories;
    return {
      ...s,
      deleteCategoryNoticeBody: (name: string) =>
        interpolate(s.deleteCategoryNoticeBody, { name }),
    };
  },

  get settings() {
    return getStrings().settings;
  },

  get transactionForm() {
    return getStrings().transactionForm;
  },

  get transactions() {
    const s = getStrings().transactions;
    return {
      ...s,
      deleteConfirmBody: (amount: string, walletName?: string) =>
        walletName
          ? interpolate(s.deleteConfirmBody, { amount, walletName })
          : interpolate(s.deleteConfirmBodyNoWallet, { amount }),
      showingResults: (count: number) => interpolate(s.showingResults, { count }),
    };
  },

  get budgets() {
    const s = getStrings().budgets;
    return {
      ...s,
      deleteConfirmBody: (name: string) => interpolate(s.deleteConfirmBody, { name }),
      spentOf: (spent: string, budgeted: string) => interpolate(s.spentOf, { spent, budgeted }),
      spentPercentage: (percent: number) => interpolate(s.spentPercentage, { percent }),
      overBudgetBy: (amount: string) => interpolate(s.overBudgetBy, { amount }),
      budgetsCount: (count: number) => interpolate(s.budgetsCount, { count }),
    };
  },

  get charts() {
    const s = getStrings().charts;
    return {
      ...s,
      monthDetails: (month: string) => interpolate(s.monthDetails, { month }),
      percentOfExpenses: (percent: number) => interpolate(s.percentOfExpenses, { percent }),
    };
  },

  get dates() {
    return getStrings().dates;
  },
};

export default Strings;
