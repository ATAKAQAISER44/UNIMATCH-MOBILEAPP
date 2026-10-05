// src/screens/administrator/AdminReportScreen.js
//
// Institutional report (web: administrator/AdministratorReport.jsx): every
// administrator analysis in one document, shared as PDF or CSV. Built once
// performance and the profile (or its error) have loaded; student demand is
// added when available.

import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import AppLayout from '../../components/app/AppLayout';
import ReportDocument from '../../components/ReportDocument';
import { ErrorBox, GradientButton, LoadingBlock, PageHeader } from '../../components/researcher/ResearcherUI';
import { ButtonRow } from '../../components/app/RoleUI';
import { InstitutionGate } from '../../components/administrator/AdminWidgets';
import { useAdminInstitution, useInstitutionPerformance, useInstitutionProfile, useStudentDemand } from '../../services/adminApi';
import { buildInstitutionReport } from '../../utils/institutionReport';
import { buildRecommendations } from '../../utils/adminRecommendations';
import { shareReportCsv, shareReportPdf } from '../../utils/researchReport';

export default function AdminReportScreen({ navigation }) {
  const [institution] = useAdminInstitution();
  const performance = useInstitutionPerformance(institution?.key);
  const profile = useInstitutionProfile(institution);
  const demand = useStudentDemand(profile.data);
  const [sharing, setSharing] = useState('');
  const ready = Boolean(institution && performance.data && (profile.data || profile.error));

  const report = useMemo(
    () =>
      ready
        ? buildInstitutionReport({
            institution,
            performance: performance.data,
            profile: profile.data,
            demand: demand.data,
            recommendations: buildRecommendations({ performance: performance.data, profile: profile.data, demand: demand.data }),
          })
        : null,
    [ready, institution, performance.data, profile.data, demand.data]
  );

  async function share(kind) {
    setSharing(kind);
    try {
      await (kind === 'pdf' ? shareReportPdf(report) : shareReportCsv(report));
    } catch (error) {
      Alert.alert('Export failed', error?.message || 'Could not share the report.');
    } finally {
      setSharing('');
    }
  }

  return (
    <AppLayout navigation={navigation} activeKey="report">
      <PageHeader
        eyebrow="Administrator"
        title="Institutional report"
        subtitle="One report for leadership: rankings, indicators, trend, profile, demand and advice."
        hint="Wait for the analyses, read the report, then share it as PDF or CSV."
      />

      <InstitutionGate institution={institution}>
        <ErrorBox message={performance.error} onRetry={performance.retry} />
        {!report && !performance.error && <LoadingBlock />}

        {report && (
          <>
            <ButtonRow style={{ marginBottom: 12 }}>
              <GradientButton title="Share PDF" small loading={sharing === 'pdf'} disabled={!!sharing} onPress={() => share('pdf')} />
              <GradientButton title="Share CSV" small loading={sharing === 'csv'} disabled={!!sharing} onPress={() => share('csv')} />
            </ButtonRow>
            <View>
              <ReportDocument report={report} />
            </View>
          </>
        )}
      </InstitutionGate>
    </AppLayout>
  );
}
