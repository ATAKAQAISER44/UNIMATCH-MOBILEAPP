// src/screens/researcher/ResearcherReportScreen.js
//
// Researcher Research Report (web: ResearcherReportPage, UC-R-04 / UC-R-05).
// Pick a saved experiment and the report is built straight away - there is
// no "Generate" button. A saved experiment never changes and every analysis
// is deterministic (fixed random seed), so building the same report again
// would give the same result; reports are therefore cached per experiment
// version for this session. Share it as PDF or CSV.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
} from 'react-native';
import { Text } from '../../components/AppText';
import { useFocusEffect } from '@react-navigation/native';

import ResearcherLayout from '../../components/researcher/ResearcherLayout';
import {
  Card,
  ErrorBox,
  FindingCards,
  GradientButton,
  LoadingBlock,
  OutlineButton,
  PageHeader,
  SelectField,
  useLatestRequest,
} from '../../components/researcher/ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { RESEARCHER_ROUTES } from '../../constants/researcherConstants';
import { loadSavedExperiments } from '../../utils/researcherExperiments';
import {
  DATASET_TITLES,
  buildReport,
  formatReportDate,
  runReportAnalyses,
  shareReportCsv,
  shareReportPdf,
} from '../../utils/researchReport';

const DATASET_SHORT = { qs: 'QS', the: 'THE', arwu: 'ARWU' };

