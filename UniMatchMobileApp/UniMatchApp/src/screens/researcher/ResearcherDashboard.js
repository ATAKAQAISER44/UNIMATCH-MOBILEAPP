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
    eyebrow: 'Cross-Dataset View',
    title: 'Dataset Comparison',
    icon: '🧭',
    description:
      'See QS, THE, and ARWU rankings side by side and search a university to track it across all three at once.',
    action: 'Open Dataset Comparison',
    route: RESEARCHER_ROUTES.datasetComparison,
  },
  {
    eyebrow: 'Experimental Ranking',
    title: 'Weight Analysis',
    icon: '🎚️',
    description:
      'Adjust ranking-indicator weights and compare experimental ranks with official ranks for QS, THE, and ARWU.',
    action: 'Open Weight Analysis',
    route: RESEARCHER_ROUTES.weights,
    params: { dataset: 'qs' },
  },
  {
    eyebrow: 'Trend Over Time',
    title: 'University Journey',
    icon: '📈',
    description:
      'Search any university and see how its rank moved across QS, THE, and ARWU over the available editions.',
    action: 'Open University Journey',
    route: RESEARCHER_ROUTES.journey,
  },
  {
    eyebrow: 'Side-by-Side',
    title: 'Compare Universities',
    icon: '⚖️',
    description:
      'Pick up to 3 universities from the same dataset and edition and compare every indicator side by side.',
    action: 'Open Compare',
    route: RESEARCHER_ROUTES.compare,
    params: { dataset: 'qs' },
  },
  {
    eyebrow: 'Manually Collected Data',
    title: 'Attributes Explorer',
    icon: '🗂️',
    description:
      'Browse tuition, living cost, scholarships, acceptance rate, and more across all universities, independent of any single ranking dataset.',
    action: 'Open Attributes Explorer',
    route: RESEARCHER_ROUTES.attributes,
  },
  {
    eyebrow: 'Write-up',
    title: 'Research Report',
    icon: '📄',
    description:
      'Turn a saved experiment into a full report — dataset summary, indicator relationships, ranking comparison and stability — and download it as PDF or CSV.',
    action: 'Open Research Report',
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
      <Text style={dashboardStyles.openText}>Open Dataset →</Text>
    </TouchableOpacity>
  );
});

const ToolCard = memo(function ToolCard({ tool, onPress }) {
  return (
    <TouchableOpacity style={dashboardStyles.datasetTile} activeOpacity={0.86} onPress={onPress}>
      <View style={[dashboardStyles.miniIconBox, { width: 38, height: 38, marginBottom: 9 }]}>
        <Text style={{ fontSize: 17 }}>{tool.icon}</Text>
      </View>
      <Text style={styles.eyebrow}>{tool.eyebrow}</Text>
      <Text style={dashboardStyles.datasetTitle}>{tool.title}</Text>
      <Text style={dashboardStyles.datasetDescription}>{tool.description}</Text>
      <Text style={dashboardStyles.openText}>{tool.action} →</Text>
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
      <PageHeader
        eyebrow="Researcher Dashboard"
        title={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ''}`}
        subtitle="Explore the QS, THE, and ARWU ranking datasets and inspect their official university rankings."
      />

      <View style={dashboardStyles.datasetSection}>
        <Text style={dashboardStyles.sectionTitle}>Explore Ranking Datasets</Text>
        <Text style={dashboardStyles.sectionSubtitle}>Select a ranking system to open its dataset.</Text>
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
        <Text style={dashboardStyles.sectionTitle}>Research Tools</Text>
        <Text style={dashboardStyles.sectionSubtitle}>
          Run experimental ranking analysis without changing the official datasets.
        </Text>
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
