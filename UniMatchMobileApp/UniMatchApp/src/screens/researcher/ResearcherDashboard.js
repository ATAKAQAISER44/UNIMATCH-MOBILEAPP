// src/screens/researcher/ResearcherDashboard.js
//
// Dashboard shown to users with the Researcher role (web: ResearcherDashboard).
// Rendered by DashboardScreen, so the "Dashboard" route stays the same for
// every role.

import React, { memo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import ResearcherLayout from '../../components/researcher/ResearcherLayout';
import { PageHeader } from '../../components/researcher/ResearcherUI';
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
    </ResearcherLayout>
  );
}
