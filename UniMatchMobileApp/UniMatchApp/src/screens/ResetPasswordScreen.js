
// src/screens/ResetPasswordScreen.js

import React, { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from '../components/AppText';

import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../services/supabase';
import { AlertBox } from '../components';
import { authTheme } from '../styles/authTheme';
import { resetPasswordStyles as styles } from '../styles/resetPasswordStyles';
import useKeyboardAwareScroll from '../utils/useKeyboardAwareScroll';
import {
  friendlyAuthError,
  isSessionMissingError,
  validateNewPassword,
} from '../utils/authValidation';

const logo = require('../../assets/images/icon.png');
// const logo = require('../assets/images/icon.png');

const SUCCESS_DELAY_MS = 1500;

function validatePassword(password, confirmPassword) {
  if (!password || !confirmPassword) {
    return 'Please enter and confirm your new password.';
  }

  const passwordError = validateNewPassword(password);
  if (passwordError) return passwordError;

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return '';
}

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  visible,
  onToggleVisibility,
  editable,
  returnKeyType,
  onSubmitEditing,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.passwordInputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8A9AB0"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          style={styles.passwordInput}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />

        <TouchableOpacity
          onPress={onToggleVisibility}
          activeOpacity={0.75}
          disabled={!editable}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.showText}>{visible ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ScreenHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.logoWrap}>
        <Image source={logo} style={styles.logoImage} resizeMode="contain" />
      </View>

      <Text style={styles.brandText}>UniMatch</Text>

      <Text style={styles.headline}>Create New Password</Text>

    </View>
  );
}

export default function ResetPasswordScreen({ navigation }) {
  // Light page: keep content clear of the notch / status bar and home bar.
  const insets = useSafeAreaInsets();
  // Keeps the focused field above the keyboard.
  const keyboard = useKeyboardAwareScroll();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // false when there is no recovery session (the code was never verified
  // or it expired); null while checking.
  const [hasSession, setHasSession] = useState(null);
  const redirectTimer = useRef(null);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setHasSession(Boolean(data?.session));
      })
      .catch(() => {
        if (active) setHasSession(false);
      });

    return () => {
      active = false;
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const goToForgotPassword = () => {
    navigation.replace('ForgotPassword');
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Login', undefined, { pop: true });
  };

  const handlePasswordChange = (value) => {
    setPassword(value);

    if (error) {
      setError('');
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);

    if (error) {
      setError('');
    }
  };

  const handleUpdatePassword = async () => {
    const validationError = validatePassword(password, confirmPassword);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        if (isSessionMissingError(updateError)) {
          setHasSession(false);
          return;
        }
        setError(friendlyAuthError(updateError, 'Could not update password. Please try again.'));
        return;
      }

      setSuccess('Password updated. Log in with your new password.');

      redirectTimer.current = setTimeout(async () => {
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          // The password is already changed; Login still works.
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, SUCCESS_DELAY_MS);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const isLocked = loading || !!success;

  return (
    <LinearGradient
      colors={authTheme.gradients.page}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.pageGradient}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 16 }, keyboard.extraSpace(24)]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ref={keyboard.ref}
        onScroll={keyboard.onScroll}
        scrollEventThrottle={32}
      >
        <View style={styles.card}>
          <ScreenHeader />

          {!!error && (
            <View style={styles.alertWrap}>
              <AlertBox message={error} type="error" />
            </View>
          )}

          {!!success && (
            <View style={styles.alertWrap}>
              <AlertBox message={success} type="success" />
            </View>
          )}

          {hasSession === false && !success ? (
            <View style={styles.form}>
              <View style={styles.alertWrap}>
                <AlertBox
                  message="Your reset code has expired. Please request a new one."
                  type="error"
                />
              </View>

              <TouchableOpacity
                style={styles.mainButtonOuter}
                onPress={goToForgotPassword}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={authTheme.gradients.button}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.mainButton}
                >
                  <Text style={styles.mainButtonText}>Request a new code</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backRow}
                onPress={handleBack}
                activeOpacity={0.75}
              >
                <Text style={styles.backMutedText}>Back to </Text>
                <Text style={styles.backText}>Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <PasswordField
                label="New Password"
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter new password"
                visible={showPassword}
                editable={!isLocked}
                returnKeyType="next"
                onToggleVisibility={() =>
                  setShowPassword((previousValue) => !previousValue)
                }
              />

              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                placeholder="Confirm new password"
                visible={showConfirmPassword}
                editable={!isLocked}
                returnKeyType="done"
                onSubmitEditing={handleUpdatePassword}
                onToggleVisibility={() =>
                  setShowConfirmPassword((previousValue) => !previousValue)
                }
              />

              <Text style={styles.passwordHint}>
                8+ characters with a letter, number and symbol.
              </Text>

              <TouchableOpacity
                style={[
                  styles.mainButtonOuter,
                  isLocked && styles.mainButtonDisabled,
                ]}
                onPress={handleUpdatePassword}
                activeOpacity={0.88}
                disabled={isLocked}
              >
                <LinearGradient
                  colors={authTheme.gradients.button}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.mainButton}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={authTheme.colors.white}
                    />
                  ) : (
                    <Text style={styles.mainButtonText}>Update Password</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backRow}
                onPress={handleBack}
                activeOpacity={0.75}
                disabled={loading}
              >
                <Text style={styles.backMutedText}>Back to </Text>
                <Text style={styles.backText}>Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}