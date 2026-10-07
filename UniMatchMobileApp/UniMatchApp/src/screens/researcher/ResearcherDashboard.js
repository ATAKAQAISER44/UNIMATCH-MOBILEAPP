// src/screens/researcher/ResearcherDashboard.js
//
// Dashboard shown to users with the Researcher role (web: ResearcherDashboard).
// Rendered by DashboardScreen, so the "Dashboard" route stays the same for
// every role. Same layout as the web, in four numbered steps:
//   1. choose a dataset (the dataset-based tools open on it),
//   2. explore the data, 3. analyse & experiment, 4. save & report
//      (with the recent experiments).

import React, { memo, useCallback, useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/AppText';

import ResearcherLayout from '../../components/researcher/ResearcherLayout';
import { Card, PageHeader } from '../../components/researcher/ResearcherUI';
import { researcherGroups } from '../../components/app/menuConfig';
import { RANKING_ABOUT } from '../../constants/roleConstants';
import { dashboardStyles } from '../../styles/dashboardStyles';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { loadSavedExperiments } from '../../utils/researcherExperiments';
import {
  RESEARCHER_DATASETS,
  RESEARCHER_DATASET_KEYS,
  RESEARCHER_METRICS,
  RESEARCHER_ROUTES,
} from '../../constants/researcherConstants';

const FEATURES = {
  qs: ['Reputation', 'Employability'],
  the: ['Teaching', 'Research quality'],
  arwu: ['Research output', 'Awards'],
};

const STEPS = [
  { title: 'Choose a dataset' },
  { title: 'Explore the data', hint: 'Understand each ranking before changing anything.' },
  { title: 'Analyse & experiment', hint: 'Compare universities and test new weights.' },
  { title: 'Save & report', hint: 'Keep your experiments and write them up.' },
];

// The dataset chosen in step 1, kept while the app is open.
let chosenDataset = 'qs';

function StepNumber({ n, size = 26 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: authTheme.colors.brandTeal,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>{n}</Text>
    </View>
  );
}

function StepHeading({ n, title, hint }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
      <StepNumber n={n} />
      <View style={styles.flex1}>
        <Text style={dashboardStyles.sectionTitle}>{title}</Text>
        {!!hint && <Text style={[styles.mutedText, { marginTop: 1 }]}>{hint}</Text>}
      </View>
    </View>
  );
}

function Chip({ label }) {
  return (
    <View
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: authTheme.colors.brandBorder,
        paddingHorizontal: 9,
        paddingVertical: 3,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '800', color: authTheme.colors.brandTeal }}>{label}</Text>
    </View>
  );
}

