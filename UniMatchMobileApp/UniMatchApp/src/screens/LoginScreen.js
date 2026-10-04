
// src/screens/LoginScreen.js

import React, { useCallback, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Text, TextInput } from '../components/AppText';

import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { supabase } from '../services/supabase';
import { AlertBox } from '../components';
import { loginStyles as styles } from '../styles/loginStyles';
import { authTheme } from '../styles/authTheme';

WebBrowser.maybeCompleteAuthSession();

const LOGO = require('../../assets/images/icon.png');

function getFriendlyAuthError(message = '') {
  const lowerMessage = String(message).toLowerCase();

  if (lowerMessage.includes('email not confirmed')) {
    return 'Please verify your email before signing in.';
  }

  if (
    lowerMessage.includes('invalid login credentials') ||
    lowerMessage.includes('invalid credentials')
  ) {
    return 'Invalid email or password. Please try again.';
  }

  if (lowerMessage.includes('oauth')) {
    return 'Google sign-in could not be completed. Please try again.';
  }

  return message || 'Something went wrong. Please try again.';
}

function parseUrlPart(part = '', params = {}) {
  part
    .replace(/^\?/, '')
    .replace(/^#/, '')
    .split('&')
    .filter(Boolean)
    .forEach((pair) => {
      const [key, value] = pair.split('=');

      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    });

  return params;
}

function parseAuthParams(url = '') {
  const params = {};
  const queryPart = url.includes('?')
    ? url.split('?')[1]?.split('#')[0]
    : '';
  const hashPart = url.includes('#') ? url.split('#')[1] : '';

  parseUrlPart(queryPart, params);
  parseUrlPart(hashPart, params);

  return params;
}

function getUserIdFromSessionData(sessionData) {
  return sessionData?.user?.id || sessionData?.session?.user?.id || null;
}

export default function LoginScreen({ navigation }) {
  // Light page: keep content clear of the notch / status bar and home bar.
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const isBusy = useMemo(() => loading || googleLoading, [loading, googleLoading]);

  const clearErrorIfNeeded = useCallback(() => {
    setError((previousError) => (previousError ? '' : previousError));
  }, []);

  const goNextAfterLogin = useCallback(
    async (userId) => {
      if (!userId) {
        setError('Login failed. Please try again.');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, profile_completed')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        setError(
          'Your account was found, but profile details could not be loaded.'
        );
        return;
      }

      const role = profileData?.role?.trim().toLowerCase();
      const isProfileCompleted = Boolean(profileData?.profile_completed);

      if (!role) {
        navigation.replace('RoleSelection');
        return;
      }

      if (role === 'student' && !isProfileCompleted) {
        navigation.replace('ProfileSetup');
        return;
      }

      navigation.replace('Dashboard');
    },
    [navigation]
  );

  const handleEmailChange = useCallback(
    (value) => {
      setEmail(value);
      clearErrorIfNeeded();
    },
    [clearErrorIfNeeded]
  );

  const handlePasswordChange = useCallback(
    (value) => {
      setPassword(value);
      clearErrorIfNeeded();
    },
    [clearErrorIfNeeded]
  );

  const handleLogin = useCallback(async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        setError(getFriendlyAuthError(authError.message));
        return;
      }

      await goNextAfterLogin(data?.user?.id);
    } catch (err) {
      setError(
        'Something went wrong. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [email, goNextAfterLogin, password]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setGoogleLoading(true);
      setError('');

      const redirectTo = Linking.createURL('auth/callback');

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        setError(getFriendlyAuthError(oauthError.message));
        return;
      }

      if (!data?.url) {
        setError('Google sign-in could not be started. Please try again.');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== 'success' || !result.url) {
        return;
      }

      const params = parseAuthParams(result.url);

      if (params.error || params.error_description) {
        setError(getFriendlyAuthError(params.error_description || params.error));
        return;
      }

      if (params.code) {
        const { data: sessionData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(params.code);

        if (exchangeError) {
          setError(getFriendlyAuthError(exchangeError.message));
          return;
        }

        await goNextAfterLogin(getUserIdFromSessionData(sessionData));
        return;
      }

      if (params.access_token && params.refresh_token) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });

        if (sessionError) {
          setError(getFriendlyAuthError(sessionError.message));
          return;
        }

        await goNextAfterLogin(getUserIdFromSessionData(sessionData));
        return;
      }

      const { data: existingSession } = await supabase.auth.getSession();
      const userId = existingSession?.session?.user?.id;

      if (!userId) {
        setError('Google sign-in finished, but we could not log you in. Please try again.');
        return;
      }

      await goNextAfterLogin(userId);
    } catch (err) {
      setError('Google sign-in failed. Please check your internet connection and try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [goNextAfterLogin]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((previous) => !previous);
  }, []);

  const goToForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword', undefined, { pop: true });
  }, [navigation]);

  const goToSignUp = useCallback(() => {
    navigation.navigate('SignUp', undefined, { pop: true });
  }, [navigation]);

  return (
    <LinearGradient
      colors={authTheme.gradients.page}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.pageGradient}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.page}
          contentContainerStyle={[styles.pageContent, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
        >
          <View style={styles.card}>
            <View style={styles.cardInner}>
              <View style={styles.logoWrap}>
                <Image
                  source={LOGO}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.brandName}>UniMatch</Text>

              {/* <TouchableOpacity
                style={[
                  styles.googleButton,
                  isBusy && styles.googleButtonDisabled,
                ]}
                onPress={handleGoogleLogin}
                activeOpacity={0.85}
                disabled={isBusy}
              >
                {googleLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={authTheme.colors.brandTeal}
                  />
                ) : (
                  <>
                    <View style={styles.googleIconWrap}>
                      <Text style={styles.googleIcon}>G</Text>
                    </View>

                    <Text style={styles.googleText}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or log in with email</Text>
                <View style={styles.dividerLine} />
              </View> */}

              <View style={styles.form}>
                {!!error && (
                  <View style={styles.alertWrap}>
                    <AlertBox message={error} type="error" />
                  </View>
                )}

                <View style={styles.field}>
                  <Text style={styles.label}>Email Address</Text>

                  <TextInput
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder="Enter your email address"
                    placeholderTextColor="#8A9AB0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isBusy}
                    style={styles.input}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>

                  <View style={styles.passwordInputWrap}>
                    <TextInput
                      value={password}
                      onChangeText={handlePasswordChange}
                      placeholder="Enter your password"
                      placeholderTextColor="#8A9AB0"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isBusy}
                      style={styles.passwordInput}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />

                    <TouchableOpacity
                      onPress={togglePasswordVisibility}
                      activeOpacity={0.75}
                      disabled={isBusy}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.showText}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={goToForgotPassword}
                  style={styles.forgotRow}
                  activeOpacity={0.75}
                  disabled={isBusy}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.loginButtonOuter,
                    isBusy && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  activeOpacity={0.88}
                  disabled={isBusy}
                >
                  <LinearGradient
                    colors={authTheme.gradients.button}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.loginButton}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.loginText}>Login</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.signupRow}
                  onPress={goToSignUp}
                  activeOpacity={0.75}
                  disabled={isBusy}
                >
                  {/* One Text line so Android cannot cut "Sign Up" down to "Sign" */}
                  <Text style={styles.signupText} numberOfLines={1}>
                    Don’t have an account?{' '}
                    <Text style={styles.signupLink}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}