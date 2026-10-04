// src/components/researcher/ResearcherLayout.js
//
// Frame for every Researcher screen: gradient top bar (back + menu), the
// researcher menu (same groups as the web sidebar: Explore data, Analyse &
// compare, My work) and the scrollable page body.

import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bottomPadding } from '../../utils/safeArea';

import { supabase } from '../../services/supabase';
import { authTheme } from '../../styles/authTheme';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { RESEARCHER_ROUTES } from '../../constants/researcherConstants';
import { GradientButton, SearchInput, SegmentedControl, ResearcherTopBar } from './ResearcherUI';

function buildGroups(dataset, year) {
  const withYear = (params) => (year ? { ...params, year } : params);

  return [
    {
      title: 'Explore data',
      items: [
        {
          key: 'dataset',
          label: 'Dataset Explorer',
          hint: 'Browse QS, THE and ARWU data',
          icon: '📂',
          route: RESEARCHER_ROUTES.dataset,
          params: withYear({ dataset }),
        },
        {
          key: 'statistics',
          label: 'Statistics',
          hint: 'Average, middle value, missing',
          icon: '📊',
          route: RESEARCHER_ROUTES.statistics,
          params: withYear({ dataset, view: 'summary' }),
        },
        {
          key: 'relationships',
          label: 'Relationships',
          hint: 'Heatmap: which scores go together',
          icon: '🟩',
          route: RESEARCHER_ROUTES.statistics,
          params: withYear({ dataset, view: 'relationships' }),
        },
        {
          key: 'datasetComparison',
          label: 'Dataset Comparison',
          hint: 'QS, THE and ARWU side by side',
          icon: '🧭',
          route: RESEARCHER_ROUTES.datasetComparison,
        },
        {
          key: 'attributes',
          label: 'Attributes Explorer',
          hint: 'Fees, scholarships, acceptance',
          icon: '🗂️',
          route: RESEARCHER_ROUTES.attributes,
        },
      ],
    },
    {
      title: 'Analyse & compare',
      items: [
        {
          key: 'compare',
          label: 'Compare Universities',
          hint: 'Up to 3, every indicator',
          icon: '⚖️',
          route: RESEARCHER_ROUTES.compare,
          params: withYear({ dataset }),
        },
        {
          key: 'journey',
          label: 'University Journey',
          hint: 'Rank over the years',
          icon: '📈',
          route: RESEARCHER_ROUTES.journey,
        },
        {
          key: 'weights',
          label: 'Weight Analysis',
          hint: 'Change weights, see new ranks',
          icon: '🎚️',
          route: RESEARCHER_ROUTES.weights,
          params: withYear({ dataset, section: 'weights' }),
        },
        {
          key: 'stability',
          label: 'Rank Stability',
          hint: 'How much ranks move',
          icon: '🎯',
          route: RESEARCHER_ROUTES.weights,
          params: withYear({ dataset, section: 'rank-stability' }),
        },
      ],
    },
    {
      title: 'My work',
      items: [
        {
          key: 'experiments',
          label: 'Saved Experiments',
          hint: 'Your saved weight settings',
          icon: '💾',
          route: RESEARCHER_ROUTES.weights,
          params: withYear({ dataset, section: 'saved-experiments' }),
        },
        {
          key: 'report',
          label: 'Research Report',
          hint: 'Full write-up, PDF or CSV',
          icon: '📄',
          route: RESEARCHER_ROUTES.report,
        },
      ],
    },
  ];
}

