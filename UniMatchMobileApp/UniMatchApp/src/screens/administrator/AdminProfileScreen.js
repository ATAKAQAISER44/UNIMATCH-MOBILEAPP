// src/screens/administrator/AdminProfileScreen.js
//
// Institutional profile (web: administrator/AdministratorProfile.jsx): how
// the university looks to a student - fees, living cost, admission and
// support - with each value's data status and source, compared with the
// country and similar universities. One card per attribute so long values
// never clip on phones; on tablets the cards sit 2-3 per row.

import React from 'react';
import { Linking, TouchableOpacity, View } from 'react-native';

import { Text } from '../../components/AppText';
import AppLayout from '../../components/app/AppLayout';
import { Card, ErrorBox, LoadingBlock, PageHeader, SectionHeading } from '../../components/researcher/ResearcherUI';
import { Pill, StatTile, TileGrid } from '../../components/app/RoleUI';
import { InstitutionGate } from '../../components/administrator/AdminWidgets';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { STATUS_STYLE } from '../../constants/roleConstants';
import { useAdminInstitution, useInstitutionProfile } from '../../services/adminApi';

const position = (pos) => (pos ? `Better than ${pos.better_than}% of ${pos.compared_with}` : '–');
const FALLBACK_TONE = { color: '#475569', backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' };

function AttributeCard({ attribute }) {
  const [label, tone] = STATUS_STYLE[attribute.status] || [attribute.status || '–', FALLBACK_TONE];
  const link = attribute.source?.startsWith('http') ? attribute.source.split(' ; ')[0] : null;

  return (
    <View style={[styles.rowCard, { flexGrow: 1, flexBasis: 280, marginBottom: 0 }]}>
      <Text style={styles.findingTitle}>{attribute.key}</Text>
      <Text style={[styles.bodyText, { marginBottom: 6 }]}>{attribute.value ?? '–'}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Pill label={label} tone={tone} />
        {!!link && (
          <TouchableOpacity
            onPress={() => Linking.openURL(link).catch(() => {})}
            hitSlop={10}
            style={{ minHeight: 28, justifyContent: 'center' }}
            accessibilityRole="link"
          >
            <Text style={[styles.pillText, { color: authTheme.colors.brandTeal, textDecorationLine: 'underline' }]}>source</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!attribute.better_is && (
        <View style={{ marginTop: 8 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.noteText}>Country</Text>
            <Text style={[styles.noteText, { fontWeight: '800', color: authTheme.colors.gray900 }]}>{position(attribute.country_position)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.noteText}>Similar</Text>
            <Text style={[styles.noteText, { fontWeight: '800', color: authTheme.colors.gray900 }]}>{position(attribute.group_position)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function AdminProfileScreen({ navigation }) {
  const [institution] = useAdminInstitution();
  const { data, loading, error, retry } = useInstitutionProfile(institution);
  const toImprove = data?.attributes.filter((a) => a.status !== 'sourced') || [];

  return (
    <AppLayout navigation={navigation} activeKey="profile">
      <PageHeader
        eyebrow="Administrator"
        title={data ? `${data.name}: profile` : 'Institutional profile'}
        subtitle="How your university looks to a student: fees, admission and support."
        hint="Read the summary scores, check each attribute's source, then fix estimates."
      />

      <InstitutionGate institution={institution}>
        {loading && <LoadingBlock />}
        <ErrorBox message={error} onRetry={retry} />

        {data && (
          <>
            <TileGrid>
              <StatTile
                label="Affordability"
                value={data.summaries.affordability}
                suffix="/100"
                note={`Fees and living cost vs ${data.group_label}.`}
              />
              <StatTile
                label="Accessibility"
                value={data.summaries.accessibility}
                suffix="/100"
                note={`Acceptance rate and CGPA vs ${data.group_label}.`}
              />
              <StatTile
                label="Student support"
                value={data.summaries.support}
                suffix={`/${data.support_total}`}
                note="Scholarships, internships, part-time work."
              />
            </TileGrid>

            <Card>
              <SectionHeading
                title="Every attribute"
                subtitle={`Country: vs universities in ${data.country}. Similar: vs ${data.group_label}. Better = cheaper, easier entry or higher rates.`}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {data.attributes.map((a) => (
                  <AttributeCard key={a.key} attribute={a} />
                ))}
              </View>
            </Card>

            <Card>
              <SectionHeading title="Data to improve" subtitle="Estimates, unsourced or missing values. Publish them on your official website." />
              <Text style={[styles.bodyText, { marginTop: 6 }]}>
                {toImprove.length ? toImprove.map((a) => a.key).join(' · ') : 'Every value has a source.'}
              </Text>
            </Card>
          </>
        )}
      </InstitutionGate>
    </AppLayout>
  );
}
