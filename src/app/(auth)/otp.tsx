import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Button, OtpInput, ErrorBanner, BackButton } from '../../components/ui';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { VerifyOtpResponse } from '../../types/api';
import { getErrorMessage, getRateLimitSeconds } from '../../utils/errors';

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || '';

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const setAuth = useAuthStore((state) => state.setAuth);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [welcomeBackUser, setWelcomeBackUser] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 60-second resend countdown timer on mount
  useEffect(() => {
    startCooldown(60);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCooldown(seconds);

    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (codeToVerify?: string) => {
    const finalCode = (codeToVerify || code).trim();
    if (finalCode.length < 6) {
      setError(Strings.auth.otpIncomplete);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Backend: POST /auth/verify-otp  body: { email, code }
      const response = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
        email,
        code: finalCode,
      });

      const { accessToken, refreshToken, isNewUser, user } = response.data;

      // Save tokens & hydrate auth store
      await setAuth(user, accessToken, refreshToken);

      if (isNewUser) {
        // Direct new users into onboarding
        router.replace('/(onboarding)/profile');
      } else {
        // Show brief "Welcome back" card before landing on home
        const displayName = user.name || user.email.split('@')[0];
        setWelcomeBackUser(displayName);

        setTimeout(() => {
          router.replace('/(app)');
        }, 1200);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'رمز التحقق غير صحيح أو منتهي الصلاحية'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError(null);

    try {
      await api.post('/auth/request-otp', { email });
      startCooldown(60);
    } catch (err: unknown) {
      const waitTime = getRateLimitSeconds(err);
      if (waitTime) {
        startCooldown(waitTime);
        setError(Strings.auth.waitCooldown(waitTime));
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setResending(false);
    }
  };

  // Render temporary "Welcome Back" screen for returning users
  if (welcomeBackUser) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered, { backgroundColor: theme.background }]}>
        <View style={[styles.welcomeCard, Shadows.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.welcomeEmoji}>👋</Text>
          <Text style={[Typography.title1, { color: theme.textPrimary, textAlign: 'center', marginTop: Spacing.md }]}>
            {Strings.auth.welcomeBack}
          </Text>
          <Text style={[Typography.bodyMedium, { color: theme.primary, textAlign: 'center', marginTop: Spacing.xs }]}>
            {welcomeBackUser}
          </Text>
          <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: Spacing.xl }} />
        </View>
      </SafeAreaView>
    );
  }

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
            onPress={() => router.back()}
            disabled={loading}
            style={styles.backButton}
          />

          <View style={styles.headerSection}>
            <Text style={[Typography.title1, styles.title, { color: theme.textPrimary }]}>
              {Strings.auth.otpTitle}
            </Text>
            <Text style={[Typography.body, styles.subtitle, { color: theme.textSecondary }]}>
              {Strings.auth.otpSubtitle}{' '}
              <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{email}</Text>
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.changeEmailButton}>
              <Text style={[Typography.footnote, { color: theme.primary, fontWeight: '700' }]}>
                {Strings.auth.changeEmail}
              </Text>
            </TouchableOpacity>
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

            {/* 6 Digit OTP Input */}
            <OtpInput
              length={6}
              value={code}
              onChange={(val) => {
                setCode(val);
                if (error) setError(null);
              }}
              error={!!error}
              disabled={loading}
              onComplete={(completedCode) => handleVerify(completedCode)}
            />

            <Button
              title={Strings.auth.verifyButton}
              onPress={() => handleVerify()}
              loading={loading}
              disabled={code.length < 6}
              style={styles.verifyButton}
            />

            {/* Resend Action with Countdown */}
            <View style={styles.resendContainer}>
              {resendCooldown > 0 ? (
                <Text style={[Typography.footnote, { color: theme.textTertiary }]}>
                  {Strings.auth.resendIn(resendCooldown)}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resending}
                  activeOpacity={0.7}
                >
                  <Text style={[Typography.footnote, { color: theme.primary, fontWeight: '700' }]}>
                    {resending ? Strings.auth.resending : Strings.auth.resendAction}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
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
  backButton: {
    marginBottom: Spacing.lg,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  subtitle: {
    lineHeight: 24,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  changeEmailButton: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  card: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  verifyButton: {
    marginTop: Spacing.md,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  welcomeCard: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.xxxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  welcomeEmoji: {
    fontSize: 52,
  },
});
