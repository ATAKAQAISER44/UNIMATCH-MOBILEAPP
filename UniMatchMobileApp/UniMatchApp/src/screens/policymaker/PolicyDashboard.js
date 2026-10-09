// src/screens/policymaker/PolicyDashboard.js
//
// Dashboard for the Policymaker role (web: policymaker/PolicymakerDashboard).
// Rendered by DashboardScreen. Welcome card with the policymaker's country
// (chosen once, kept in Supabase user metadata), "At a glance" per ranking
// and the tool cards.

import React, { useState } from 'react';
import { View } from 'react-native';

import { Text } from '../../components/AppText';
import AppLayout from '../../components/app/AppLayout';
import { POLICY_TOOLS } from '../../components/app/menuConfig';
import {
  Card,
  ErrorBox,
  InlineLoader,
  LoadingBlock,
  OutlineButton,
  PageHeader,
  SectionHeading,
  SelectField,
} from '../../components/researcher/ResearcherUI';
import { RankingDot } from '../../components/policymaker/PolicyUI';
import { HowItWorks, QuickPicks, RankingsCovered, ToolGrid, WhatYouGet } from '../../components/app/GettingStarted';
import { RANKINGS } from '../../constants/roleConstants';
import { useCountryList, useCountryOverview, usePolicyCountry } from '../../services/policyApi';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { useWelcomeGreeting } from '../../services/welcome';

function CountryPicker({ value, onPick }) {
  const { data, loading, error, retry } = useCountryList();
  if (loading) return <InlineLoader />;
  if (error) return <ErrorBox message={error} onRetry={retry} />;
  const options = (data?.countries || []).map((name) => ({ value: name, label: name }));
  return (
    <SelectField
      label="Country"
      title="Choose your country"
      value={value}
      options={options}
      onChange={onPick}
      placeholder="Choose a country"
    />
  );
}

