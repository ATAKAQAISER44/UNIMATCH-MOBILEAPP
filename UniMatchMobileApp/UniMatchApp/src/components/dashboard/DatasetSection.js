
// src/components/dashboard/DatasetSection.js

import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { dashboardStyles as styles } from '../../styles/dashboardStyles';
import { authTheme } from '../../styles/authTheme';
import { DATASETS } from '../../constants/dashboardConstants';
import { isRecommendedDataset } from '../../utils/dashboardUtils';

const DatasetTile = memo(function DatasetTile({
  dataset,
  recommendedSystem,
  onOpen,
}) {
  const isRecommended = isRecommendedDataset(recommendedSystem, dataset.system);

  const handlePress = useCallback(() => {
    onOpen(dataset);
  }, [dataset, onOpen]);

  return (
    <TouchableOpacity
      style={[
        styles.datasetTile,
        isRecommended && styles.datasetTileRecommended,
      ]}
      activeOpacity={0.86}
      onPress={handlePress}
    >
      {isRecommended && (
        <LinearGradient
          colors={authTheme.gradients.button}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.recommendedStar}
        >
          <Text style={styles.recommendedStarText}>★</Text>
        </LinearGradient>
      )}

      <View
        style={[
          styles.datasetLogoBox,
          {
            backgroundColor: dataset.lightColor,
            borderColor: isRecommended
              ? authTheme.colors.brandBorder
              : '#DCFCE7',
          },
        ]}
      >
        <Text style={[styles.datasetLogoText, { color: dataset.color }]}>
          {dataset.system}
        </Text>
      </View>

      <Text style={styles.datasetTitle}>{dataset.shortTitle}</Text>
      <Text style={styles.datasetDescription}>{dataset.description}</Text>

      <View style={styles.featureRow}>
        {dataset.features.map((feature) => (
          <View key={feature} style={styles.featurePill}>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.openText}>Open →</Text>
    </TouchableOpacity>
  );
});

const DatasetSection = memo(function DatasetSection({
  recommendedSystem,
  onOpenRankings,
}) {
  return (
    <View style={styles.datasetSection}>
      <Text style={styles.sectionTitle}>Explore Ranking Systems</Text>

      <Text style={styles.sectionSubtitle}>
        Choose a ranking system to view its official rankings and university details.
      </Text>

      <View style={styles.datasetList}>
        {DATASETS.map((dataset) => (
          <DatasetTile
            key={dataset.key}
            dataset={dataset}
            recommendedSystem={recommendedSystem}
            onOpen={onOpenRankings}
          />
        ))}
      </View>
    </View>
  );
});

export default DatasetSection;