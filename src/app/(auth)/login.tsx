import React, { useState, useEffect, useRef } from 'react';
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
import { ThemeColors, Typography, Spacing, Radii, BrandColors, Shadows } from '../../constants/theme';
import { Button, Input, ErrorBanner } from '../../components/ui';
import api from '../../services/api';
import { getErrorMessage, getRateLimitSeconds } from '../../utils/errors';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear countdown timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCooldown(seconds);

    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    // Basic format validation
    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (cooldown > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Backend: POST /auth/request-otp  body: { email }
      await api.post('/auth/request-otp', { email: trimmedEmail });

      // Navigate to OTP verification screen with email query parameter
      router.push({
        pathname: '/(auth)/otp',
        params: { email: trimmedEmail },
      });
    } catch (err: unknown) {
      const waitTime = getRateLimitSeconds(err);
      if (waitTime) {
        startCooldown(waitTime);
        setError(`Rate limit reached. Please wait ${waitTime}s before requesting again.`);
      } else {
        setError(getErrorMessage(err));
      }
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
          {/* Header Brand Section */}
          <View style={styles.headerSection}>
            <View
              style={[
                styles.brandIcon,
                { backgroundColor: theme.primaryMuted, borderColor: theme.border },
              ]}
            >
              <Text style={styles.brandIconEmoji}>💸</Text>
            </View>

            <Text style={[Typography.title1, styles.title, { color: theme.textPrimary }]}>
              Welcome to My Wallet
            </Text>
            <Text style={[Typography.body, styles.subtitle, { color: theme.textSecondary }]}>
              Sign in with your email to track your wealth, budgets, and cash flow.
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
              <ErrorBanner
                message={error}
                variant={cooldown > 0 ? 'warning' : 'error'}
                onDismiss={() => setError(null)}
              />
            ) : null}

            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="go"
              onSubmitEditing={handleSendOtp}
              editable={!loading}
            />

            <Button
              title={
                cooldown > 0
                  ? `Wait ${cooldown}s`
                  : 'Send Verification Code'
              }
              onPress={handleSendOtp}
              loading={loading}
              disabled={cooldown > 0 || !email.trim()}
              style={styles.submitButton}
            />

            <Text style={[Typography.footnote, styles.disclaimer, { color: theme.textTertiary }]}>
              We will send a 6-digit one-time code to your inbox. No password needed to start.
            </Text>
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
    paddingVertical: Spacing.xxl,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  brandIconEmoji: {
    fontSize: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
  disclaimer: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
