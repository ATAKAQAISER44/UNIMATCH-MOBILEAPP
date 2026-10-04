
import React, { useMemo, useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { supabase } from '../services/supabase';
import { AlertBox } from '../components';
import { authTheme } from '../styles/authTheme';
import { signUpStyles as styles } from '../styles/signUpStyles';

const logo = require('../../assets/images/icon.png');

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  country: '',
  language: '',
};

const languageOptions = [
  'Arabic',
  'English',
  'French',
  'German',
  'Hindi',
  'Japanese',
  'Korean',
  'Mandarin Chinese',
  'Polish',
  'Portuguese',
  'Russian',
  'Spanish',
  'Turkish',
  'Urdu',
  'Vietnamese',
].sort();

const countryOptions = [
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'China',
  'Denmark',
  'Finland',
  'France',
  'Germany',
  'India',
  'Ireland',
  'Italy',
  'Japan',
  'Malaysia',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Pakistan',
  'Portugal',
  'Qatar',
  'Saudi Arabia',
  'Singapore',
  'South Africa',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Turkey',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
].sort();

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const DOB_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

function getPasswordStrength(password) {
  if (!password) {
    return { label: '', color: '#D1D5DB', width: '0%' };
  }

  const score = [
    password.length >= 8,
    /[A-Za-z]/.test(password),
    /\d/.test(password),
    /[@$!%*#?&]/.test(password),
    password.length >= 12,
  ].filter(Boolean).length;

  if (score <= 2) {
    return { label: 'Weak', color: '#EF4444', width: '33%' };
  }

  if (score <= 4) {
    return { label: 'Medium', color: '#F59E0B', width: '66%' };
  }

  return { label: 'Strong', color: '#10B981', width: '100%' };
}

function formatDobInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 4) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function normalizeDobValue(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);

  if (digits.length !== 8) return value;

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function isValidRealDate(value) {
  if (!DOB_REGEX.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const dobDate = new Date(year, month - 1, day);

  return (
    dobDate.getFullYear() === year &&
    dobDate.getMonth() === month - 1 &&
    dobDate.getDate() === day
  );
}

function isFutureDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  const dobDate = new Date(year, month - 1, day);

  return dobDate > new Date();
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  rightElement,
  editable = true,
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputShell, !editable && styles.disabledInput]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8A9AB0"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          style={[styles.input, rightElement ? styles.inputWithRight : null]}
        />

        {rightElement}
      </View>
    </View>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  disabled,
  containerStyle,
}) {
  const [visible, setVisible] = useState(false);

  const closeModal = () => setVisible(false);

  const handleSelect = (item) => {
    onSelect(item);
    closeModal();
  };

  return (
    <View style={[styles.fieldWrapper, containerStyle]}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => !disabled && setVisible(true)}
        style={[styles.selectBox, disabled && styles.disabledInput]}
        disabled={disabled}
      >
        <Text
          style={value ? styles.selectText : styles.selectPlaceholder}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>

        <View style={styles.selectRightArea}>
          <View style={styles.selectDivider} />

          <Feather
            name="chevron-down"
            size={16}
            color={authTheme.colors.brandMuted}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>

              <TouchableOpacity onPress={closeModal} activeOpacity={0.75}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = value === item;

                return (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      isSelected ? styles.optionItemActive : null,
                    ]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected ? styles.optionTextActive : null,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No option found.</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function HeaderCard() {
  return (
    <View style={styles.header}>
      <View style={styles.logoWrap}>
        <Image source={logo} style={styles.logoImage} resizeMode="contain" />
      </View>

      <Text style={styles.brandText}>UniMatch</Text>
    </View>
  );
}

function PasswordStrength({ passwordStrength }) {
  return (
    <View style={styles.strengthWrapper}>
      <View style={styles.strengthTrack}>
        <View
          style={[
            styles.strengthFill,
            {
              width: passwordStrength.width,
              backgroundColor: passwordStrength.color,
            },
          ]}
        />
      </View>

      <View style={styles.strengthInfoRow}>
        <Text style={styles.passwordHint} numberOfLines={2}>
          8+ characters with a letter, number and symbol.
        </Text>

        {!!passwordStrength.label && (
          <Text
            style={[styles.strengthLabel, { color: passwordStrength.color }]}
            numberOfLines={1}
          >
            {passwordStrength.label}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function SignUpScreen({ navigation }) {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));

    if (message) {
      setMessage('');
    }
  };

  const showMessage = (text, type = 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const validateForm = () => {
    const email = form.email.trim().toLowerCase();
    const normalizedDob = normalizeDobValue(form.dateOfBirth);

    if (!form.fullName.trim()) {
      showMessage('Please enter your full name.');
      return false;
    }

    if (!email) {
      showMessage('Please enter your email address.');
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      showMessage('Please enter a valid email address.');
      return false;
    }

    if (!PASSWORD_REGEX.test(form.password)) {
      showMessage(
        'Password must be at least 8 characters and include a letter, number, and special character.'
      );
      return false;
    }

    if (form.password !== form.confirmPassword) {
      showMessage('Passwords do not match.');
      return false;
    }

    if (!normalizedDob) {
      showMessage('Please enter your date of birth.');
      return false;
    }

    if (!DOB_REGEX.test(normalizedDob)) {
      showMessage('Date of birth must be in YYYY-MM-DD format.');
      return false;
    }

    if (!isValidRealDate(normalizedDob)) {
      showMessage('Please enter a valid date of birth.');
      return false;
    }

    if (isFutureDate(normalizedDob)) {
      showMessage('Date of birth cannot be in the future.');
      return false;
    }

    if (!form.language) {
      showMessage('Please select your preferred language for study.');
      return false;
    }

    if (!form.country) {
      showMessage('Please select your country of residence.');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (loading) return;

    const isValid = validateForm();
    if (!isValid) return;

    setLoading(true);
    setMessage('');

    const cleanEmail = form.email.trim().toLowerCase();
    const cleanFullName = form.fullName.trim();
    const databaseDateOfBirth = normalizeDobValue(form.dateOfBirth);

    try {
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUserError) {
        showMessage(existingUserError.message);
        return;
      }

      if (existingUser) {
        showMessage('An account with this email already exists.');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,
        options: {
          data: {
            full_name: cleanFullName,
            date_of_birth: databaseDateOfBirth,
            country: form.country,
            preferred_language_for_study: form.language,
            language: form.language,
          },
        },
      });

      if (error) {
        showMessage(error.message);
        return;
      }

      if (data?.user) {
        showMessage('A verification code has been sent to your email.', 'success');

        setTimeout(() => {
          navigation.replace('OtpVerification', {
            email: cleanEmail,
            flow: 'signup',
          });
        }, 700);
      } else {
        showMessage('Unable to create account. Please try again.');
      }
    } catch (err) {
      showMessage(err?.message || 'Something went wrong. Please try again.');
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
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <HeaderCard />

            {!!message && (
              <View style={styles.alertWrap}>
                <AlertBox message={message} type={messageType} />
              </View>
            )}

            <View style={styles.form}>
              <FieldInput
                label="Full Name"
                value={form.fullName}
                onChangeText={(value) => setField('fullName', value)}
                placeholder="Enter your full name"
                autoCapitalize="words"
                editable={!loading}
              />

              <FieldInput
                label="Email Address"
                value={form.email}
                onChangeText={(value) => setField('email', value)}
                placeholder="Enter your email address"
                keyboardType="email-address"
                editable={!loading}
              />

              <FieldInput
                label="Password"
                value={form.password}
                onChangeText={(value) => setField('password', value)}
                placeholder="Create a strong password"
                secureTextEntry={!showPassword}
                editable={!loading}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    activeOpacity={0.75}
                    disabled={loading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.showBtnText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                }
              />

              <PasswordStrength passwordStrength={passwordStrength} />

              <FieldInput
                label="Confirm Password"
                value={form.confirmPassword}
                onChangeText={(value) => setField('confirmPassword', value)}
                placeholder="Re-enter your password"
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    activeOpacity={0.75}
                    disabled={loading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.showBtnText}>
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                }
              />

              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Date of Birth</Text>

                <View
                  style={[styles.inputShell, loading && styles.disabledInput]}
                >
                  <TextInput
                    value={form.dateOfBirth}
                    onChangeText={(value) =>
                      setField('dateOfBirth', formatDobInput(value))
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#8A9AB0"
                    keyboardType="number-pad"
                    editable={!loading}
                    maxLength={10}
                    style={styles.input}
                  />
                </View>
              </View>

              <SelectField
                label="Preferred Language for Study"
                value={form.language}
                placeholder="Select preferred language"
                options={languageOptions}
                disabled={loading}
                onSelect={(value) => setField('language', value)}
              />

              <SelectField
                label="Country of Residence"
                value={form.country}
                placeholder="Select country"
                options={countryOptions}
                disabled={loading}
                onSelect={(value) => setField('country', value)}
              />

              <TouchableOpacity
                style={[
                  styles.signupButtonOuter,
                  loading && styles.signupButtonDisabled,
                ]}
                onPress={handleSignUp}
                activeOpacity={0.88}
                disabled={loading}
              >
                <LinearGradient
                  colors={authTheme.gradients.button}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.signupButton}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={authTheme.colors.white}
                    />
                  ) : (
                    <Text style={styles.signupButtonText}>
                      Create Account
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginRow}
                onPress={() => navigation.navigate('Login', undefined, { pop: true })}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.loginText}>
                  Already have an account?{' '}
                </Text>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}