// src/components/app/AppLayout.js
//
// Frame for every role's screens: gradient top bar (back + menu, with the
// role under the logo), the role's side menu (AppMenu) and the scrollable,
// width-capped page body. Researcher, Administrator, Policymaker and the new
// Student screens all use it.

import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ResearcherTopBar } from '../researcher/ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { bottomPadding } from '../../utils/safeArea';
import { useUserRole } from '../../services/userRole';
import AppMenu from './AppMenu';
import { ROLE_LABELS } from './menuConfig';

export default function AppLayout({
  navigation,
  activeKey,
  context,
  children,
  scrollRef,
  refreshing,
  onRefresh,
  isRoot = false,
  keyboardShouldPersistTaps = 'handled',
  footer,
  bottomSpace = 32,
}) {
  const insets = useSafeAreaInsets();
  const { key: role } = useUserRole();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Dashboard');
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <ResearcherTopBar
        onBack={isRoot ? undefined : handleBack}
        onMenu={() => setMenuOpen(true)}
        roleLabel={ROLE_LABELS[role] || ''}
      />

      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey={activeKey} context={context} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.content, bottomPadding(insets, bottomSpace)]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={authTheme.colors.brandTeal}
                colors={[authTheme.colors.brandTeal]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      {footer}
    </View>
  );
}
