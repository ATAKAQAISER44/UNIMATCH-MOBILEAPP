// src/navigation/AppNavigator.js
//
// Every screen of the app. Role-specific screens are wrapped in withRoles()
// so a user can only open the screens of their own role (University page and
// Profile are open to every signed-in user).

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { supabase } from '../services/supabase';
import { resetUserRole, ROLE_ACCESS } from '../services/userRole';
import { LoadingScreen } from '../components';
import { withRoles } from '../components/app/RoleGate';
import { ADMIN_ROUTES, POLICY_ROUTES, STUDENT_ROUTES } from '../components/app/menuConfig';

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
import UniversityScreen from '../screens/UniversityScreen';

import SavedUniversitiesScreen from '../screens/student/SavedUniversitiesScreen';
import CompareUniversitiesScreen from '../screens/student/CompareUniversitiesScreen';
import ShortlistScreen from '../screens/student/ShortlistScreen';

import ResearcherDatasetScreen from '../screens/researcher/ResearcherDatasetScreen';
import ResearcherStatisticsScreen from '../screens/researcher/ResearcherStatisticsScreen';
import ResearcherWeightAnalysisScreen from '../screens/researcher/ResearcherWeightAnalysisScreen';
import ResearcherCompareScreen from '../screens/researcher/ResearcherCompareScreen';
import ResearcherJourneyScreen from '../screens/researcher/ResearcherJourneyScreen';
import ResearcherDatasetComparisonScreen from '../screens/researcher/ResearcherDatasetComparisonScreen';
import ResearcherAttributesScreen from '../screens/researcher/ResearcherAttributesScreen';
import ResearcherReportScreen from '../screens/researcher/ResearcherReportScreen';

import AdminPerformanceScreen from '../screens/administrator/AdminPerformanceScreen';
import AdminProfileScreen from '../screens/administrator/AdminProfileScreen';
import AdminBenchmarkScreen from '../screens/administrator/AdminBenchmarkScreen';
import AdminWhatIfScreen from '../screens/administrator/AdminWhatIfScreen';
import AdminDemandScreen from '../screens/administrator/AdminDemandScreen';
import AdminReportScreen from '../screens/administrator/AdminReportScreen';

import PolicyCountryScreen from '../screens/policymaker/PolicyCountryScreen';
import PolicyCompareScreen from '../screens/policymaker/PolicyCompareScreen';
import PolicyReportScreen from '../screens/policymaker/PolicyReportScreen';

const Stack = createNativeStackNavigator();

const forStudents = (Screen) => withRoles(Screen, ROLE_ACCESS.student);
const forResearchers = (Screen) => withRoles(Screen, ROLE_ACCESS.researcher);
const forAdministrators = (Screen) => withRoles(Screen, ROLE_ACCESS.administrator);
const forPolicymakers = (Screen) => withRoles(Screen, ROLE_ACCESS.policymaker);

// [route name, component, extra options] - wrapped once, at load time.
const GUARDED_SCREENS = [
  ['ProfileSetup', forStudents(ProfileSetupScreen)],
  ['Rankings', forStudents(RankingsScreen), { animation: 'slide_from_bottom' }],
  ['SmartMatch', forStudents(SmartMatchScreen)],
  [STUDENT_ROUTES.saved, forStudents(SavedUniversitiesScreen)],
  [STUDENT_ROUTES.compare, forStudents(CompareUniversitiesScreen)],
  [STUDENT_ROUTES.shortlist, forStudents(ShortlistScreen)],

  ['ResearcherDataset', forResearchers(ResearcherDatasetScreen)],
  ['ResearcherStatistics', forResearchers(ResearcherStatisticsScreen)],
  ['ResearcherWeightAnalysis', forResearchers(ResearcherWeightAnalysisScreen)],
  ['ResearcherCompare', forResearchers(ResearcherCompareScreen)],
  ['ResearcherJourney', forResearchers(ResearcherJourneyScreen)],
  ['ResearcherDatasetComparison', forResearchers(ResearcherDatasetComparisonScreen)],
  ['ResearcherAttributes', withRoles(ResearcherAttributesScreen, ROLE_ACCESS.attributes)],
  ['ResearcherReport', forResearchers(ResearcherReportScreen)],

  [ADMIN_ROUTES.performance, forAdministrators(AdminPerformanceScreen)],
  [ADMIN_ROUTES.profile, forAdministrators(AdminProfileScreen)],
  [ADMIN_ROUTES.benchmark, forAdministrators(AdminBenchmarkScreen)],
  [ADMIN_ROUTES.whatIf, forAdministrators(AdminWhatIfScreen)],
  [ADMIN_ROUTES.demand, forAdministrators(AdminDemandScreen)],
  [ADMIN_ROUTES.report, forAdministrators(AdminReportScreen)],

  [POLICY_ROUTES.country, forPolicymakers(PolicyCountryScreen)],
  [POLICY_ROUTES.compare, forPolicymakers(PolicyCompareScreen)],
  [POLICY_ROUTES.report, forPolicymakers(PolicyReportScreen)],
];

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
      .select('role, profile_completed, full_name')
      .eq('id', session.user.id)
      .maybeSingle();

    // Share the role with every screen (menus, role guards) without a second lookup.
    resetUserRole({ userId: session.user.id, role: profile?.role || '', fullName: profile?.full_name || '', user: session.user });

    if (!profile?.role) {
      setInitialRoute('RoleSelection');
    } else if (profile.role === 'Student' && !profile.profile_completed) {
      setInitialRoute('ProfileSetup');
    } else {
      setInitialRoute('Dashboard');
    }
  };

  if (!initialRoute) {
    return <LoadingScreen />;
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

        {/* Dashboard shows the dashboard of the signed-in role. */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="ProfileView" component={ProfileViewScreen} />
        <Stack.Screen name="University" component={UniversityScreen} />

        {GUARDED_SCREENS.map(([name, component, options]) => (
          <Stack.Screen key={name} name={name} component={component} options={options} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
