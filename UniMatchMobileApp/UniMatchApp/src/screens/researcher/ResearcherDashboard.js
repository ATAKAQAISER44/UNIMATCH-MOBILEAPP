// src/screens/researcher/ResearcherDashboard.js
//
// Dashboard shown to users with the Researcher role (web: ResearcherDashboard).
// Rendered by DashboardScreen, so the "Dashboard" route stays the same for
// every role.

import React, { memo, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Image,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../components/AppText';

import ResearcherLayout from '../../components/researcher/ResearcherLayout';
import { Card, PageHeader } from '../../components/researcher/ResearcherUI';
import { loadSavedExperiments } from '../../utils/researcherExperiments';
import { dashboardStyles } from '../../styles/dashboardStyles';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import {
  RESEARCHER_DATASETS,
  RESEARCHER_DATASET_KEYS,
  RESEARCHER_ROUTES,
} from '../../constants/researcherConstants';

const TOOLS = [
  {
    title: 'Dataset Comparison',
    icon: '🧭',
    description: 'One university across QS, THE and ARWU.',
    route: RESEARCHER_ROUTES.datasetComparison,
  },
  {
    title: 'Weight Analysis',
    icon: '🎚️',
    description: 'Change indicator weights and see new ranks.',
    route: RESEARCHER_ROUTES.weights,
    params: { dataset: 'qs', section: 'weights' },
  },
  {
    title: 'University Journey',
    icon: '📈',
    description: 'A university\'s rank over the years.',
    route: RESEARCHER_ROUTES.journey,
  },
  {
    title: 'Compare Universities',
    icon: '⚖️',
    description: 'Up to 3 universities, every indicator.',
    route: RESEARCHER_ROUTES.compare,
    params: { dataset: 'qs' },
  },
  {
    title: 'Attributes Explorer',
    icon: '🗂️',
    description: 'Fees, scholarships and admission data.',
    route: RESEARCHER_ROUTES.attributes,
  },
  {
    title: 'Research Report',
    icon: '📄',
    description: 'Write-up of a saved experiment, as PDF or CSV.',
    route: RESEARCHER_ROUTES.report,
  },
];

const DatasetCard = memo(function DatasetCard({ dataset, onPress }) {
  return (
    <TouchableOpacity style={dashboardStyles.datasetTile} activeOpacity={0.86} onPress={onPress}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#DCFCE7',
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 6,
          marginBottom: 9,
        }}
      >
        <Image source={dataset.logo} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      </View>
      <Text style={styles.eyebrow}>{dataset.shortName}</Text>
      <Text style={dashboardStyles.datasetTitle}>{dataset.title}</Text>
      <Text style={dashboardStyles.datasetDescription}>{dataset.dashboardDescription}</Text>
      <Text style={dashboardStyles.openText}>Open →</Text>
    </TouchableOpacity>
  );
});

const ToolCard = memo(function ToolCard({ tool, onPress }) {
  return (
    <TouchableOpacity style={dashboardStyles.datasetTile} activeOpacity={0.86} onPress={onPress}>
      <View style={[dashboardStyles.miniIconBox, { width: 38, height: 38, marginBottom: 9 }]}>
        <Text style={{ fontSize: 17 }}>{tool.icon}</Text>
      </View>
      <Text style={dashboardStyles.datasetTitle}>{tool.title}</Text>
      <Text style={dashboardStyles.datasetDescription}>{tool.description}</Text>
      <Text style={dashboardStyles.openText}>Open →</Text>
    </TouchableOpacity>
  );
});

function RecentExperiments({ navigation }) {
  const [experiments, setExperiments] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadSavedExperiments().then((list) => setExperiments((list || []).slice(0, 3)));
    }, [])
  );

  if (!experiments.length) return null;

  return (
    <View style={dashboardStyles.datasetSection}>
      <Text style={dashboardStyles.sectionTitle}>Recent experiments</Text>
      <Card>
        {experiments.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            style={[
              styles.rowBetween,
              { paddingVertical: 10, minHeight: 44 },
              index > 0 && { borderTopWidth: 1, borderTopColor: '#E8F3EE' },
            ]}
            onPress={() => navigation.navigate(RESEARCHER_ROUTES.report, { experimentId: item.id }, { pop: true })}
          >
            <View style={styles.flex1}>
              <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.rowSub}>
                {(RESEARCHER_DATASETS[item.dataset]?.shortName || String(item.dataset).toUpperCase())} {item.year}
                {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
              </Text>
            </View>
            <Text style={dashboardStyles.openText}>Report →</Text>
          </TouchableOpacity>
        ))}
      </Card>
    </View>
  );
}

export default function ResearcherDashboard({ navigation, profile, refreshing, onRefresh }) {
  return (
    <ResearcherLayout
      navigation={navigation}
      activeKey="dashboard"
      isRoot
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <PageHeader title={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ''}`} />

      <View style={dashboardStyles.datasetSection}>
        <Text style={dashboardStyles.sectionTitle}>Ranking datasets</Text>
        <View style={dashboardStyles.datasetList}>
          {RESEARCHER_DATASET_KEYS.map((key) => (
            <DatasetCard
              key={key}
              dataset={RESEARCHER_DATASETS[key]}
              onPress={() => navigation.navigate(RESEARCHER_ROUTES.dataset, { dataset: key }, { pop: true })}
            />
          ))}
        </View>
      </View>

      <View style={dashboardStyles.datasetSection}>
        <Text style={dashboardStyles.sectionTitle}>Research tools</Text>
        <View style={dashboardStyles.datasetList}>
          {TOOLS.map((tool) => (
            <ToolCard
              key={tool.title}
              tool={tool}
              onPress={() => navigation.navigate(tool.route, tool.params, { pop: true })}
            />
          ))}
        </View>
      </View>

      <RecentExperiments navigation={navigation} />
    </ResearcherLayout>
  );
}
