
// src/screens/OtpVerificationScreen.js

import React, { useRef, useState } from 'react';
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
import { otpVerificationStyles as styles } from '../styles/otpVerificationStyles';

const logo = require('../../assets/images/icon.png');

const OTP_LENGTH = 8;

const createEmptyOtp = () => Array(OTP_LENGTH).fill('');

function OtpHeader({ email }) {
  return (
    <View style={styles.header}>
      <View style={styles.logoWrap}>
        <Image source={logo} style={styles.logoImage} resizeMode="contain" />
      </View>

      <Text style={styles.brandText}>UniMatch</Text>

      <Text style={styles.headline}>Verify Code</Text>

      <Text style={styles.subtitle}>
        {email ? 'Enter the 8-digit code sent to' : 'Enter the 8-digit code from your email.'}
      </Text>

      {!!email && <Text style={styles.emailText}>{email}</Text>}
    </View>
  );
}

function OtpInputRow({ otp, inputRefs, onOtpChange, onKeyPress }) {
  return (
    <View style={styles.otpRow}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          value={digit}
          onChangeText={(value) => onOtpChange(value, index)}
          onKeyPress={(event) => onKeyPress(event, index)}
          keyboardType="number-pad"
          // Not 1: a pasted (or auto-filled) code must reach onChangeText whole,
          // otherwise only its first digit arrives.
          maxLength={OTP_LENGTH}
          textContentType="oneTimeCode"
          autoComplete={index === 0 ? 'sms-otp' : 'off'}
          selectTextOnFocus
          style={styles.otpInput}
          textAlign="center"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
        />
      ))}
    </View>
  );
}

export default function OtpVerificationScreen({ navigation, route = {} }) {
  // Light page: keep content clear of the notch / status bar and home bar.
  const insets = useSafeAreaInsets();
  const email = route?.params?.email || '';
  const flow = route?.params?.flow || 'signup';

  const inputRefs = useRef([]);

  const [otp, setOtp] = useState(createEmptyOtp);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const otpCode = otp.join('');
  const otpType = flow === 'forgot-password' ? 'recovery' : 'email';
  const isBusy = loading || resending;

  // Sign Up replaces itself with this screen, so going back would land on
  // Login; open Sign Up explicitly instead.
  const handleBack = () => {
    if (flow === 'forgot-password') {
      if (navigation?.canGoBack?.()) navigation.goBack();
      else navigation.replace('ForgotPassword');
      return;
    }

    navigation.replace('SignUp');
  };

  const clearMessagesIfNeeded = () => {
    if (error) {
      setError('');
    }

    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const focusInput = (index) => {
    inputRefs.current[index]?.focus();
  };

  const handleOtpChange = (value, index) => {
    let cleanValue = value.replace(/[^0-9]/g, '');

    clearMessagesIfNeeded();

    // Typing over a box that already holds a digit gives two characters:
    // keep only the new one.
    if (cleanValue.length === 2 && otp[index] && cleanValue.includes(otp[index])) {
      cleanValue = cleanValue[0] === otp[index] ? cleanValue[1] : cleanValue[0];
    }

    if (cleanValue.length > 1) {
      // Pasted or auto-filled code: a full code fills every box, a shorter
      // one fills from this box onwards.
      const start = cleanValue.length >= OTP_LENGTH ? 0 : index;
      const pastedCode = cleanValue.slice(0, OTP_LENGTH - start).split('');
      const nextOtp = start === 0 ? createEmptyOtp() : [...otp];

      pastedCode.forEach((digit, digitIndex) => {
        nextOtp[start + digitIndex] = digit;
      });

      setOtp(nextOtp);

      const filledTo = start + pastedCode.length;
      if (filledTo >= OTP_LENGTH) inputRefs.current[OTP_LENGTH - 1]?.blur();
      else focusInput(filledTo);
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = cleanValue;
    setOtp(nextOtp);

    if (cleanValue && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtpCode = otpCode.trim();

    if (!cleanEmail) {
      setSuccessMessage('');
      setError('Email is missing. Please go back and enter your email again.');
      return;
    }

    if (cleanOtpCode.length !== OTP_LENGTH) {
      setSuccessMessage('');
      setError('Please enter all 8 digits of the code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtpCode,
        type: otpType,
      });

      if (verifyError) {
        setError(verifyError.message || 'This code is incorrect or has expired. Please try again.');
        return;
      }

      if (flow === 'forgot-password') {
        navigation.replace('ResetPassword', {
          email: cleanEmail,
        });
        return;
      }

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

  const handleResendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setSuccessMessage('');
      setError('Email is missing. Please go back and enter your email again.');
      return;
    }

    try {
      setResending(true);
      setError('');
      setSuccessMessage('');

      let resendError = null;

      if (flow === 'forgot-password') {
        const { error: resetError } =
          await supabase.auth.resetPasswordForEmail(cleanEmail);

        resendError = resetError;
      } else {
        const { error: signupResendError } = await supabase.auth.resend({
          type: 'signup',
          email: cleanEmail,
        });

        resendError = signupResendError;
      }

      if (resendError) {
        setError(resendError.message || 'Could not resend code. Please try again.');
        return;
      }

      setOtp(createEmptyOtp());
      setSuccessMessage('Code sent again. Please check your email.');
      focusInput(0);
    } catch (err) {
      setSuccessMessage('');
      setError('Something went wrong. Please try again.');
    } finally {
      setResending(false);
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
          <OtpHeader email={email} />

          {!!successMessage && (
            <View style={styles.alertWrap}>
              <AlertBox message={successMessage} type="success" />
            </View>
          )}

          {!!error && (
            <View style={styles.alertWrap}>
              <AlertBox message={error} type="error" />
            </View>
          )}

          <View style={styles.form}>
            <OtpInputRow
              otp={otp}
              inputRefs={inputRefs}
              onOtpChange={handleOtpChange}
              onKeyPress={handleKeyPress}
            />

            <TouchableOpacity
              style={[
                styles.mainButtonOuter,
                isBusy && styles.mainButtonDisabled,
              ]}
              onPress={handleVerifyOtp}
              activeOpacity={0.88}
              disabled={isBusy}
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
                  <Text style={styles.mainButtonText}>Verify Your Email</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendRow}
              onPress={handleResendCode}
              disabled={isBusy}
              activeOpacity={0.75}
            >
              {resending ? (
                <ActivityIndicator size="small" color={authTheme.colors.brandTeal} />
              ) : (
                <Text style={styles.resendText}>Resend Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backRow}
              onPress={handleBack}
              activeOpacity={0.75}
              disabled={isBusy}
            >
              <Text style={styles.backText}>
                {flow === 'forgot-password' ? 'Change Email' : 'Back to Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}