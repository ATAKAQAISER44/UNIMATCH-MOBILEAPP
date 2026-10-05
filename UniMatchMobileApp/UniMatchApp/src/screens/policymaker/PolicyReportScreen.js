// src/screens/policymaker/PolicyReportScreen.js
//
// Policymaker report (web: policymaker/PolicymakerReport). Rule-based
// recommendations (highest priority first), share as PDF / CSV, and the full
// report document.

import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Text } from '../../components/AppText';
import AppLayout from '../../components/app/AppLayout';
import { Pill } from '../../components/app/RoleUI';
import ReportDocument from '../../components/ReportDocument';
import {
  Card,
  ErrorBox,
  GradientButton,
  LoadingBlock,
  OutlineButton,
  PageHeader,
  SectionHeading,
} from '../../components/researcher/ResearcherUI';
import { CountryGate } from '../../components/policymaker/PolicyUI';
import { PRIORITY_STYLE } from '../../constants/roleConstants';
import { useCountryOverview, usePolicyCountry } from '../../services/policyApi';
import { buildPolicyRecommendations, buildPolicyReport } from '../../utils/policyReport';
import { shareReportCsv, shareReportPdf } from '../../utils/researchReport';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';

function Recommendation({ item }) {
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: authTheme.colors.brandBorder,
        backgroundColor: '#FFFFFF',
        padding: 11,
        marginTop: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Pill label={item.priority} tone={PRIORITY_STYLE[item.priority]} />
        <Text style={[styles.eyebrow, { marginBottom: 0 }]}>{item.source}</Text>
      </View>
      <Text style={[styles.findingTitle, { marginTop: 6, marginBottom: 2 }]}>{item.text}</Text>
      <Text style={styles.mutedText}>{item.evidence}</Text>
    </View>
  );
}

export default function PolicyReportScreen({ navigation }) {
  const [country] = usePolicyCountry();
  const { data, loading, error, retry } = useCountryOverview(country);
  const [exporting, setExporting] = useState('');
  const [exportError, setExportError] = useState('');

  const recommendations = useMemo(() => (data ? buildPolicyRecommendations(data) : []), [data]);
  const report = useMemo(() => (data ? buildPolicyReport(data, recommendations) : null), [data, recommendations]);

  const runExport = async (format) => {
    setExporting(format);
    setExportError('');
    try {
      if (format === 'pdf') await shareReportPdf(report);
      else await shareReportCsv(report);
    } catch (failure) {
      console.error('Policy report export failed:', failure);
      setExportError(format);
    } finally {
      setExporting('');
    }
  };

  return (
    <AppLayout navigation={navigation} activeKey="report" refreshing={false} onRefresh={country ? retry : undefined}>
      <PageHeader
        eyebrow="Policymaker"
        title={country ? `${country}: policy report` : 'Policy report'}
        subtitle="The country's main gaps, what to do first, and a report to share."
        hint="Read the recommendations, then share the full report as PDF or CSV."
      />

      <CountryGate country={country}>
        {loading && (
          <Card>
            <LoadingBlock />
          </Card>
        )}
        <ErrorBox message={error} onRetry={retry} />

        {report && (
          <>
            <Card>
              <SectionHeading title="Recommendations" subtitle="Rule-based, highest priority first, each with its evidence." />
              {recommendations.length === 0 ? (
                <Text style={[styles.mutedText, { marginTop: 8 }]}>No large gap was found, so there is no recommendation.</Text>
              ) : (
                recommendations.map((item) => <Recommendation key={`${item.priority}-${item.text}`} item={item} />)
              )}

              <View style={[styles.twoCol, { marginTop: 12 }]}>
                <GradientButton
                  title="Share PDF"
                  loading={exporting === 'pdf'}
                  disabled={!!exporting}
                  onPress={() => runExport('pdf')}
                  style={styles.flex1}
                />
                <OutlineButton
                  title="Share CSV"
                  disabled={!!exporting}
                  onPress={() => runExport('csv')}
                  style={styles.flex1}
                />
              </View>
            </Card>

            {!!exportError && (
              <ErrorBox
                message={`The ${exportError.toUpperCase()} file could not be created.`}
                onRetry={() => runExport(exportError)}
              />
            )}

            <ReportDocument report={report} />
          </>
        )}
      </CountryGate>
    </AppLayout>
  );
}