// Narrow tables fit the screen; wider ones scroll sideways.
function ReportTable({ table }) {
  const columnWidth = table.head.length > 4 ? 112 : null;

  const content = (
    <View style={[styles.table, columnWidth && { width: columnWidth * table.head.length }]}>
      <View style={styles.tableRow}>
        {table.head.map((cell) => (
          <View key={cell} style={[styles.tableHeadCell, columnWidth ? { width: columnWidth } : { flex: 1 }]}>
            <Text style={styles.tableHeadText}>{cell}</Text>
          </View>
        ))}
      </View>
      {table.body.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          {row.map((cell, cellIndex) => (
            <View
              key={cellIndex}
              style={[
                styles.tableCell,
                columnWidth ? { width: columnWidth } : { flex: 1 },
                rowIndex % 2 === 1 && { backgroundColor: '#F3FBF8' },
              ]}
            >
              <Text style={[styles.tableCellText, cellIndex === 0 && { fontWeight: '800' }]}>{String(cell)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={[styles.findingTitle, { marginBottom: 6 }]}>{table.caption}</Text>
      {columnWidth ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

function ReportDocument({ report }) {
  return (
    <Card>
      <View style={{ borderBottomWidth: 1, borderBottomColor: authTheme.colors.brandBorder, paddingBottom: 12 }}>
        <View style={{ width: 56, height: 5, borderRadius: 999, backgroundColor: authTheme.colors.brandTeal, marginBottom: 10 }} />
        <Text style={[styles.heroTitle, { color: authTheme.colors.brandTeal }]}>{report.title}</Text>
        <Text style={[styles.findingTitle, { marginBottom: 2 }]}>{report.subtitle}</Text>
        <Text style={styles.mutedText}>
          Generated {formatReportDate(report.generatedAt)} · {DATASET_TITLES[report.experiment.dataset]}
        </Text>
      </View>

      {report.sections.map((section, index) => (
        <View
          key={section.id}
          style={{
            paddingVertical: 14,
            borderBottomWidth: index === report.sections.length - 1 ? 0 : 1,
            borderBottomColor: authTheme.colors.brandBorder,
          }}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {!!section.intro && <Text style={[styles.mutedText, { marginBottom: 8 }]}>{section.intro}</Text>}

          <FindingCards findings={section.findings} />

          {section.paragraphs?.map((paragraph) => (
            <Text key={paragraph} style={[styles.bodyText, { marginBottom: 6 }]}>
              • {paragraph}
            </Text>
          ))}

          {section.tables?.map((table) => (
            <ReportTable key={table.caption} table={table} />
          ))}
        </View>
      ))}
    </Card>
  );
}

// Built reports, keyed by experiment id + save time (a re-saved experiment
// gets a new key, so its report is rebuilt).
const reportCache = new Map();

export function reportCacheKey(experiment) {
  return experiment ? `${experiment.id}|${experiment.createdAt || ''}` : '';
}

export default function ResearcherReportScreen({ navigation, route }) {
  const params = route.params || {};
  const [experiments, setExperiments] = useState(null);
  const [selectedId, setSelectedId] = useState(params.experimentId || '');
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [exporting, setExporting] = useState('');
  const [exportError, setExportError] = useState(null);
  const startRequest = useLatestRequest();

  useFocusEffect(
    useCallback(() => {
      loadSavedExperiments().then((list) => {
        setExperiments(list);
        setSelectedId((current) =>
          current && list.some((item) => item.id === current) ? current : list[0]?.id || ''
        );
      });
    }, [])
  );

  // Opened from a saved experiment's "Report" button.
  useEffect(() => {
    if (params.experimentId) setSelectedId(params.experimentId);
  }, [params.experimentId, params.autoGenerate]);

  const selected = useMemo(
    () => (experiments || []).find((item) => item.id === selectedId) || null,
    [experiments, selectedId]
  );
  const selectedKey = reportCacheKey(selected);

  const experimentOptions = useMemo(
    () =>
      (experiments || []).map((item) => ({
        value: item.id,
        label: `${item.name} — ${DATASET_SHORT[item.dataset] || item.dataset} ${item.year}`,
      })),
    [experiments]
  );

  // Build the report for the chosen experiment (or reuse the cached one).
  useEffect(() => {
    const isCurrent = startRequest();
    setExportError(null);

    if (!selected) {
      setReport(null);
      setGenerating(false);
      return;
    }

    const cached = reportCache.get(selectedKey);
    if (cached) {
      setReport(cached);
      setError('');
      setGenerating(false);
      return;
    }

    setReport(null);
    setError('');
    setGenerating(true);

    runReportAnalyses(selected)
      .then((results) => {
        if (!isCurrent()) return;
        const built = buildReport(selected, results);
        reportCache.set(selectedKey, built);
        setReport(built);
      })
      .catch((runError) => {
        if (!isCurrent()) return;
        setError(runError.message || 'The report could not be built.');
      })
      .finally(() => {
        if (isCurrent()) setGenerating(false);
      });
    // selectedKey identifies the experiment version.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, retryKey, startRequest]);

  const runExport = async (format) => {
    setExporting(format);
    setExportError(null);
    try {
      if (format === 'pdf') await shareReportPdf(report);
      else await shareReportCsv(report);
    } catch (exportFailure) {
      console.error('Report export failed:', exportFailure);
      setExportError(format);
    } finally {
      setExporting('');
    }
  };

  return (
    <ResearcherLayout navigation={navigation} activeKey="report">
      <PageHeader
        title="Research Report"
        subtitle="Full write-up of a saved experiment"
      />

      {experiments === null ? (
        <Card>
          <LoadingBlock />
        </Card>
      ) : experiments.length === 0 ? (
        <Card style={{ borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>No saved experiments yet</Text>
          <Text style={[styles.mutedText, { textAlign: 'center', marginVertical: 8 }]}>
            Save one in Weight Analysis, then come back here.
          </Text>
          <GradientButton
            title="Open Weight Analysis"
            onPress={() =>
              navigation.navigate(RESEARCHER_ROUTES.weights, { dataset: 'qs', section: 'weights' }, { pop: true })
            }
          />
        </Card>
      ) : (
        <Card>
          <SelectField
            label="Experiment"
            title="Saved experiment"
            value={selectedId}
            options={experimentOptions}
            onChange={setSelectedId}
            placeholder="Choose a saved experiment"
          />
          {!!selected?.note && (
            <Text style={[styles.mutedText, { fontStyle: 'italic', marginTop: 6 }]}>“{selected.note}”</Text>
          )}

          {report && (
            <View style={[styles.twoCol, { marginTop: 10 }]}>
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
          )}
        </Card>
      )}

      {!!error && <ErrorBox message={error} onRetry={() => setRetryKey((value) => value + 1)} />}

      {exportError && (
        <ErrorBox
          message={`The ${exportError.toUpperCase()} file could not be created.`}
          onRetry={() => runExport(exportError)}
        />
      )}

      {generating && (
        <Card>
          <LoadingBlock />
        </Card>
      )}

      {report && !generating && <ReportDocument report={report} />}
    </ResearcherLayout>
  );
}
