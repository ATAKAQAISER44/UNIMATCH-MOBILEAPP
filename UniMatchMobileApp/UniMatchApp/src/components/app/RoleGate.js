// src/components/app/RoleGate.js
//
// Role-based access for screens. withRoles(Screen, ['administrator']) shows
// the screen only to those roles; anyone else sees a short notice with a way
// back to their own dashboard (and nothing from the screen is loaded).

import React from 'react';
import { View } from 'react-native';

import { Text } from '../AppText';
import { LoadingScreen } from '..';
import AppLayout from './AppLayout';
import { Card, GradientButton } from '../researcher/ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { canAccess, ROLE_NAMES, useUserRole } from '../../services/userRole';

function NoAccess({ navigation, allowed }) {
  const names = allowed.map((key) => ROLE_NAMES[key]).join(' and ');
  return (
    <AppLayout navigation={navigation}>
      <Card>
        <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Not available for your role</Text>
        <Text style={[styles.mutedText, { textAlign: 'center', marginVertical: 8 }]}>This page is for {names}.</Text>
        <View style={{ marginTop: 4 }}>
          <GradientButton
            title="Go to my dashboard"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] })}
          />
        </View>
      </Card>
    </AppLayout>
  );
}

export function withRoles(Screen, allowed) {
  function Gated(props) {
    const { key, loading } = useUserRole();
    if (loading) return <LoadingScreen />;
    if (!canAccess(key, allowed)) return <NoAccess navigation={props.navigation} allowed={allowed} />;
    return <Screen {...props} />;
  }
  Gated.displayName = `withRoles(${Screen.displayName || Screen.name || 'Screen'})`;
  return Gated;
}
