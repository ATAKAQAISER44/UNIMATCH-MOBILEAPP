// src/components/app/GettingStarted.js
//
// Blocks for the Administrator and Policymaker dashboards, mainly shown before
// the user has chosen their university / country so the page is not empty:
// quick picks, what the tools show, the rankings covered, the steps and the
// tool cards.

import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../AppText';
import { Card, InlineLoader, SectionHeading } from '../researcher/ResearcherUI';
import { RANKINGS } from '../../constants/roleConstants';
import { useCachedApi } from '../../services/backendData';
import { dashboardStyles } from '../../styles/dashboardStyles';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';

function IconBox({ name, size = 38 }) {
  return (
    <View style={[dashboardStyles.miniIconBox, { width: size, height: size, marginRight: 10 }]}>
      <Ionicons name={name} size={Math.round(size / 2)} color={authTheme.colors.brandTeal} />
    </View>
  );
}

// One-tap choices (e.g. common countries) under the picker.
export function QuickPicks({ label = 'Quick pick', options, onPick, disabled }) {
  if (!options?.length) return null;
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={[styles.eyebrow, { marginBottom: 6 }]}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => onPick(option)}
            disabled={disabled}
            activeOpacity={0.8}
            style={{
              minHeight: 36,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: authTheme.colors.brandBorder,
              backgroundColor: authTheme.colors.brandMint,
              justifyContent: 'center',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: authTheme.colors.brandTealDark }}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// "What you will see": icon + title + one line each.
export function WhatYouGet({ title = 'What you will see', subtitle, items }) {
  return (
    <Card>
      <SectionHeading title={title} subtitle={subtitle} />
      <View style={{ marginTop: 6 }}>
        {items.map((item, index) => (
          <View
            key={item.title}
            style={[
              { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
              index > 0 && { borderTopWidth: 1, borderTopColor: '#E8F3EE' },
            ]}
          >
            <IconBox name={item.icon} />
            <View style={styles.flex1}>
              <Text style={[styles.rowName, { marginBottom: 2 }]}>{item.title}</Text>
              <Text style={styles.mutedText}>{item.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function CoverageTile({ ranking }) {
  const { data, loading } = useCachedApi(`rankings/${ranking.key}/summary`);
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 150,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: authTheme.colors.brandBorder,
        backgroundColor: '#FFFFFF',
        padding: 12,
      }}
    >
      <View style={styles.rowTop}>
        <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: ranking.color, marginRight: 6 }} />
        <Text style={[styles.rowName, { marginBottom: 0 }]}>{ranking.label}</Text>
      </View>
      {loading ? (
        <InlineLoader />
      ) : data ? (
        <>
          <Text style={[styles.statValue, { fontSize: 24, lineHeight: 29, marginTop: 6 }]}>
            {Number(data.total_universities || 0).toLocaleString()}
          </Text>
          <Text style={styles.mutedText}>universities · {data.total_countries} countries</Text>
          {!!data.published && <Text style={[styles.noteText, { marginTop: 4 }]}>Published {data.published}</Text>}
        </>
      ) : (
        <Text style={[styles.mutedText, { marginTop: 6 }]}>Not available</Text>
      )}
    </View>
  );
}

// Latest edition of QS, THE and ARWU used by every tool.
export function RankingsCovered() {
  return (
    <Card>
      <SectionHeading title="Rankings covered" subtitle="Latest edition of each ranking, plus a fees and admission dataset." />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 10 }}>
        {RANKINGS.map((ranking) => (
          <CoverageTile key={ranking.key} ranking={ranking} />
        ))}
      </View>
    </Card>
  );
}

// Numbered steps.
export function HowItWorks({ steps }) {
  return (
    <Card>
      <SectionHeading title="How it works" />
      <View style={{ marginTop: 6 }}>
        {steps.map((step, index) => (
          <View key={step.title} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                backgroundColor: authTheme.colors.brandTeal,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
                marginTop: 1,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>{index + 1}</Text>
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.rowName, { marginBottom: 2 }]}>{step.title}</Text>
              <Text style={styles.mutedText}>{step.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

// Tool cards (also used once the university / country is chosen).
export function ToolGrid({ tools, onOpen, note }) {
  return (
    <View style={dashboardStyles.datasetSection}>
      <Text style={dashboardStyles.sectionTitle}>Tools</Text>
      {!!note && <Text style={[styles.mutedText, { marginTop: 2 }]}>{note}</Text>}
      <View style={[dashboardStyles.datasetList, { marginTop: 8 }]}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.key}
            style={[dashboardStyles.datasetTile, { flexBasis: 160, minHeight: 0 }]}
            activeOpacity={0.86}
            onPress={() => onOpen(tool)}
            accessibilityRole="button"
          >
            <View style={[dashboardStyles.miniIconBox, { width: 38, height: 38, marginBottom: 9 }]}>
              <Ionicons name={tool.icon} size={19} color={authTheme.colors.brandTeal} />
            </View>
            <Text style={[dashboardStyles.datasetTitle, { paddingRight: 0 }]}>{tool.label}</Text>
            <Text style={dashboardStyles.datasetDescription}>{tool.text}</Text>
            <Text style={dashboardStyles.openText}>Open →</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
