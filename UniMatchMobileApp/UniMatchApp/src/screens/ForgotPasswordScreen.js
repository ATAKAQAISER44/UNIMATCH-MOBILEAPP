
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../services/supabase';
import { AlertBox } from '../components';
import { authTheme } from '../styles/authTheme';
import { forgotPasswordStyles as styles } from '../styles/forgotPasswordStyles';

const logo = require('../../assets/images/icon.png');

function ForgotPasswordHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.logoWrap}>
        <Image source={logo} style={styles.logoImage} resizeMode="contain" />
      </View>

      <Text style={styles.brandText}>UniMatch</Text>

      <Text style={styles.headline}>Forgot Password?</Text>

      <Text style={styles.subtitle}>
        Enter your email address and we will send you an OTP to reset your
        password.
      </Text>
    </View>
  );
}

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Login', undefined, { pop: true });
  };

  const handleEmailChange = (value) => {
    setEmail(value);

    if (error) {
      setError('');
    }
  };

  const handleSendResetCode = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (resetError) {
        setError(
          resetError.message || 'Could not send reset link. Please try again.'
        );
        return;
      }

      navigation.navigate('OtpVerification', {
        email: cleanEmail,
        flow: 'forgot-password',
      }, { pop: true });
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
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <ForgotPasswordHeader />

          {!!error && (
            <View style={styles.alertWrap}>
              <AlertBox message={error} type="error" />
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>

              <TextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                placeholderTextColor="#8A9AB0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={handleSendResetCode}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButtonOuter,
                loading && styles.sendButtonDisabled,
              ]}
              onPress={handleSendResetCode}
              activeOpacity={0.88}
              disabled={loading}
            >
              <LinearGradient
                colors={authTheme.gradients.button}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.sendButton}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={authTheme.colors.white}
                  />
                ) : (
                  <Text style={styles.sendButtonText}>Send OTP</Text>
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