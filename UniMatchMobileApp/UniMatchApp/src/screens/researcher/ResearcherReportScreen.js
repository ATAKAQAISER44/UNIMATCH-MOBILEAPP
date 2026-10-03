// src/screens/researcher/ResearcherReportScreen.js
//
// Researcher Research Report (web: ResearcherReportPage, UC-R-04 / UC-R-05).
// Pick a saved experiment; the report runs every analysis for it and writes
// up what it found. Share it as PDF or CSV.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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

export default function ResearcherReportScreen({ navigation, route }) {
  const params = route.params || {};
  const [experiments, setExperiments] = useState(null);
  const [selectedId, setSelectedId] = useState(params.experimentId || '');
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');
  const [exportError, setExportError] = useState(null);
  const handledAutoGenerate = useRef(null);

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
    if (params.experimentId) {
      setSelectedId(params.experimentId);
      setReport(null);
    }
  }, [params.experimentId, params.autoGenerate]);

  const selected = useMemo(
    () => (experiments || []).find((item) => item.id === selectedId) || null,
    [experiments, selectedId]
  );

  const experimentOptions = useMemo(
    () =>
      (experiments || []).map((item) => ({
        value: item.id,
        label: `${item.name} — ${DATASET_SHORT[item.dataset] || item.dataset} ${item.year}`,
      })),
    [experiments]
  );

  const generateReport = useCallback(async () => {
    if (!selected) return;
    setGenerating(true);
    setError('');
    setExportError(null);

    try {
      const results = await runReportAnalyses(selected);
      setReport(buildReport(selected, results));
    } catch (runError) {
      setReport(null);
      setError(runError.message || 'The report could not be generated.');
    } finally {
      setGenerating(false);
    }
  }, [selected]);

  // Build straight away when opened with an experiment.
  useEffect(() => {
    if (!params.autoGenerate || handledAutoGenerate.current === params.autoGenerate) return;
    if (!selected || selected.id !== params.experimentId) return;
    handledAutoGenerate.current = params.autoGenerate;
    generateReport();
  }, [params.autoGenerate, params.experimentId, selected, generateReport]);

  const changeExperiment = (id) => {
    setSelectedId(id);
    setReport(null);
    setError('');
  };

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
        eyebrow="Researcher Report"
        title="Research Report"
        subtitle="Pick one of your saved experiments. The report runs every analysis for it — dataset summary, indicator relationships, ranking comparison and the stability test — and writes up what it found. Share it as PDF or CSV."
      />

      {experiments === null ? (
        <Card>
          <LoadingBlock text="Loading saved experiments..." />
        </Card>
      ) : experiments.length === 0 ? (
        <Card style={{ borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>No analysis to report on yet</Text>
          <Text style={[styles.mutedText, { textAlign: 'center', marginVertical: 8 }]}>
            A report is built from a saved experiment. Go to Weight Analysis, set your weights and press "Save as
            Experiment" — then come back here.
          </Text>
          <GradientButton
            title="Open Weight Analysis"
            onPress={() =>
              navigation.navigate(RESEARCHER_ROUTES.weights, { dataset: 'qs' }, { pop: true })
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
            onChange={changeExperiment}
            placeholder="Choose a saved experiment"
          />
          {!!selected?.note && (
            <Text style={[styles.mutedText, { fontStyle: 'italic', marginTop: 6 }]}>“{selected.note}”</Text>
          )}
          <GradientButton
            title={generating ? 'Running analyses...' : report ? 'Generate Again' : 'Generate Report'}
            loading={generating}
            disabled={!selected}
            onPress={generateReport}
            style={{ marginTop: 10 }}
          />
        </Card>
      )}

      {!!error && (
        <ErrorBox
          message={/backend is running/i.test(error) ? error : `${error} Please make sure the backend is running.`}
          onRetry={generateReport}
        />
      )}

      {generating && !report && (
        <Card>
          <LoadingBlock text="Running the dataset summary, relationships, ranking comparison and 500 stability tests..." />
        </Card>
      )}

      {report && (
        <>
          <Card>
            <Text style={[styles.mutedText, { marginBottom: 8 }]}>Report ready · {report.sections.length} sections</Text>
            <View style={styles.twoCol}>
              <GradientButton
                title={exporting === 'pdf' ? 'Preparing PDF...' : 'Share PDF'}
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

          {exportError && (
            <ErrorBox
              message={`The ${exportError.toUpperCase()} file could not be created.`}
              onRetry={() => runExport(exportError)}
            />
          )}

          <ReportDocument report={report} />
        </>
      )}
    </ResearcherLayout>
  );
}
