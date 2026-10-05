
// src/screens/ProfileViewScreen.js

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../components/AppText';

import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bottomPadding } from '../utils/safeArea';
import { topBarPadding } from '../utils/safeArea';

import { supabase } from '../services/supabase';
import { getSignedInUser } from '../services/session';
import { normalizeIntendedLevel } from '../utils/profileSetupUtils';
import { roleKey } from '../services/userRole';
import { useUserSetting } from '../services/backendData';

// Non-student roles see their account details only.
const ACCOUNT_ICON = { researcher: 'flask-outline', administrator: 'business-outline', policymaker: 'earth-outline' };
import { authTheme } from '../styles/authTheme';
import { dashboardStyles } from '../styles/dashboardStyles';
import { profileViewStyles as styles } from '../styles/profileViewStyles';

const LOGO = require('../../assets/images/icon.png');

export default function ProfileViewScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [adminInstitution] = useUserSetting('admin_institution');
  const [policyCountry] = useUserSetting('policy_country');
  const [profileData, setProfileData] = useState({
    profile: null,
    academic: null,
    geographic: null,
    financial: null,
    priority: null,
    tests: [],
  });

  const [loading, setLoading] = useState(true);

  const { profile, academic, geographic, financial, priority, tests } =
    profileData;

  // PERF: the profile is re-fetched every time this screen gains focus (so it
  // is fresh after editing), but only the very first load shows the
  // full-screen loader; later refreshes update the data silently.
  const hasLoadedOnceRef = useRef(false);

  const loadProfile = useCallback(async () => {
    if (!hasLoadedOnceRef.current) {
      setLoading(true);
    }

    try {
      const {
        data: { user },
      } = await getSignedInUser();

      if (!user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const [
        profileResponse,
        academicResponse,
        geographicResponse,
        financialResponse,
        priorityResponse,
        testsResponse,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),

        supabase
          .from('academic_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),

        supabase
          .from('geographic_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),

        supabase
          .from('financial_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),

        supabase
          .from('priority_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),

        supabase.from('user_test_scores').select('*').eq('user_id', user.id),
      ]);

      const responses = [
        profileResponse,
        academicResponse,
        geographicResponse,
        financialResponse,
        priorityResponse,
        testsResponse,
      ];

      const failedResponse = responses.find((response) => response.error);

      if (failedResponse?.error) {
        throw failedResponse.error;
      }

      setProfileData({
        profile: profileResponse.data || null,
        academic: academicResponse.data || null,
        geographic: geographicResponse.data || null,
        financial: financialResponse.data || null,
        priority: priorityResponse.data || null,
        tests: testsResponse.data || [],
        email: user.email || '',
      });
      hasLoadedOnceRef.current = true;
    } catch (error) {
      console.log('Profile loading error:', error);
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const priorities = useMemo(
    () =>
      [
        priority?.priority_1,
        priority?.priority_2,
        priority?.priority_3,
        priority?.priority_4,
        priority?.priority_5,
      ].filter(Boolean),
    [priority]
  );

  const academicRows = useMemo(
    () => [
      {
        icon: 'library-outline',
        label: 'Current Education',
        value: academic?.current_education_level,
      },
      {
        icon: 'trending-up-outline',
        label: 'Intended Level',
        value: normalizeIntendedLevel(academic?.intended_education_level),
      },
      {
        icon: 'book-outline',
        label: 'Field of Study',
        value: academic?.field_of_study,
      },
      {
        icon: 'document-text-outline',
        label: 'Score Type',
        value: academic?.score_type,
      },
      {
        icon: 'ribbon-outline',
        label: 'Score',
        value: academic?.score_value,
      },
      {
        icon: 'options-outline',
        label: 'CGPA Scale',
        value: academic?.cgpa_scale,
        isLast: tests.length === 0,
      },
    ],
    [academic, tests.length]
  );

  const geographicRows = useMemo(
    () => [
      {
        icon: 'map-outline',
        label: 'Preferred Region',
        value: geographic?.preferred_region,
      },
      {
        icon: 'location-outline',
        label: 'Preferred Country',
        value:
          geographic?.preferred_country || 'All countries in selected region',
        isLast: true,
      },
    ],
    [geographic]
  );

  const financialRows = useMemo(
    () => [
      {
        icon: 'cash-outline',
        label: 'Min Tuition Fee',
        value: formatMoney(financial?.min_tuition_fee),
      },
      {
        icon: 'card-outline',
        label: 'Max Tuition Fee',
        value: formatMoney(financial?.max_tuition_fee),
      },
      {
        icon: 'home-outline',
        label: 'Living Cost',
        value: formatMoney(financial?.living_cost_tolerance),
      },
      {
        icon: 'gift-outline',
        label: 'Scholarship Requirement',
        value: financial?.scholarship_requirement,
        isLast: true,
      },
    ],
    [financial]
  );

  const priorityRows = useMemo(() => {
    if (priorities.length > 0) {
      return priorities.map((item, index) => ({
        icon: index === 0 ? 'star' : 'star-outline',
        label: `Priority ${index + 1}`,
        value: item,
        isLast: index === priorities.length - 1,
      }));
    }

    return [
      {
        icon: 'star-outline',
        label: 'Priority',
        value: priority?.priority_type || 'Balanced Preference',
        isLast: true,
      },
    ];
  }, [priorities, priority]);

  const handleEditProfile = useCallback(() => {
    navigation.navigate('ProfileSetup', {
      mode: 'edit',
      returnTo: 'ProfileView',
    }, { pop: true });
  }, [navigation]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Dashboard', undefined, { pop: true });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <ProfileTopBar onBackPress={handleBack} />

        <View style={styles.loadingWrap}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={authTheme.colors.brandTeal} />
          </View>
        </View>
      </View>
    );
  }

  // Researchers, administrators and policymakers have no student
  // preferences, so they see their account details only (and no
  // "Edit Profile Setup", which is the student flow).
  const accountRole = roleKey(profile?.role);
  if (ACCOUNT_ICON[accountRole]) {
    const extraRow =
      accountRole === 'administrator'
        ? { icon: 'school-outline', label: 'Your university', value: adminInstitution?.name || 'Not chosen yet' }
        : accountRole === 'policymaker'
          ? { icon: 'flag-outline', label: 'Your country', value: policyCountry || 'Not chosen yet' }
          : null;
    return (
      <View style={styles.screen}>
        <ProfileTopBar onBackPress={handleBack} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, bottomPadding(insets, 24)]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionsWrap}>
            <ProfileSection
              title={profile?.full_name || 'UniMatch User'}
              subtitle={`${profile?.role} account`}
              icon={ACCOUNT_ICON[accountRole]}
            >
              <ProfileRows
                rows={[
                  { icon: 'person-outline', label: 'Full Name', value: profile?.full_name },
                  { icon: 'mail-outline', label: 'Email', value: profile?.email || profileData.email },
                  { icon: 'briefcase-outline', label: 'Role', value: profile?.role, isLast: !extraRow },
                  ...(extraRow ? [{ ...extraRow, isLast: true }] : []),
                ]}
              />
            </ProfileSection>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ProfileTopBar onBackPress={handleBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, bottomPadding(insets, 24)]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeaderCard
          profile={profile}
          academic={academic}
          geographic={geographic}
          onEditProfile={handleEditProfile}
        />

        <View style={styles.sectionsWrap}>
          <ProfileSection
            title="Academic Background"
            subtitle="Education and score details"
            icon="school-outline"
          >
            <ProfileRows rows={academicRows} />

            {tests.length > 0 ? <TestScores tests={tests} /> : null}
          </ProfileSection>

          <ProfileSection
            title="Geographic Preferences"
            subtitle="Preferred study location"
            icon="earth-outline"
          >
            <ProfileRows rows={geographicRows} />
          </ProfileSection>

          <ProfileSection
            title="Financial Preferences"
            subtitle="Budget and funding options"
            icon="wallet-outline"
          >
            <ProfileRows rows={financialRows} />
          </ProfileSection>

          <ProfileSection
            title="Priority Preferences"
            subtitle="What matters most in your ranking"
            icon="star-outline"
          >
            <ProfileRows rows={priorityRows} />
          </ProfileSection>
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileTopBar({ onBackPress }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={authTheme.gradients.button}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[dashboardStyles.topBar, topBarPadding(insets)]}
    >
      <TouchableOpacity
        style={styles.topBackButton}
        activeOpacity={0.82}
        onPress={onBackPress}
      >
        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.topBrandRow}>
        <View style={dashboardStyles.navLogoWrap}>
          <Image
            source={LOGO}
            style={dashboardStyles.navLogo}
            resizeMode="contain"
          />
        </View>

        <Text style={dashboardStyles.navBrand}>UniMatch</Text>
      </View>

      <View style={styles.topRightPlaceholder} />
    </LinearGradient>
  );
}

function ProfileHeaderCard({
  profile,
  academic,
  geographic,
  onEditProfile,
}) {
  return (
    <View style={styles.profileHeaderCard}>
      <LinearGradient
        colors={[
          authTheme.colors.brandMintDeep,
          authTheme.colors.white,
          authTheme.colors.brandCyanSoft,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileHeaderGradient}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.avatarOuter}>
            <LinearGradient
              colors={authTheme.gradients.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <Ionicons name="person" size={30} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <View style={styles.profileTitleBlock}>
            <Text style={styles.profileName} numberOfLines={1}>
              {profile?.full_name || 'UniMatch User'}
            </Text>

          </View>
        </View>

        <View style={styles.headerStatsRow}>
          <MiniInfoPill
            icon="school-outline"
            label="Level"
            value={normalizeIntendedLevel(academic?.intended_education_level) || 'Not set'}
          />

          <MiniInfoPill
            icon="earth-outline"
            label="Region"
            value={geographic?.preferred_region || 'Not set'}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.editProfilePill}
          onPress={onEditProfile}
        >
          <Ionicons
            name="pencil-outline"
            size={15}
            color={authTheme.colors.brandTeal}
          />

          <Text style={styles.editProfilePillText}>Edit Profile Setup</Text>

          <Ionicons
            name="chevron-forward"
            size={15}
            color={authTheme.colors.brandTeal}
          />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

function MiniInfoPill({ icon, label, value }) {
  return (
    <View style={styles.miniInfoPill}>
      <View style={styles.miniInfoIconBox}>
        <Ionicons name={icon} size={15} color={authTheme.colors.brandTeal} />
      </View>

      <View style={styles.miniInfoTextBox}>
        <Text style={styles.miniInfoLabel}>{label}</Text>

        <Text style={styles.miniInfoValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ProfileSection({ title, subtitle, icon, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconBox}>
          <Ionicons name={icon} size={21} color={authTheme.colors.brandTeal} />
        </View>

        <View style={styles.sectionTitleBlock}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.rowsCard}>{children}</View>
    </View>
  );
}

function ProfileRows({ rows }) {
  return (
    <>
      {rows.map((row) => (
        <ProfileRow
          key={`${row.label}-${row.value}`}
          icon={row.icon}
          label={row.label}
          value={row.value}
          isLast={row.isLast}
        />
      ))}
    </>
  );
}

function ProfileRow({ icon, label, value, isLast = false }) {
  const finalValue =
    value === null || value === undefined || value === ''
      ? 'Not provided'
      : String(value);

  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIconBox}>
          <Ionicons name={icon} size={15} color={authTheme.colors.brandTeal} />
        </View>

        <Text style={styles.rowLabel}>{label}</Text>
      </View>

      <Text style={styles.rowValue}>{finalValue}</Text>
    </View>
  );
}

function TestScores({ tests }) {
  return (
    <View style={styles.testsBox}>
      <Text style={styles.testsTitle}>Test Scores</Text>

      <View style={styles.testPillsWrap}>
        {tests.map((test, index) => (
          <View
            key={`${test.test_name}-${test.score}-${index}`}
            style={styles.testPill}
          >
            <Ionicons
              name="checkmark-circle"
              size={13}
              color={authTheme.colors.brandTeal}
            />

            <Text style={styles.testPillText}>
              {test.test_name}: {test.score}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return 'Not provided';
  }

  return `$${numericValue.toLocaleString()} / year`;
}