function RankingGlance({ ranking, data }) {
  const r = data.rankings[ranking.key];
  const tiers = Object.entries(r.country.tiers || {});
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 200,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: authTheme.colors.brandBorder,
        backgroundColor: '#FFFFFF',
        padding: 12,
      }}
    >
      <RankingDot color={ranking.color} label={`${ranking.label} ${r.year}`} />
      <Text style={[styles.statValue, { fontSize: 26, lineHeight: 31, marginTop: 6 }]}>{r.country.count}</Text>
      <Text style={styles.mutedText}>ranked universities</Text>
      <View style={{ marginTop: 8 }}>
        {tiers.map(([tier, count]) => (
          <View key={tier} style={[styles.rowBetween, { paddingVertical: 2 }]}>
            <Text style={styles.mutedText}>In top {tier}</Text>
            <Text style={[styles.mutedText, styles.boldText]}>{count}</Text>
          </View>
        ))}
        <View style={[styles.rowBetween, { paddingVertical: 2, alignItems: 'flex-start' }]}>
          <Text style={[styles.mutedText, { marginRight: 8 }]}>Best</Text>
          <Text style={[styles.mutedText, styles.boldText, styles.flex1, { textAlign: 'right' }]} numberOfLines={2}>
            {r.country.best_rank ? `#${r.country.best_rank} ${r.country.best_university || ''}` : '–'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const POPULAR_COUNTRIES = ['Pakistan', 'India', 'United Kingdom', 'United States', 'China (Mainland)', 'Germany', 'Malaysia', 'Saudi Arabia'];

const WHAT_YOU_GET = [
  { icon: 'podium-outline', title: 'Ranking presence', text: 'Universities in QS, THE and ARWU, and how many reach the top 100 / 500.' },
  { icon: 'analytics-outline', title: 'Indicator gaps', text: 'Where the country is ahead or behind its region and the world.' },
  { icon: 'trending-up-outline', title: 'Trend', text: "The best university's rank over the years in each ranking." },
  { icon: 'wallet-outline', title: 'Access & affordability', text: 'Typical fees, living cost, admission and scholarships.' },
];

const STEPS = [
  { title: 'Choose your country', text: 'Pick it once; every tool then uses it.' },
  { title: 'Analyse and compare', text: 'Read the gaps and compare with up to 3 other countries.' },
  { title: 'Share a policy report', text: 'Recommendations with evidence, as PDF or CSV.' },
];

export default function PolicyDashboard({ navigation, profile, refreshing, onRefresh }) {
  const greeting = useWelcomeGreeting();
  const [country, saveCountry] = usePolicyCountry();
  const [changing, setChanging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const { data, loading, error, retry } = useCountryOverview(country);

  const pick = async (next) => {
    setSaving(true);
    setSaveError('');
    try {
      await saveCountry(next);
      setChanging(false);
    } catch (failure) {
      setSaveError(failure?.message || 'Your country could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const picking = !country || changing;
  const countryList = useCountryList().data?.countries || [];
  const quickPicks = POPULAR_COUNTRIES.filter((name) => countryList.includes(name) && name !== country);
  const openTool = (tool) => navigation.navigate(tool.route, tool.params, { pop: true });

  return (
    <AppLayout navigation={navigation} activeKey="dashboard" isRoot refreshing={refreshing} onRefresh={onRefresh}>
      <PageHeader
        eyebrow="Policymaker"
        title={`${greeting}${profile?.full_name ? `, ${profile.full_name}` : ''}`}
        subtitle="How a country's universities do in QS, THE and ARWU, and how open and affordable they are."
      >
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: authTheme.colors.brandBorder }}>
          {country === undefined ? (
            <InlineLoader />
          ) : picking ? (
            <View>
              <Text style={[styles.mutedText, { marginBottom: 8, color: authTheme.colors.gray700 }]}>
                Choose the country you are planning for. You can change it later.
              </Text>
              {saving ? <InlineLoader /> : <CountryPicker value={country} onPick={pick} />}
              {!saving && <QuickPicks options={quickPicks.slice(0, 6)} onPick={pick} />}
              {changing && !!country && !saving && (
                <OutlineButton
                  title="Cancel"
                  small
                  onPress={() => setChanging(false)}
                  style={{ alignSelf: 'flex-start', marginTop: 8, minHeight: 36 }}
                />
              )}
              <ErrorBox message={saveError} />
            </View>
          ) : (
            <View style={[styles.rowBetween, { flexWrap: 'wrap', gap: 8 }]}>
              <View style={{ flexShrink: 1, minWidth: 140 }}>
                <Text style={styles.eyebrow}>Your country</Text>
                <Text style={styles.sectionTitle} numberOfLines={2}>
                  {country}
                </Text>
                {!!data?.region && <Text style={styles.mutedText}>{data.region}</Text>}
              </View>
              <OutlineButton title="Change country" small onPress={() => setChanging(true)} style={{ minHeight: 36 }} />
            </View>
          )}
        </View>
      </PageHeader>

      {!!country && !changing && (
        <>
          {loading && (
            <Card>
              <LoadingBlock />
            </Card>
          )}
          <ErrorBox message={error} onRetry={retry} />

          {data && (
            <Card>
              <SectionHeading title="At a glance" subtitle={`Universities from ${country} in the latest edition of each ranking.`} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 10 }}>
                {RANKINGS.map((ranking) => (
                  <RankingGlance key={ranking.key} ranking={ranking} data={data} />
                ))}
              </View>
            </Card>
          )}

          <ToolGrid tools={POLICY_TOOLS} onOpen={openTool} />
        </>
      )}

      {country !== undefined && !country && (
        <>
          <WhatYouGet subtitle="For the country you choose." items={WHAT_YOU_GET} />
          <RankingsCovered />
          <HowItWorks steps={STEPS} />
          <ToolGrid tools={POLICY_TOOLS} onOpen={openTool} note="Each tool asks for your country first." />
        </>
      )}
    </AppLayout>
  );
}
