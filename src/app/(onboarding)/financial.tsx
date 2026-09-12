import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Button, Input, WalletTypeCard, ErrorBanner } from '../../components/ui';
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
        return 'Cash Wallet';
      case 'bank':
        return 'Main Bank Account';
      case 'card':
        return 'Primary Card';
    }
  };

  const handleFinish = async () => {
    const numericIncome = parseFloat(monthlyIncome.replace(/[^0-9.]/g, ''));

    if (isNaN(numericIncome) || numericIncome <= 0) {
      setError('Please enter a valid monthly income / default budget');
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
      router.replace('/(app)');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to complete financial setup'));
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
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={[Typography.bodyMedium, { color: theme.primary }]}>← Back</Text>
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.stepsRow}>
              <View style={[styles.stepBar, { backgroundColor: theme.primary }]} />
              <View style={[styles.stepBar, { backgroundColor: theme.primary }]} />
            </View>
            <Text style={[Typography.caption, { color: theme.textTertiary, marginTop: Spacing.xs }]}>
              STEP 2 OF 2: FINANCIAL SETUP
            </Text>
          </View>

          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={[Typography.title1, styles.title, { color: theme.textPrimary }]}>
              Set up your wallet & budget
            </Text>
            <Text style={[Typography.body, styles.subtitle, { color: theme.textSecondary }]}>
              Choose your primary funding source and set your estimated monthly income.
            </Text>
          </View>

          {error ? (
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          ) : null}

          {/* Wallet Type Section */}
          <View style={styles.sectionHeader}>
            <Text style={[Typography.subhead, { color: theme.textSecondary, fontWeight: '600' }]}>
              SELECT PRIMARY WALLET TYPE *
            </Text>
          </View>

          <WalletTypeCard
            type="bank"
            title="Bank Account"
            description="Checking or savings account for salary & transfers"
            selected={walletType === 'bank'}
            onSelect={() => setWalletType('bank')}
          />

          <WalletTypeCard
            type="cash"
            title="Cash"
            description="Physical cash on hand for day-to-day spending"
            selected={walletType === 'cash'}
            onSelect={() => setWalletType('cash')}
          />

          <WalletTypeCard
            type="card"
            title="Card"
            description="Debit or credit card for daily purchases & online pay"
            selected={walletType === 'card'}
            onSelect={() => setWalletType('card')}
          />

          {/* Monthly Income / Budget Input */}
          <View style={styles.budgetInputContainer}>
            <Input
              label="Estimated Monthly Income / Budget *"
              placeholder="e.g. 5000"
              value={monthlyIncome}
              onChangeText={(text) => {
                setMonthlyIncome(text);
                if (error) setError(null);
              }}
              keyboardType="decimal-pad"
              prefix={
                <Text style={[Typography.title3, { color: theme.textSecondary, marginRight: 2 }]}>
                  $
                </Text>
              }
              helperText="This sets your default monthly budget to benchmark your savings."
              editable={!loading}
            />
          </View>

          <Button
            title="Finish Setup & Enter App"
            onPress={handleFinish}
            loading={loading}
            disabled={!monthlyIncome.trim()}
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
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
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
    lineHeight: 22,
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
