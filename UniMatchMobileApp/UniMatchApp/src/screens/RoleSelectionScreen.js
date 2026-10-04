
import React, { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../services/supabase';
import { getSignedInUser } from '../services/session';
import { AlertBox } from '../components';
import { authTheme } from '../styles/authTheme';
import { roleSelectionStyles as styles } from '../styles/roleSelectionStyles';

const logo = require('../../assets/images/icon.png');

const ROLES = [
  {
    title: 'Student',
    description: 'Find universities that fit your profile.',
    icon: '🎓',
    color: authTheme.colors.brandTeal,
    light: authTheme.colors.brandMintDeep,
  },
  {
    title: 'Researcher',
    description: 'Explore and analyse ranking data.',
    icon: '🔬',
    color: '#0D9488',
    light: '#ECFDF5',
  },
  {
    title: 'Policymaker',
    description: 'Compare universities and trends.',
    icon: '📊',
    color: '#10B981',
    light: '#ECFDF5',
  },
  {
    title: 'University Administrator',
    description: 'Review rankings and standing.',
    icon: '🏫',
    color: '#059669',
    light: '#ECFDF5',
  },
];

function HeaderCard() {
  return (
    <View style={styles.header}>
      <View style={styles.logoWrap}>
        <Image source={logo} style={styles.logoImage} resizeMode="contain" />
      </View>

      <Text style={styles.headline}>
        Choose your <Text style={styles.highlightText}>UniMatch</Text> role
      </Text>

    </View>
  );
}

function RoleCard({ role, active, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.roleCard,
        active && {
          borderColor: role.color,
          backgroundColor: role.light,
        },
      ]}
    >
      <View
        style={[
          styles.roleIconBox,
          active && { backgroundColor: role.color, borderColor: role.color },
        ]}
      >
        <Text style={styles.roleIcon}>{role.icon}</Text>
      </View>

      <View style={styles.roleTextBlock}>
        <Text style={styles.roleTitle}>{role.title}</Text>

        <Text style={styles.roleDescription} numberOfLines={2}>
          {role.description}
        </Text>

        <Text style={[styles.selectText, active && { color: role.color }]}>
          {active ? 'Selected ✓' : 'Select →'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function RoleSelectionScreen({ navigation }) {
  // Light page: keep content clear of the notch / status bar and home bar.
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const selectedRoleData = useMemo(
    () => ROLES.find((role) => role.title === selectedRole),
    [selectedRole]
  );

  const handleSelectRole = (roleTitle) => {
    setSelectedRole(roleTitle);
    setMessage('');
  };

  const handleContinue = async () => {
    if (!selectedRole || loading) {
      setMessage('Please select a role to continue.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const {
        data: { user },
        error: userError,
      } = await getSignedInUser();

      if (userError || !user) {
        setMessage('Your session has expired. Please log in again.');
        navigation.replace('Login');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          role: selectedRole,
          profile_completed: false,
        })
        .eq('id', user.id);

      if (error) {
        setMessage(error.message || 'Unable to save your role. Please try again.');
        return;
      }

      if (selectedRole === 'Student') {
        navigation.replace('ProfileSetup');
        return;
      }

      navigation.replace('Dashboard');
    } catch (err) {
      setMessage(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      style={styles.keyboardRoot}
    >
      <LinearGradient
        colors={authTheme.gradients.page}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pageGradient}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <HeaderCard />

            <View style={styles.roleList}>
              {ROLES.map((role) => (
                <RoleCard
                  key={role.title}
                  role={role}
                  active={selectedRole === role.title}
                  onPress={() => handleSelectRole(role.title)}
                />
              ))}
            </View>

            {!!selectedRoleData && (
              <View style={styles.selectedBox}>
                <Text style={styles.selectedText}>
                  {selectedRoleData.title} role selected
                </Text>
              </View>
            )}

            {!!message && (
              <View style={styles.alertWrap}>
                <AlertBox message={message} type="error" />
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleContinue}
              disabled={loading || !selectedRole}
              style={[
                styles.continueButtonOuter,
                (!selectedRole || loading) && styles.continueButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={authTheme.gradients.button}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.continueButton}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={authTheme.colors.white} />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}