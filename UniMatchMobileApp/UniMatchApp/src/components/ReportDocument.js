// src/components/ReportDocument.js
//
// On-screen view of a report built as { title, subtitle, meta, generatedAt,
// sections } - the research report, the institutional report, the policy
// report and the student shortlist. The PDF and CSV use the same shape.

import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from './AppText';

import { FindingCards, Card } from './researcher/ResearcherUI';
import { researcherStyles as styles } from '../styles/researcherStyles';
import { authTheme } from '../styles/authTheme';
import { DATASET_TITLES, formatReportDate } from '../utils/researchReport';

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

export default function ReportDocument({ report }) {
  return (
    <Card>
      <View style={{ borderBottomWidth: 1, borderBottomColor: authTheme.colors.brandBorder, paddingBottom: 12 }}>
        <View style={{ width: 56, height: 5, borderRadius: 999, backgroundColor: authTheme.colors.brandTeal, marginBottom: 10 }} />
        <Text style={[styles.heroTitle, { color: authTheme.colors.brandTeal }]}>{report.title}</Text>
        <Text style={[styles.findingTitle, { marginBottom: 2 }]}>{report.subtitle}</Text>
        <Text style={styles.mutedText}>
          Generated {formatReportDate(report.generatedAt)} · {report.meta || DATASET_TITLES[report.experiment?.dataset] || 'UniMatch'}
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