function MenuRow({ icon, label, hint, active, onPress, ionicon, danger }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.menuItem, active && styles.menuItemActive]}
      onPress={onPress}
    >
      <View style={[styles.menuIconBox, danger && { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
        {ionicon ? (
          <Ionicons name={ionicon} size={16} color={danger ? '#DC2626' : authTheme.colors.brandTeal} />
        ) : (
          <Text style={styles.menuEmoji}>{icon}</Text>
        )}
      </View>
      <View style={styles.flex1}>
        <Text style={danger ? styles.logoutLabel : [styles.menuLabel, active && styles.menuLabelActive]}>
          {label}
        </Text>
        {!!hint && (
          <Text style={styles.menuHint} numberOfLines={1}>
            {hint}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const SEARCH_DATASETS = [
  { value: 'qs', label: 'QS' },
  { value: 'the', label: 'THE' },
  { value: 'arwu', label: 'ARWU' },
];

// Web navbar "Search Universities" for researchers: opens the Dataset
// Explorer of the chosen ranking with the search text already filled in.
function UniversitySearchModal({ visible, onClose, onSearch, defaultDataset }) {
  const [query, setQuery] = useState('');
  const [dataset, setDataset] = useState(defaultDataset || 'qs');

  const submit = () => {
    if (!query.trim()) return;
    onSearch(dataset, query.trim());
    setQuery('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.modalBackdrop} onPress={onClose}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Search Universities</Text>
            <Text style={[styles.mutedText, { marginBottom: 12 }]}>Opens the results in the Dataset Explorer.</Text>
            <SearchInput value={query} onChangeText={setQuery} placeholder="University or country..." />
            <Text style={styles.label}>Open in</Text>
            <SegmentedControl options={SEARCH_DATASETS} value={dataset} onChange={setDataset} />
            <GradientButton title="Search" onPress={submit} disabled={!query.trim()} />
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ResearcherMenu({ visible, onClose, navigation, activeKey, context }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const dataset = context?.dataset || 'qs';
  const groups = buildGroups(dataset, context?.year);

  const go = useCallback(
    (route, params) => {
      onClose();
      navigation.navigate(route, params, { pop: true });
    },
    [navigation, onClose]
  );

  const logout = useCallback(async () => {
    onClose();
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [navigation, onClose]);

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.menuOverlay} onPress={onClose}>
          <Pressable
            style={[styles.menuPanel, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.eyebrow}>Researcher tools</Text>
              <Text style={styles.sectionTitle}>UniMatch Research</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ height: 8 }} />
              <MenuRow
                ionicon="home-outline"
                label="Dashboard"
                active={activeKey === 'dashboard'}
                onPress={() => go('Dashboard')}
              />
              <MenuRow
                ionicon="search-outline"
                label="Search Universities"
                onPress={() => {
                  onClose();
                  setSearchOpen(true);
                }}
              />

              {groups.map((group) => (
                <View key={group.title}>
                  <Text style={styles.menuGroupTitle}>{group.title}</Text>
                  {group.items.map((item) => (
                    <MenuRow
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      hint={item.hint}
                      active={activeKey === item.key}
                      onPress={() => go(item.route, item.params)}
                    />
                  ))}
                </View>
              ))}

              <View style={styles.menuDivider} />
              <MenuRow
                ionicon="person-circle-outline"
                label="Profile"
                active={activeKey === 'profile'}
                onPress={() => go('ProfileView')}
              />
              <MenuRow ionicon="log-out-outline" label="Logout" danger onPress={logout} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <UniversitySearchModal
        visible={searchOpen}
        defaultDataset={dataset}
        onClose={() => setSearchOpen(false)}
        onSearch={(searchDataset, text) => {
          setSearchOpen(false);
          navigation.navigate(
            RESEARCHER_ROUTES.dataset,
            { dataset: searchDataset, searchText: text, searchNonce: Date.now() },
            { pop: true }
          );
        }}
      />
    </>
  );
}

export default function ResearcherLayout({
  navigation,
  activeKey,
  context,
  children,
  scrollRef,
  refreshing,
  onRefresh,
  isRoot = false,
  keyboardShouldPersistTaps = 'handled',
}) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Dashboard');
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <ResearcherTopBar onBack={isRoot ? undefined : handleBack} onMenu={() => setMenuOpen(true)} />

      <ResearcherMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        navigation={navigation}
        activeKey={activeKey}
        context={context}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.content, bottomPadding(insets, 32)]}
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
    </View>
  );
}