const DatasetCard = memo(function DatasetCard({ datasetKey, selected, onSelect, onOpen }) {
  const dataset = RESEARCHER_DATASETS[datasetKey];
  const indicators = (RESEARCHER_METRICS[datasetKey] || []).length;

  return (
    <View
      style={[
        dashboardStyles.datasetTile,
        { minHeight: 0 },
        selected && { borderColor: authTheme.colors.brandTeal, borderWidth: 2 },
      ]}
    >
      <View style={[styles.rowBetween, { alignItems: 'flex-start', marginBottom: 9 }]}>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#DCFCE7',
            backgroundColor: '#FFFFFF',
            padding: 6,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={dataset.logo} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </View>
        <View style={{ borderRadius: 999, backgroundColor: authTheme.colors.brandMint, paddingHorizontal: 9, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '900', color: authTheme.colors.brandTeal }}>{indicators} indicators</Text>
        </View>
      </View>

      <Text style={styles.eyebrow}>{dataset.shortName}</Text>
      <Text style={[dashboardStyles.datasetTitle, { paddingRight: 0 }]}>{dataset.title}</Text>
      <Text style={dashboardStyles.datasetDescription}>{RANKING_ABOUT[datasetKey] || dataset.dashboardDescription}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
        {(FEATURES[datasetKey] || []).map((feature) => (
          <Chip key={feature} label={feature} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <TouchableOpacity
          onPress={onSelect}
          activeOpacity={0.85}
          accessibilityState={{ selected }}
          style={{
            flex: 1,
            minHeight: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: selected ? authTheme.colors.brandTeal : authTheme.colors.brandBorder,
            backgroundColor: selected ? authTheme.colors.brandTeal : '#FFFFFF',
          }}
        >
          <Text style={{ fontSize: 12.5, fontWeight: '900', color: selected ? '#FFFFFF' : authTheme.colors.brandTeal }}>
            {selected ? '✓ Selected' : 'Use for tools'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onOpen}
          activeOpacity={0.85}
          style={{
            flex: 1,
            minHeight: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: authTheme.colors.brandBorder,
            backgroundColor: '#FFFFFF',
          }}
        >
          <Text style={{ fontSize: 12.5, fontWeight: '900', color: authTheme.colors.brandTeal }}>Open dataset →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

function ToolRow({ item, datasetLabel, onPress, first }) {
  const usesDataset = !!item.params?.dataset;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, minHeight: 52 },
        !first && { borderTopWidth: 1, borderTopColor: '#E8F3EE' },
      ]}
    >
      <View style={[dashboardStyles.miniIconBox, { width: 38, height: 38, marginRight: 10 }]}>
        <Ionicons name={item.icon} size={18} color={authTheme.colors.brandTeal} />
      </View>
      <View style={styles.flex1}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <Text style={[styles.rowName, { marginBottom: 0 }]}>{item.label}</Text>
          {usesDataset && (
            <View style={{ borderRadius: 6, backgroundColor: authTheme.colors.brandMint, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: authTheme.colors.brandTeal }}>{datasetLabel}</Text>
            </View>
          )}
        </View>
        <Text style={styles.mutedText}>{item.hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={authTheme.colors.brandTeal} />
    </TouchableOpacity>
  );
}

function RecentExperiments({ experiments, navigation }) {
  return (
    <View style={{ marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: authTheme.colors.brandBorder }}>
      <Text style={[styles.eyebrow, { marginBottom: 4 }]}>Recent experiments</Text>
      {experiments.length === 0 ? (
        <Text style={styles.mutedText}>None yet. Save one in Weight Analysis.</Text>
      ) : (
        experiments.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            style={[styles.rowBetween, { paddingVertical: 8, minHeight: 44 }]}
            onPress={() => navigation.navigate(RESEARCHER_ROUTES.report, { experimentId: item.id }, { pop: true })}
          >
            <View style={styles.flex1}>
              <Text style={[styles.rowName, { marginBottom: 0 }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowSub}>
                {RESEARCHER_DATASETS[item.dataset]?.shortName || String(item.dataset).toUpperCase()} {item.year}
                {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
              </Text>
            </View>
            <Text style={dashboardStyles.openText}>Report →</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

export default function ResearcherDashboard({ navigation, profile, refreshing, onRefresh }) {
  const [dataset, setDataset] = useState(chosenDataset);
  const [experiments, setExperiments] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadSavedExperiments().then((list) => setExperiments((list || []).slice(0, 3)));
    }, [])
  );

  const choose = (key) => {
    chosenDataset = key;
    setDataset(key);
  };

  const datasetLabel = RESEARCHER_DATASETS[dataset]?.shortName || dataset.toUpperCase();
  // Dataset Explorer is opened from the dataset cards, so it is not repeated here.
  const groups = researcherGroups(dataset).map((group) => ({
    ...group,
    items: group.items.filter((item) => item.key !== 'dataset'),
  }));
  const open = (item) => navigation.navigate(item.route, item.params, { pop: true });

  return (
    <ResearcherLayout navigation={navigation} activeKey="dashboard" isRoot refreshing={refreshing} onRefresh={onRefresh}>
      <PageHeader
        eyebrow="Researcher"
        title={`Welcome back${profile?.full_name ? `, ${profile.full_name}` : ''}`}
        subtitle="Study how QS, THE and ARWU rank universities and test your own weightings. Official rankings are never changed."
      >
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: authTheme.colors.brandBorder,
            flexDirection: 'row',
            flexWrap: 'wrap',
            rowGap: 10,
          }}
        >
          {STEPS.map((step, index) => (
            <View key={step.title} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', paddingRight: 6 }}>
              <StepNumber n={index + 1} size={24} />
              <Text style={[styles.rowName, styles.flex1, { marginBottom: 0, fontSize: 12.5 }]}>{step.title}</Text>
            </View>
          ))}
        </View>
      </PageHeader>

      <View style={dashboardStyles.datasetSection}>
        <StepHeading n={1} title="Ranking datasets" hint="Choose the dataset your tools use, or open it to browse every university." />
        <View style={dashboardStyles.datasetList}>
          {RESEARCHER_DATASET_KEYS.map((key) => (
            <DatasetCard
              key={key}
              datasetKey={key}
              selected={key === dataset}
              onSelect={() => choose(key)}
              onOpen={() => navigation.navigate(RESEARCHER_ROUTES.dataset, { dataset: key }, { pop: true })}
            />
          ))}
        </View>
      </View>

      <View style={dashboardStyles.datasetSection}>
        <Text style={dashboardStyles.sectionTitle}>Research tools</Text>
        <Text style={[styles.mutedText, { marginBottom: 8 }]}>
          Tools tagged <Text style={[styles.mutedText, styles.boldText, { color: authTheme.colors.brandTeal }]}>{datasetLabel}</Text> open on
          the dataset selected above.
        </Text>

        {groups.map((group, index) => (
          <Card key={group.title}>
            <StepHeading n={index + 2} title={STEPS[index + 1].title} hint={STEPS[index + 1].hint} />
            {group.items.map((item, itemIndex) => (
              <ToolRow key={item.key} item={item} datasetLabel={datasetLabel} first={itemIndex === 0} onPress={() => open(item)} />
            ))}
            {index === groups.length - 1 && <RecentExperiments experiments={experiments} navigation={navigation} />}
          </Card>
        ))}
      </View>
    </ResearcherLayout>
  );
}
