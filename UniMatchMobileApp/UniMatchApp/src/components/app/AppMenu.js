// src/components/app/AppMenu.js
//
// Side menu for every role (web: Navbar.jsx sidebar). The items come from
// menuConfig.menuGroupsFor(role); the footer has Profile and Logout.
// "Search Universities" opens the role's search: students search QS, THE
// and ARWU at once, researchers open the Dataset Explorer.

import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../AppText';
import { GradientButton, InlineLoader, SearchInput, SegmentedControl, useDebouncedValue } from '../researcher/ResearcherUI';
import { useOpenUniversity } from '../UniversityLink';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { RESEARCHER_ROUTES } from '../../constants/researcherConstants';
import { logout, useUserRole } from '../../services/userRole';
import { searchAllRankings } from '../../services/universitySearch';
import { menuGroupsFor, ROLE_LABELS } from './menuConfig';

const DATASET_OPTIONS = [
  { value: 'qs', label: 'QS' },
  { value: 'the', label: 'THE' },
  { value: 'arwu', label: 'ARWU' },
];

function MenuRow({ icon, label, hint, active, onPress, danger }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.menuItem, active && styles.menuItemActive]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.menuIconBox, danger && { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
        <Ionicons name={icon} size={16} color={danger ? '#DC2626' : authTheme.colors.brandTeal} />
      </View>
      <View style={styles.flex1}>
        <Text style={danger ? styles.logoutLabel : [styles.menuLabel, active && styles.menuLabelActive]}>{label}</Text>
        {!!hint && (
          <Text style={styles.menuHint} numberOfLines={1}>
            {hint}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Researchers: open the Dataset Explorer of one ranking with the text filled in.
function ResearcherSearchModal({ visible, onClose, defaultDataset }) {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [dataset, setDataset] = useState(defaultDataset || 'qs');

  const submit = () => {
    if (!query.trim()) return;
    onClose();
    navigation.navigate(
      RESEARCHER_ROUTES.dataset,
      { dataset, searchText: query.trim(), searchNonce: Date.now() },
      { pop: true }
    );
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
            <SegmentedControl options={DATASET_OPTIONS} value={dataset} onChange={setDataset} />
            <GradientButton title="Search" onPress={submit} disabled={!query.trim()} />
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Students (and other roles): search QS, THE and ARWU together and open a
// university's page, or open the full search in one ranking.
export function UniversitySearchModal({ visible, onClose, allowRankings = true }) {
  const navigation = useNavigation();
  const openUniversity = useOpenUniversity();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState('qs');
  const debounced = useDebouncedValue(query.trim(), 250);

  useEffect(() => {
    let active = true;
    if (!debounced) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    searchAllRankings(debounced)
      .then((list) => active && setResults(list.slice(0, 10)))
      .catch(() => active && setResults([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [debounced]);

  const close = useCallback(() => {
    onClose();
    setQuery('');
  }, [onClose]);

  const openFullSearch = () => {
    close();
    navigation.navigate('Rankings', { dataset, searchText: query.trim(), openTab: 'official', searchNonce: Date.now() }, { pop: true });
  };

  const typing = !!query.trim() && (loading || query.trim() !== debounced);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.modalBackdrop} onPress={close}>
          <Pressable style={[styles.modalCard, { maxHeight: '85%' }]} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Search Universities</Text>
            <Text style={[styles.mutedText, { marginBottom: 10 }]}>Search QS, THE and ARWU together.</Text>
            <SearchInput value={query} onChangeText={setQuery} placeholder="Search university..." />

            <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
              {!query.trim() ? (
                <Text style={[styles.mutedText, { paddingVertical: 8 }]}>Type a university name or country.</Text>
              ) : typing ? (
                <InlineLoader />
              ) : results.length === 0 ? (
                <Text style={[styles.mutedText, { paddingVertical: 8 }]}>No university found. Try another name.</Text>
              ) : (
                results.map((item) => (
                  <TouchableOpacity
                    key={`${item.name}|${item.country}`}
                    style={styles.suggestionRow}
                    activeOpacity={0.8}
                    onPress={() => {
                      close();
                      openUniversity({ name: item.name, country: item.country, dataset: item.dataset, rank: item.official_rank });
                    }}
                  >
                    <View style={styles.flex1}>
                      <Text style={styles.suggestionName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {!!item.country && <Text style={styles.suggestionSub}>{item.country}</Text>}
                    </View>
                    <Text style={styles.suggestionMeta}>{String(item.dataset || '').toUpperCase()}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {allowRankings && (
              <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 }}>
                <Text style={styles.label}>Or open the full ranking search</Text>
                <SegmentedControl options={DATASET_OPTIONS} value={dataset} onChange={setDataset} />
                <GradientButton title="Open rankings" small onPress={openFullSearch} />
              </View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AppMenu({ visible, onClose, activeKey, context }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { key: role, fullName } = useUserRole();
  const [searchOpen, setSearchOpen] = useState(false);
  const groups = menuGroupsFor(role, context || {});

  const go = useCallback(
    (item) => {
      onClose();
      if (item.action === 'search') {
        setSearchOpen(true);
        return;
      }
      navigation.navigate(item.route, item.params, { pop: true });
    },
    [navigation, onClose]
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.menuOverlay} onPress={onClose}>
          <Pressable
            style={[styles.menuPanel, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.eyebrow}>{ROLE_LABELS[role] || 'UNIMATCH'}</Text>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                {fullName || 'UniMatch'}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ height: 6 }} />
              {groups.map((group, index) => (
                <View key={group.title || `group-${index}`}>
                  {!!group.title && <Text style={styles.menuGroupTitle}>{group.title}</Text>}
                  {group.items.map((item) => (
                    <MenuRow
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      hint={item.hint}
                      active={activeKey === item.key}
                      onPress={() => go(item)}
                    />
                  ))}
                </View>
              ))}

              <View style={styles.menuDivider} />
              <MenuRow
                icon="person-circle-outline"
                label="Profile"
                hint="Your account"
                active={activeKey === 'profile'}
                onPress={() => go({ route: 'ProfileView' })}
              />
              <MenuRow
                icon="log-out-outline"
                label="Logout"
                danger
                onPress={() => {
                  onClose();
                  logout(navigation);
                }}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {role === 'researcher' ? (
        <ResearcherSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} defaultDataset={context?.dataset} />
      ) : (
        <UniversitySearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} allowRankings={role === 'student'} />
      )}
    </>
  );
}
