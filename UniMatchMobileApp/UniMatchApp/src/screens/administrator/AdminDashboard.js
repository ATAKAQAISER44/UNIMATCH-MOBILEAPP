// src/screens/administrator/AdminDashboard.js
//
// Dashboard for the University Administrator role (web:
// administrator/AdministratorDashboard.jsx). Rendered by DashboardScreen.
// The administrator picks their university once (kept in Supabase user
// metadata); every tool then uses it.

import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../../components/AppText';
import AppLayout from '../../components/app/AppLayout';
import { ADMIN_ROUTES, ADMIN_TOOLS } from '../../components/app/menuConfig';
import { Card, ErrorBox, InlineLoader, LoadingBlock, OutlineButton, PageHeader, SectionHeading } from '../../components/researcher/ResearcherUI';
import { StatTile, TileGrid, UniversityPicker } from '../../components/app/RoleUI';
import { RankingGlance } from '../../components/administrator/AdminWidgets';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { dashboardStyles } from '../../styles/dashboardStyles';
import { authTheme } from '../../styles/authTheme';
import { RANKINGS } from '../../constants/roleConstants';
import { useAdminInstitution, useInstitutionPerformance, useInstitutionProfile, useStudentDemand } from '../../services/adminApi';
import { buildRecommendations } from '../../utils/adminRecommendations';

function InstitutionPicker({ onPick }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function pick(item) {
    setSaving(true);
    setError('');
    try {
      await onPick({ key: item.key, name: item.name, country: item.country });
    } catch (err) {
      setError(err?.message || 'Could not save your university.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <UniversityPicker label="Find your university" onPick={pick} disabled={saving} />
      {saving && <InlineLoader />}
      <ErrorBox message={error} />
    </View>
  );
}

export default function AdminDashboard({ navigation, profile, refreshing, onRefresh }) {
  const [institution, saveInstitution] = useAdminInstitution();
  const [changing, setChanging] = useState(false);
  const performance = useInstitutionPerformance(institution?.key);
  const institutionProfile = useInstitutionProfile(institution).data;
  const demand = useStudentDemand(institutionProfile).data;
  const data = performance.data;
  const topRecommendations =
    data && institutionProfile ? buildRecommendations({ performance: data, profile: institutionProfile, demand }).slice(0, 3) : [];

  async function pick(next) {
    await saveInstitution(next);
    setChanging(false);
  }

  const open = (route) => navigation.navigate(route, undefined, { pop: true });

  return (
    <AppLayout navigation={navigation} activeKey="dashboard" isRoot refreshing={refreshing} onRefresh={onRefresh}>
      <PageHeader
        eyebrow="University Administrator"
        title={`Welcome back${profile?.full_name ? `, ${profile.full_name}` : ''}`}
        subtitle="Where your university stands in QS, THE and ARWU, and how it compares with similar universities."
      >
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: authTheme.colors.brandBorder }}>
          {institution === undefined ? (
            <InlineLoader />
          ) : !institution || changing ? (
            <>
              <Text style={[styles.bodyText, { marginBottom: 8, fontWeight: '700' }]}>
                {institution ? 'Choose another university.' : 'First, choose the university you manage.'}
              </Text>
              <InstitutionPicker onPick={pick} />
              {!!institution && (
                <OutlineButton title="Cancel" small onPress={() => setChanging(false)} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
              )}
            </>
          ) : (
            <View style={[styles.rowBetween, { flexWrap: 'wrap', rowGap: 8 }]}>
              <View style={[styles.flex1, { minWidth: 180, marginRight: 8 }]}>
                <Text style={[styles.eyebrow, { color: authTheme.colors.brandMuted }]}>Your university</Text>
                <Text style={styles.sectionTitle}>{institution.name}</Text>
                {!!institution.country && <Text style={styles.mutedText}>{institution.country}</Text>}
              </View>
              <OutlineButton title="Change university" small onPress={() => setChanging(true)} />
            </View>
          )}
        </View>
      </PageHeader>

      {!!institution && !changing && (
        <>
          {performance.loading && <LoadingBlock />}
          <ErrorBox message={performance.error} onRetry={performance.retry} />

          {data && (
            <Card>
              <SectionHeading
                title="At a glance"
                subtitle={`Latest edition of each ranking; a smaller number is better. Peers are within ${data.peer_rank_band} places of yours.`}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, marginTop: 8 }}>
                {RANKINGS.map(({ key }) => (
                  <View key={key} style={{ flexGrow: 1, flexBasis: 240 }}>
                    <RankingGlance rankingKey={key} perf={data.rankings[key]} />
                  </View>
                ))}
              </View>
            </Card>
          )}

          {institutionProfile && (
            <Card>
              <SectionHeading title="How students see you" subtitle={`Compared with ${institutionProfile.group_label}.`} />
              <View style={{ marginTop: 8 }}>
                <TileGrid>
                  <StatTile label="Affordability" value={institutionProfile.summaries.affordability} suffix="/100" />
                  <StatTile label="Accessibility" value={institutionProfile.summaries.accessibility} suffix="/100" />
                  <StatTile label="Support" value={institutionProfile.summaries.support} suffix={`/${institutionProfile.support_total}`} />
                </TileGrid>
              </View>

              <Text style={[styles.sectionTitle, { fontSize: 15 }]}>Top recommendations</Text>
              {!data ? (
                <InlineLoader />
              ) : topRecommendations.length === 0 ? (
                <Text style={styles.mutedText}>Nothing stands out right now.</Text>
              ) : (
                topRecommendations.map((r) => (
                  <View key={r.text} style={{ marginTop: 6 }}>
                    <Text style={styles.bodyText}>
                      <Text style={styles.boldText}>{r.priority}: </Text>
                      {r.text}
                    </Text>
                    <Text style={styles.noteText}>{r.evidence}</Text>
                  </View>
                ))
              )}
              <TouchableOpacity
                onPress={() => open(ADMIN_ROUTES.demand)}
                style={{ minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 4 }}
              >
                <Text style={dashboardStyles.openText}>All recommendations →</Text>
              </TouchableOpacity>
            </Card>
          )}

          <View style={dashboardStyles.datasetSection}>
            <Text style={dashboardStyles.sectionTitle}>Tools</Text>
            <View style={[dashboardStyles.datasetList, { marginTop: 8 }]}>
              {ADMIN_TOOLS.map((tool) => (
                <TouchableOpacity
                  key={tool.key}
                  style={[dashboardStyles.datasetTile, { minHeight: 0 }]}
                  activeOpacity={0.86}
                  onPress={() => open(tool.route)}
                >
                  <View style={[dashboardStyles.miniIconBox, { width: 38, height: 38, marginBottom: 9 }]}>
                    <Ionicons name={tool.icon} size={19} color={authTheme.colors.brandTeal} />
                  </View>
                  <Text style={dashboardStyles.datasetTitle}>{tool.label}</Text>
                  <Text style={dashboardStyles.datasetDescription}>{tool.text}</Text>
                  <Text style={dashboardStyles.openText}>Open →</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}
    </AppLayout>
  );
}
