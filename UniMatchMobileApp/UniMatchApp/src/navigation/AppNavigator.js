
// src/navigation/AppNavigator.js

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { supabase } from '../services/supabase';
import { LoadingScreen } from '../components';

import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import RankingsScreen from '../screens/RankingsScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import SmartMatchScreen from '../screens/SmartMatchScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ProfileViewScreen from '../screens/ProfileViewScreen';

import ResearcherDatasetScreen from '../screens/researcher/ResearcherDatasetScreen';
import ResearcherStatisticsScreen from '../screens/researcher/ResearcherStatisticsScreen';
import ResearcherWeightAnalysisScreen from '../screens/researcher/ResearcherWeightAnalysisScreen';
import ResearcherCompareScreen from '../screens/researcher/ResearcherCompareScreen';
import ResearcherJourneyScreen from '../screens/researcher/ResearcherJourneyScreen';
import ResearcherDatasetComparisonScreen from '../screens/researcher/ResearcherDatasetComparisonScreen';
import ResearcherAttributesScreen from '../screens/researcher/ResearcherAttributesScreen';
import ResearcherReportScreen from '../screens/researcher/ResearcherReportScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setInitialRoute('Login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, profile_completed')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profile?.role) {
      setInitialRoute('RoleSelection');
    } else if (profile.role === 'Student' && !profile.profile_completed) {
      setInitialRoute('ProfileSetup');
    } else {
      setInitialRoute('Dashboard');
    }
  };

  if (!initialRoute) {
    return <LoadingScreen message="Starting UniMatch..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />

        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="ProfileView" component={ProfileViewScreen} />

        <Stack.Screen
          name="Rankings"
          component={RankingsScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

        <Stack.Screen
          name="SmartMatch"
          component={SmartMatchScreen}
          options={{ headerShown: false }}
        />

        {/* Researcher stakeholder screens */}
        <Stack.Screen name="ResearcherDataset" component={ResearcherDatasetScreen} />
        <Stack.Screen name="ResearcherStatistics" component={ResearcherStatisticsScreen} />
        <Stack.Screen name="ResearcherWeightAnalysis" component={ResearcherWeightAnalysisScreen} />
        <Stack.Screen name="ResearcherCompare" component={ResearcherCompareScreen} />
        <Stack.Screen name="ResearcherJourney" component={ResearcherJourneyScreen} />
        <Stack.Screen name="ResearcherDatasetComparison" component={ResearcherDatasetComparisonScreen} />
        <Stack.Screen name="ResearcherAttributes" component={ResearcherAttributesScreen} />
        <Stack.Screen name="ResearcherReport" component={ResearcherReportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}