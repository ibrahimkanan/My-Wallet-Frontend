import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, Radii } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Button, Input, WalletTypeCard, ErrorBanner, BackButton } from '../../components/ui';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { WalletType } from '../../types/models';
import { UpdateProfileResponse } from '../../types/api';
import { getErrorMessage } from '../../utils/errors';

export default function OnboardingFinancialScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [walletType, setWalletType] = useState<WalletType>('bank');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDefaultWalletName = (type: WalletType): string => {
    switch (type) {
      case 'cash':
        return Strings.onboarding.defaultWalletNames.cash;
      case 'bank':
        return Strings.onboarding.defaultWalletNames.bank;
      case 'card':
        return Strings.onboarding.defaultWalletNames.card;
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/profile');
    }
  };

  const handleFinish = async () => {
    const numericIncome = parseFloat(monthlyIncome.replace(/[^0-9.]/g, ''));

    if (isNaN(numericIncome) || numericIncome <= 0) {
      setError(Strings.onboarding.incomeRequiredError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create primary wallet: POST /wallets body: { name, type }
      const walletName = getDefaultWalletName(walletType);
      await api.post('/wallets', {
        name: walletName,
        type: walletType,
      });

      // 2. Set default monthly budget on user profile: PATCH /users/me
      const profileRes = await api.patch<UpdateProfileResponse>('/users/me', {
        default_monthly_budget: numericIncome,
      });

      // 3. Update store
      await setUser({
        ...profileRes.data.user,
        default_monthly_budget: numericIncome,
      });

      // 4. Navigate into main application
      router.replace('/');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'فشل إتمام الإعداد المالي'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* RTL-Safe Back Button */}
          <BackButton
            onPress={handleBack}
            disabled={loading}
            style={styles.backButton}
          />

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.stepsRow}>
              <View style={[styles.stepBar, { backgroundColor: theme.primary }]} />
              <View style={[styles.stepBar, { backgroundColor: theme.primary }]} />
            </View>
            <Text
              style={[
                Typography.caption,
                { color: theme.textTertiary, marginTop: Spacing.xs, textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            >
              {Strings.onboarding.financialStepIndicator}
            </Text>
          </View>

          {/* Header */}
          <View style={styles.headerSection}>
            <Text
              style={[
                Typography.title1,
                styles.title,
                { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            >
              {Strings.onboarding.financialTitle}
            </Text>
            <Text
              style={[
                Typography.body,
                styles.subtitle,
                { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            >
              {Strings.onboarding.financialSubtitle}
            </Text>
          </View>

          {error ? (
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          ) : null}

          {/* Wallet Type Section */}
          <View style={styles.sectionHeader}>
            <Text
              style={[
                Typography.subhead,
                {
                  color: theme.textSecondary,
                  fontWeight: '600',
                  textAlign: I18nManager.isRTL ? 'right' : 'left',
                },
              ]}
            >
              {Strings.onboarding.selectWalletTypeLabel}
            </Text>
          </View>

          <WalletTypeCard
            type="bank"
            title={Strings.onboarding.walletBankTitle}
            description={Strings.onboarding.walletBankDesc}
            selected={walletType === 'bank'}
            onSelect={() => setWalletType('bank')}
            disabled={loading}
          />

          <WalletTypeCard
            type="cash"
            title={Strings.onboarding.walletCashTitle}
            description={Strings.onboarding.walletCashDesc}
            selected={walletType === 'cash'}
            onSelect={() => setWalletType('cash')}
            disabled={loading}
          />

          <WalletTypeCard
            type="card"
            title={Strings.onboarding.walletCardTitle}
            description={Strings.onboarding.walletCardDesc}
            selected={walletType === 'card'}
            onSelect={() => setWalletType('card')}
            disabled={loading}
          />

          {/* Monthly Income / Budget Input */}
          <View style={styles.budgetInputContainer}>
            <Input
              label={Strings.onboarding.monthlyIncomeLabel}
              placeholder={Strings.onboarding.monthlyIncomePlaceholder}
              value={monthlyIncome}
              onChangeText={(text) => {
                setMonthlyIncome(text);
                if (error) setError(null);
              }}
              keyboardType="decimal-pad"
              prefix={
                <Text style={[Typography.bodyMedium, { color: theme.textSecondary, marginEnd: 4 }]}>
                  {Strings.common.currency}
                </Text>
              }
              helperText={Strings.onboarding.monthlyIncomeHelper}
              editable={!loading}
            />
          </View>

          <Button
            title={Strings.onboarding.finishSetupButton}
            onPress={handleFinish}
            loading={loading}
            disabled={!monthlyIncome.trim() || loading}
            style={styles.finishButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.md,
  },
  progressContainer: {
    marginBottom: Spacing.xl,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    lineHeight: 24,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  budgetInputContainer: {
    marginTop: Spacing.md,
  },
  finishButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
});
