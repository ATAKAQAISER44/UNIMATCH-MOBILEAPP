// src/screens/administrator/AdminDemandScreen.js
//
// Student demand & recommendations (web: administrator/AdministratorDemand.jsx).
// Demand totals come from the admin_student_demand Supabase function (counts
// only, small groups merged); the recommendations are the rule-based
// buildRecommendations() and still work when demand is unavailable.

import React from 'react';
import { View } from 'react-native';

import { Text } from '../../components/AppText';
import AppLayout from '../../components/app/AppLayout';
import { Card, ErrorBox, InlineLoader, PageHeader, SectionHeading, WarningBox } from '../../components/researcher/ResearcherUI';
import { BarList, Pill, StatTile, TileGrid } from '../../components/app/RoleUI';
import { InstitutionGate } from '../../components/administrator/AdminWidgets';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { PRIORITY_STYLE } from '../../constants/roleConstants';
import { useAdminInstitution, useInstitutionPerformance, useInstitutionProfile, useStudentDemand } from '../../services/adminApi';
import { buildRecommendations } from '../../utils/adminRecommendations';

const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0);

export default function AdminDemandScreen({ navigation }) {
  const [institution] = useAdminInstitution();
  const performance = useInstitutionPerformance(institution?.key);
  const profileState = useInstitutionProfile(institution);
  const profile = profileState.data;
  const { data: demand, error, loading, params } = useStudentDemand(profile);
  const recommendations = buildRecommendations({ performance: performance.data, profile, demand });
  const enough = demand && demand.interested >= demand.min_group;
  const analysisError = performance.error || profileState.error;

  return (
    <AppLayout navigation={navigation} activeKey="demand">
      <PageHeader
        eyebrow="Administrator"
        title="Student demand & recommendations"
        subtitle="What UniMatch students look for, how many you fit, and what to improve first."
        hint="Read what students want, see what rules them out, then act on the recommendations."
      />

      <InstitutionGate institution={institution}>
        <Card>
          <SectionHeading
            title={`Students interested in ${profile?.region || 'your region'}`}
            subtitle={`Totals only; groups under ${demand?.min_group ?? 5} students are merged into "Other".`}
          />
          <View style={{ marginTop: 8 }}>
            {(loading || (!profile && !profileState.error)) && <InlineLoader />}
            {!!error && <WarningBox message="Student demand is not available yet. The admin_student_demand function must be set up in Supabase." />}
            {!!profileState.error && !profile && <Text style={styles.mutedText}>Needs your university profile, which could not be loaded.</Text>}
            {demand && !enough && (
              <Text style={styles.mutedText}>Not enough students yet ({demand.interested} interested) to show a safe summary.</Text>
            )}
            {enough && (
              <>
                <TileGrid>
                  <StatTile label="Interested" value={demand.interested} note={`of ${demand.total} students`} />
                  <StatTile label="You fit" value={`${pct(demand.fits_all, demand.interested)}%`} note="pass fee, living cost and CGPA" />
                  <StatTile
                    label="Fee too high"
                    value={`${pct(demand.fee_blocked, demand.interested)}%`}
                    note={params?.p_fee ? `budget below $${params.p_fee.toLocaleString()}` : 'no fee data'}
                  />
                  <StatTile
                    label="CGPA too low"
                    value={`${pct(demand.cgpa_blocked, demand.interested)}%`}
                    note={params?.p_min_cgpa ? `below ${params.p_min_cgpa} / 4.0` : 'no CGPA data'}
                  />
                </TileGrid>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16 }}>
                  <BarList title="Main priority" items={demand.by_priority} total={demand.interested} />
                  <BarList title="Degree level" items={demand.by_degree} total={demand.interested} />
                  <BarList title="Field of study" items={demand.by_field} total={demand.interested} />
                  <BarList title="Scholarship need" items={demand.by_scholarship} total={demand.interested} />
                </View>
              </>
            )}
          </View>
        </Card>

        <Card>
          <SectionHeading title="Recommendations" subtitle="Simple rules on your rankings, attributes and student demand; suggestions, not predictions." />
          <View style={{ marginTop: 8 }}>
            {analysisError ? (
              <ErrorBox
                message={analysisError}
                onRetry={() => {
                  if (performance.error) performance.retry();
                  if (profileState.error) profileState.retry();
                }}
              />
            ) : !performance.data || !profile ? (
              <InlineLoader />
            ) : recommendations.length === 0 ? (
              <Text style={styles.mutedText}>Nothing stands out: no large weakness, data gap or demand blocker.</Text>
            ) : (
              recommendations.map((r) => (
                <View key={r.text} style={[styles.rowCard, { marginBottom: 8 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <Pill label={r.priority} tone={PRIORITY_STYLE[r.priority]} />
                    <Text style={[styles.eyebrow, { marginBottom: 0 }]}>{r.source}</Text>
                  </View>
                  <Text style={[styles.findingTitle, { marginTop: 6 }]}>{r.text}</Text>
                  <Text style={styles.findingText}>{r.evidence}</Text>
                </View>
              ))
            )}
          </View>
        </Card>
      </InstitutionGate>
    </AppLayout>
  );
}
