import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Button, Input, ErrorBanner } from '../../components/ui';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { UpdateProfileResponse } from '../../types/api';
import { getErrorMessage } from '../../utils/errors';

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your full name');
      return;
    }

    if (password && password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Backend: PATCH /users/me  body: { name?, password? }
      const payload: { name: string; password?: string } = {
        name: trimmedName,
      };
      if (password) {
        payload.password = password;
      }

      const response = await api.patch<UpdateProfileResponse>('/users/me', payload);

      // Update user in Zustand store & SecureStore
      await setUser(response.data.user);

      // Navigate to Step 2: Financial Setup
      router.push('/(onboarding)/financial');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update profile'));
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
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.stepsRow}>
              <View style={[styles.stepBar, { backgroundColor: theme.primary }]} />
              <View style={[styles.stepBar, { backgroundColor: theme.border }]} />
            </View>
            <Text style={[Typography.caption, { color: theme.textTertiary, marginTop: Spacing.xs }]}>
              STEP 1 OF 2: PROFILE
            </Text>
          </View>

          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={[Typography.title1, styles.title, { color: theme.textPrimary }]}>
              Tell us about yourself
            </Text>
            <Text style={[Typography.body, styles.subtitle, { color: theme.textSecondary }]}>
              Set up your profile to personalize your wallet experience.
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.card,
              Shadows.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {error ? (
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            ) : null}

            {/* Read-only Confirmed Email Badge */}
            <View style={[styles.emailBadge, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
              <Text style={styles.checkIcon}>✓</Text>
              <View style={styles.emailTextCol}>
                <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                  Verified Email
                </Text>
                <Text style={[Typography.bodyMedium, { color: theme.textPrimary }]}>
                  {user?.email || 'Email verified'}
                </Text>
              </View>
            </View>

            {/* Required Name Input */}
            <Input
              label="Full Name *"
              placeholder="e.g. John Doe"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError(null);
              }}
              autoCapitalize="words"
              autoComplete="name"
              editable={!loading}
            />

            {/* Optional Password Input */}
            <Input
              label="Password (Optional)"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              secureTextEntry
              helperText="Optional: You can set or change this anytime from Settings."
              editable={!loading}
            />

            <Button
              title="Continue to Financial Setup"
              onPress={handleContinue}
              loading={loading}
              disabled={!name.trim()}
              style={styles.continueButton}
            />
          </View>
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
    justifyContent: 'center',
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
  card: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  checkIcon: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
  },
  emailTextCol: {
    flex: 1,
  },
  continueButton: {
    marginTop: Spacing.md,
  },
});
