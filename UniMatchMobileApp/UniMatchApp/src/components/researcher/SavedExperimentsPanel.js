// src/components/researcher/SavedExperimentsPanel.js
//
// "My Saved Experiments" list (web: ResearcherSavedExperiments). Load an
// experiment back into Weight Analysis, open its research report, share its
// settings as CSV or delete it.

import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { CollapsibleCard, EmptyState, GradientButton, OutlineButton } from './ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { RESEARCHER_ROUTES } from '../../constants/researcherConstants';
import { shareCSV } from '../../utils/researcherExport';

const DATASET_NAMES = { qs: 'QS', the: 'THE', arwu: 'ARWU' };

export function formatExperimentDate(value) {
  try {
    return new Date(value).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// The three biggest weights, e.g. "Academic Reputation 30% · Citations 20% · …"
function topWeights(experiment, labelFor) {
  const entries = Object.entries(experiment.weights || {}).filter(([, value]) => Number(value) > 0);
  const total = entries.reduce((sum, [, value]) => sum + Number(value), 0) || 1;
  return entries
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([key, value]) => `${labelFor(experiment.dataset, key)} ${Math.round((Number(value) / total) * 100)}%`)
    .join(' · ');
}

// Readable two-column sheet (Setting | Value) that opens in Excel.
function shareExperiment(experiment, labelFor) {
  const weightEntries = Object.entries(experiment.weights || {});
  const total = weightEntries.reduce((sum, [, value]) => sum + Number(value || 0), 0) || 1;

  const rows = [
    ['Experiment', experiment.name],
    ['Dataset', `${DATASET_NAMES[experiment.dataset] || experiment.dataset} ${experiment.year}`],
    ['Saved on', formatExperimentDate(experiment.createdAt)],
    ['Note', experiment.note || ''],
    ['', ''],
    ['Indicator weights', 'Share of total'],
    ...weightEntries
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([key, value]) => [
        labelFor(experiment.dataset, key),
        `${Math.round((Number(value || 0) / total) * 100)}%`,
      ]),
    ['', ''],
    ['Stability test setting', `each weight ±${Math.round((experiment.variation ?? 0.2) * 100)}%`],
  ];

  if (experiment.summary?.length) {
    rows.push(['', ''], ['Top results with these weights', '']);
    experiment.summary.forEach((row) => rows.push([`#${row.rank}`, row.name]));
  }

  shareCSV(['Setting', 'Value'], rows, `experiment-${experiment.name}.csv`);
}

export default function SavedExperimentsPanel({ experiments, activeId, onLoad, onDelete, labelFor, navigation }) {
  const [open, setOpen] = useState(true);

  const confirmDelete = (experiment) => {
    Alert.alert('Delete experiment?', `"${experiment.name}" will be removed from this phone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(experiment.id) },
    ]);
  };

  return (
    <CollapsibleCard
      eyebrow="Saved on this phone"
      title={`My Saved Experiments (${experiments.length})`}
      open={open}
      onToggle={() => setOpen((value) => !value)}
    >
      {experiments.length === 0 ? (
        <EmptyState text='No saved experiments yet. Set your weights, then press "Save as Experiment" to keep them with a name and open them again later.' />
      ) : (
        experiments.map((experiment) => {
          const isActive = experiment.id === activeId;

          return (
            <View key={experiment.id} style={[styles.rowCard, isActive && styles.rowCardActive]}>
              <View style={[styles.rowTop, { flexWrap: 'wrap', gap: 6 }]}>
                <Text style={[styles.rowName, { flexShrink: 1 }]} numberOfLines={2}>
                  {experiment.name}
                </Text>
                <View style={[styles.pill, { borderColor: authTheme.colors.brandBorder, backgroundColor: '#FFFFFF' }]}>
                  <Text style={[styles.pillText, { color: authTheme.colors.brandTeal }]}>
                    {DATASET_NAMES[experiment.dataset] || experiment.dataset} {experiment.year}
                  </Text>
                </View>
                {isActive && (
                  <View style={[styles.pill, { borderColor: authTheme.colors.brandTeal, backgroundColor: authTheme.colors.brandTeal }]}>
                    <Text style={[styles.pillText, { color: '#FFFFFF' }]}>Open now</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.mutedText, { marginTop: 4 }]}>{topWeights(experiment, labelFor)}</Text>
              {!!experiment.note && (
                <Text style={[styles.bodyText, { fontStyle: 'italic', marginTop: 3, fontSize: 12 }]}>
                  “{experiment.note}”
                </Text>
              )}
              {experiment.summary?.length > 0 && (
                <Text style={[styles.mutedText, { marginTop: 3, fontSize: 11 }]}>
                  Top result: {experiment.summary.map((row) => `#${row.rank} ${row.name}`).join(', ')}
                </Text>
              )}
              <Text style={[styles.noteText, { marginTop: 4 }]}>
                Saved {formatExperimentDate(experiment.createdAt)} · stability test ±
                {Math.round((experiment.variation ?? 0.2) * 100)}%
              </Text>

              <View style={[styles.buttonRow, { marginTop: 9 }]}>
                <GradientButton title="Load" small onPress={() => onLoad(experiment)} />
                <OutlineButton
                  title="Report"
                  small
                  onPress={() =>
                    navigation.navigate(
                      RESEARCHER_ROUTES.report,
                      { experimentId: experiment.id, autoGenerate: Date.now() },
                      { pop: true }
                    )
                  }
                />
                <OutlineButton title="CSV" small onPress={() => shareExperiment(experiment, labelFor)} />
                <OutlineButton title="Delete" small danger onPress={() => confirmDelete(experiment)} />
              </View>
            </View>
          );
        })
      )}
    </CollapsibleCard>
  );
}
