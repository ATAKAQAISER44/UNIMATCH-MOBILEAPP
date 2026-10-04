
// src/screens/ResetPasswordScreen.js

import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../services/supabase';
import { AlertBox } from '../components';
import { authTheme } from '../styles/authTheme';
import { resetPasswordStyles as styles } from '../styles/resetPasswordStyles';

const logo = require('../../assets/images/icon.png');
// const logo = require('../assets/images/icon.png');

const PASSWORD_RULES = {
  minLength: 8,
  letter: /[A-Za-z]/,
  number: /[0-9]/,
  specialCharacter: /[^A-Za-z0-9]/,
};

function validatePassword(password, confirmPassword) {
  if (!password || !confirmPassword) {
    return 'Please enter and confirm your new password.';
  }

  if (password.length < PASSWORD_RULES.minLength) {
    return 'Password must be at least 8 characters long.';
  }

  if (!PASSWORD_RULES.letter.test(password)) {
    return 'Password must include at least one letter.';
  }

  if (!PASSWORD_RULES.number.test(password)) {
    return 'Password must include at least one number.';
  }

  if (!PASSWORD_RULES.specialCharacter.test(password)) {
    return 'Password must include at least one special character.';
  }

  if (password !== confirmPassword) {
    return 'New password and confirm password do not match.';
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError(
          updateError.message || 'Could not update password. Please try again.'
        );
        return;
      }

      await supabase.auth.signOut();

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      setError(
        'Something went wrong. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={authTheme.gradients.page}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.pageGradient}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <ScreenHeader />

          {!!error && (
            <View style={styles.alertWrap}>
              <AlertBox message={error} type="error" />
            </View>
          )}

          <View style={styles.form}>
            <PasswordField
              label="New Password"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Enter new password"
              visible={showPassword}
              editable={!loading}
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
              editable={!loading}
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
                loading && styles.mainButtonDisabled,
              ]}
              onPress={handleUpdatePassword}
              activeOpacity={0.88}
              disabled={loading}
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
        </View>
      </ScrollView>
    </LinearGradient>
  );
}