
// src/screens/DashboardScreen.js

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';

import { supabase } from '../services/supabase';
import { getSignedInUser } from '../services/session';
import { apiPost } from '../services/api';
import { LoadingScreen } from '../components';
import { dashboardStyles as styles } from '../styles/dashboardStyles';
import { authTheme } from '../styles/authTheme';

import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import DashboardHeaderMenu from '../components/dashboard/DashboardHeaderMenu';
import DashboardHero from '../components/dashboard/DashboardHero';
import DatasetSection from '../components/dashboard/DatasetSection';
import ResearcherDashboard from './researcher/ResearcherDashboard';

import {
  DATASETS,
  DEFAULT_DEGREE,
  DEFAULT_PRIORITY,
  DEFAULT_RECOMMENDED_DATASET,
} from '../constants/dashboardConstants';

import {
  getUserPriorities,
  isRecommendedDataset,
} from '../utils/dashboardUtils';

function isResearcherRole(role) {
  return String(role || '').trim().toLowerCase() === 'researcher';
}

export default function DashboardScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [academic, setAcademic] = useState(null);
  const [priority, setPriority] = useState(null);
  const [recommended, setRecommended] = useState(DEFAULT_RECOMMENDED_DATASET);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const mainPriority = useMemo(() => {
    return priority?.priority_1 || priority?.priority_type || DEFAULT_PRIORITY;
  }, [priority]);

  const intendedLevel = useMemo(() => {
    return academic?.intended_education_level || '—';
  }, [academic]);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const openMenu = useCallback(() => {
    setMenuVisible(true);
  }, []);

  const updateRecommendationState = useCallback((dataset, reason) => {
    setRecommended(dataset || DEFAULT_RECOMMENDED_DATASET);
    setJustification(reason || '');
  }, []);

  const setDefaultRecommendation = useCallback(() => {
    updateRecommendationState(
      DEFAULT_RECOMMENDED_DATASET,
      'Showing THE by default because your personalised recommendation could not be loaded right now. Pull down to try again.'
    );
  }, [updateRecommendationState]);

  const fetchDatasetRecommendation = useCallback(
    async ({ academicData, priorityData }) => {
      try {
        const priorities = getUserPriorities(priorityData);

        // PERF: short timeout - this is a tiny lookup, and the dashboard
        // must never wait minutes for it. On failure we use the default.
        const { ok, data } = await apiPost(
          '/recommend-dataset',
          {
            degree: academicData?.intended_education_level || DEFAULT_DEGREE,
            priorities: priorities.length ? priorities : [DEFAULT_PRIORITY],
          },
          { timeoutMs: 8000 }
        );

        if (!ok) {
          throw new Error('Dataset recommendation request failed');
        }

        updateRecommendationState(
          data?.recommended_dataset,
          data?.justification
        );
      } catch (error) {
        console.log('Dataset recommendation error:', error?.message || error);
        setDefaultRecommendation();
      }
    },
    [setDefaultRecommendation, updateRecommendationState]
  );

  const fetchDashboardData = useCallback(async (userId) => {
    const [profileResponse, academicResponse, priorityResponse] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),

        supabase
          .from('academic_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),

        supabase
          .from('priority_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

    if (profileResponse.error) throw profileResponse.error;
    if (academicResponse.error) throw academicResponse.error;
    if (priorityResponse.error) throw priorityResponse.error;

    return {
      profileData: profileResponse.data,
      academicData: academicResponse.data,
      priorityData: priorityResponse.data,
    };
  }, []);

  const updateDashboardState = useCallback(
    ({ profileData, academicData, priorityData }) => {
      setProfile(profileData);
      setAcademic(academicData);
      setPriority(priorityData);
    },
    []
  );

  const loadDashboard = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await getSignedInUser();

      if (userError || !user) {
        navigation.replace('Login');
        return;
      }

      const dashboardData = await fetchDashboardData(user.id);

      // Researchers do not fill in the student profile, so they go straight
      // to the Researcher Dashboard (no profile setup, no recommendation).
      if (isResearcherRole(dashboardData.profileData?.role)) {
        updateDashboardState(dashboardData);
        return;
      }

      if (!dashboardData.profileData?.profile_completed) {
        navigation.replace('ProfileSetup');
        return;
      }

      updateDashboardState(dashboardData);

      await fetchDatasetRecommendation({
        academicData: dashboardData.academicData,
        priorityData: dashboardData.priorityData,
      });
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    navigation,
    fetchDashboardData,
    updateDashboardState,
    fetchDatasetRecommendation,
  ]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error.message);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      navigation.replace('Login');
    }
  }, [navigation]);

  const handleMenuLogout = useCallback(async () => {
    closeMenu();
    await handleLogout();
  }, [closeMenu, handleLogout]);

  const handleGoDashboard = useCallback(() => {
    closeMenu();
    navigation.navigate('Dashboard', undefined, { pop: true });
  }, [closeMenu, navigation]);

  const handleProfilePress = useCallback(() => {
    closeMenu();
    navigation.navigate('ProfileView', undefined, { pop: true });
  }, [closeMenu, navigation]);

  const handleOpenRankings = useCallback(
    (dataset) => {
      navigation.navigate('Rankings', {
        dataset: dataset.key,
        title: dataset.shortTitle,
      }, { pop: true });
    },
    [navigation]
  );

  const handleOpenRecommended = useCallback(() => {
    const matchedDataset =
      DATASETS.find((dataset) =>
        isRecommendedDataset(recommended, dataset.system)
      ) || DATASETS[1];

    handleOpenRankings(matchedDataset);
  }, [recommended, handleOpenRankings]);

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  if (isResearcherRole(profile?.role)) {
    return (
      <ResearcherDashboard
        navigation={navigation}
        profile={profile}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <DashboardTopBar onMenuPress={openMenu} />

      <DashboardHeaderMenu
        visible={menuVisible}
        onClose={closeMenu}
        onDashboard={handleGoDashboard}
        onProfile={handleProfilePress}
        onLogout={handleMenuLogout}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={authTheme.colors.brandTeal}
            colors={[authTheme.colors.brandTeal]}
          />
        }
      >
        <DashboardHero
          profile={profile}
          intendedLevel={intendedLevel}
          mainPriority={mainPriority}
          recommendedSystem={recommended}
          recommendationJustification={justification}
          onOpenRecommended={handleOpenRecommended}
        />

        <DatasetSection
          recommendedSystem={recommended}
          onOpenRankings={handleOpenRankings}
        />
      </ScrollView>
    </View>
  );
}