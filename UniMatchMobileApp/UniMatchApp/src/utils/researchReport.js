// src/utils/researchReport.js
//
// Research report (UC-R-04) and its PDF / CSV export (UC-R-05), ported from
// the web app. buildReport() turns analysis results into plain sections; the
// report screen, the PDF and the CSV are all drawn from that one structure,
// so they always say the same thing. On mobile the PDF is rendered from HTML
// with expo-print instead of jsPDF.

import {
  RESEARCHER_DATASETS,
  officialDefaultWeights,
  officialMetricLabel,
} from '../constants/researcherConstants';
import {
  fetchResearcherStatistics,
  runRankStability,
  runWeightAnalysis,
} from '../services/researcherApi';
import { shareCSV, sharePdfFromHtml } from './researcherExport';
import {
  VERDICTS,
  buildCorrelationFindings,
  buildStabilityFindings,
  buildSummaryFindings,
  strengthOf,
} from './researchInsights';

export const DATASET_TITLES = {
  qs: RESEARCHER_DATASETS.qs.title,
  the: RESEARCHER_DATASETS.the.title,
  arwu: RESEARCHER_DATASETS.arwu.title,
};

const DATASET_SHORT = { qs: "QS", the: "THE", arwu: "ARWU" };

// Runs every analysis the report needs for one saved experiment.
export async function runReportAnalyses(experiment) {
  const { dataset, year, weights, variation } = experiment;

  const [statistics, analysis, stability] = await Promise.all([
    fetchResearcherStatistics(dataset, { year }),
    runWeightAnalysis(dataset, { year, weights, top_n: 0 }),
    runRankStability(dataset, { year, weights, variation: variation ?? 0.2, top_n: 100 }),
  ]);

  return { statistics, analysis, stability };
}

const pct = (value) => `${Math.round(value * 100)}%`;
const formatNumber = (value) => (value == null ? "N/A" : String(value));

function toShares(weights, keys) {
  const total = keys.reduce((sum, key) => sum + Number(weights[key] || 0), 0) || 1;
  return Object.fromEntries(keys.map((key) => [key, Number(weights[key] || 0) / total]));
}

function comparisonFindings(results) {
  const findings = [];
  const officialTop10 = results.filter((row) => row.official_rank != null && row.official_rank <= 10);
  const stillTop10 = officialTop10.filter((row) => row.experimental_rank <= 10).length;
  findings.push({
    tone: stillTop10 >= 8 ? "good" : "normal",
    title: "Top 10",
    text: `${stillTop10} of the ${officialTop10.length} universities in the official top 10 are still in the top 10 with these weights.`,
  });

  const climbers = results
    .filter((row) => row.experimental_rank <= 100 && row.rank_change > 0)
    .sort((a, b) => b.rank_change - a.rank_change);
  if (climbers[0]) {
    findings.push({
      tone: "normal",
      title: "Biggest climber",
      text: `${climbers[0].name} moves from #${climbers[0].official_rank} to #${climbers[0].experimental_rank} (${climbers[0].rank_change} places up).`,
    });
  }

  const officialTop100 = results.filter((row) => row.official_rank != null && row.official_rank <= 100);
  const fallers = officialTop100.filter((row) => row.rank_change < 0).sort((a, b) => a.rank_change - b.rank_change);
  if (fallers[0]) {
    findings.push({
      tone: "normal",
      title: "Biggest drop",
      text: `${fallers[0].name} drops from #${fallers[0].official_rank} to #${fallers[0].experimental_rank} (${Math.abs(fallers[0].rank_change)} places down).`,
    });
  }

  if (officialTop100.length) {
    const averageMove =
      officialTop100.reduce((sum, row) => sum + Math.abs(row.rank_change ?? 0), 0) / officialTop100.length;
    findings.push({
      tone: "normal",
      title: "Average movement",
      text: `Universities in the official top 100 move ${averageMove.toFixed(1)} places on average compared with the official ranking.`,
    });
  }

  return { findings, climbers: climbers.slice(0, 5), fallers: fallers.slice(0, 5) };
}

// Builds the report sections from the analysis results.
export function buildReport(experiment, { statistics, analysis, stability }) {
  const dataset = experiment.dataset;
  const overallKey = statistics.overall?.key;
  const labelFor = (key) => (key === overallKey ? "Overall Score" : officialMetricLabel(dataset, key));
  const sections = [];

  // 1. Dataset summary
  const summaryRows = statistics.indicators.map((row) => ({ ...row, label: labelFor(row.key) }));
  if (statistics.overall) summaryRows.push({ ...statistics.overall, label: "Overall Score", isOverall: true });
  sections.push({
    id: "dataset",
    title: "1. Dataset summary",
    intro: `${DATASET_TITLES[dataset]} ${statistics.year}: ${statistics.total_universities} universities and ${statistics.indicators.length} indicators. "Average" is the mean, "Middle value" is the median, "No score" counts universities the ranking did not give an exact value.`,
    findings: buildSummaryFindings(summaryRows, statistics.total_universities),
    tables: [
      {
        caption: "Summary of every indicator",
        head: ["Indicator", "Have a score", "No score", "Average", "Middle value", "Lowest", "Highest"],
        body: summaryRows.map((row) => [
          row.label,
          row.available,
          `${row.missing} (${row.missing_pct ?? 0}%)`,
          formatNumber(row.mean),
          formatNumber(row.median),
          formatNumber(row.min),
          formatNumber(row.max),
        ]),
      },
    ],
  });

  // 2. Indicator relationships
  const correlation = statistics.correlation || { keys: [], matrix: [], pairs: [] };
  const cells = [];
  correlation.keys.forEach((a, i) =>
    correlation.keys.forEach((b, j) => {
      if (j > i) {
        cells.push({
          a,
          b,
          labelA: labelFor(a),
          labelB: labelFor(b),
          value: correlation.matrix[i][j],
          pairs: correlation.pairs[i][j],
        });
      }
    })
  );
  const strongest = cells
    .filter((cell) => cell.value != null)
    .sort((x, y) => Math.abs(y.value) - Math.abs(x.value))
    .slice(0, 8);
  sections.push({
    id: "relationships",
    title: "2. How the indicators relate",
    intro:
      "Each number runs from -1 to +1: close to +1 means two indicators rise and fall together, close to 0 means no link, negative means they move in opposite directions.",
    findings: buildCorrelationFindings(cells, correlation.keys.includes(overallKey) ? overallKey : null),
    tables: strongest.length
      ? [
          {
            caption: "Most strongly linked pairs",
            head: ["Indicator", "Indicator", "Link", "Strength", "Universities"],
            body: strongest.map((cell) => [
              cell.labelA,
              cell.labelB,
              cell.value,
              `${strengthOf(cell.value)}${cell.value < 0 && Math.abs(cell.value) >= 0.2 ? " (opposite)" : ""}`,
              cell.pairs,
            ]),
          },
        ]
      : [],
  });

  // 3. Weights used
  const metricKeys = Object.keys(analysis.normalized_weights || experiment.weights || {});
  const allKeys = Array.from(new Set([...Object.keys(experiment.weights || {}), ...metricKeys]));
  const yourShares = toShares(experiment.weights || {}, allKeys);
  const officialShares = toShares(officialDefaultWeights(dataset, allKeys), allKeys);
  const changed = allKeys
    .map((key) => ({ key, diff: yourShares[key] - officialShares[key] }))
    .filter((item) => Math.abs(item.diff) >= 0.005)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  sections.push({
    id: "weights",
    title: "3. Experiment weights",
    intro: `Experiment "${experiment.name}"${experiment.note ? ` — ${experiment.note}` : ""}. Weights are shown as a share of the total, next to the ranking's own published weights.`,
    findings: [
      changed.length
        ? {
            tone: "normal",
            title: "Biggest change from the official weights",
            text: `${labelFor(changed[0].key)}: ${pct(officialShares[changed[0].key])} officially, ${pct(yourShares[changed[0].key])} in this experiment.`,
          }
        : {
            tone: "good",
            title: "Same as official",
            text: "This experiment uses the ranking's own published weights.",
          },
    ],
    tables: [
      {
        caption: "Weights",
        head: ["Indicator", "Official weight", "Experiment weight", "Difference"],
        body: allKeys
          .sort((a, b) => yourShares[b] - yourShares[a])
          .map((key) => {
            const diff = Math.round((yourShares[key] - officialShares[key]) * 100);
            return [labelFor(key), pct(officialShares[key]), pct(yourShares[key]), diff > 0 ? `+${diff}%` : `${diff}%`];
          }),
      },
    ],
  });

  // 4. Ranking comparison
  const results = analysis.results || [];
  const comparison = comparisonFindings(results);
  const moverRow = (row) => [row.name, `#${row.official_rank}`, `#${row.experimental_rank}`, row.rank_change > 0 ? `+${row.rank_change}` : row.rank_change];
  sections.push({
    id: "comparison",
    title: "4. Ranking comparison: official vs experiment",
    intro: "How the ranking changes when the experiment's weights are used instead of the official ones. A positive change means the university moved up.",
    findings: comparison.findings,
    tables: [
      {
        caption: "Top 10 with the experiment weights",
        head: ["Experiment rank", "University", "Country", "Official rank", "Change"],
        body: results.slice(0, 10).map((row) => [
          `#${row.experimental_rank}`,
          row.name,
          row.country || "",
          row.official_rank != null ? `#${row.official_rank}` : "N/A",
          row.rank_change > 0 ? `+${row.rank_change}` : row.rank_change ?? "N/A",
        ]),
      },
      ...(comparison.climbers.length
        ? [{ caption: "Biggest climbers (experiment top 100)", head: ["University", "Official", "Experiment", "Change"], body: comparison.climbers.map(moverRow) }]
        : []),
      ...(comparison.fallers.length
        ? [{ caption: "Biggest drops (official top 100)", head: ["University", "Official", "Experiment", "Change"], body: comparison.fallers.map(moverRow) }]
        : []),
    ],
  });

  // 5. Sensitivity
  const stabilityLabel = (key) => labelFor(key);
  const mostSensitive = [...stability.results]
    .sort((a, b) => b.range_high - b.range_low - (a.range_high - a.range_low))
    .slice(0, 5);
  sections.push({
    id: "sensitivity",
    title: "5. Sensitivity: how stable are the ranks?",
    intro: `Each weight was changed at random by up to ±${Math.round(stability.variation * 100)}% and the ranking rebuilt ${stability.runs} times. "Usual range" is where a university ranked in 90% of those tests.`,
    findings: buildStabilityFindings(stability, stabilityLabel),
    tables: [
      {
        caption: `Stability of the top ${stability.results.length}`,
        head: ["Verdict", "Universities", "Meaning"],
        body: Object.entries(VERDICTS).map(([key, verdict]) => [
          verdict.label,
          stability.verdict_counts[key],
          verdict.meaning,
        ]),
      },
      {
        caption: "Ranks that move the most",
        head: ["University", "Rank", "Usual range", "Verdict"],
        body: mostSensitive.map((row) => [
          row.name,
          `#${row.rank}`,
          `#${row.range_low} – #${row.range_high}`,
          VERDICTS[row.verdict].label,
        ]),
      },
      {
        caption: "Which weight moves the ranking most",
        head: ["Indicator", "Average places moved"],
        body: stability.indicator_impact.map((item) => [stabilityLabel(item.key), item.average_shift]),
      },
    ],
  });

  // 6. Method
  sections.push({
    id: "method",
    title: "6. Method notes",
    paragraphs: [
      "Statistics use the scores exactly as each ranking published them; missing values and scores given only as a range are counted as missing, not filled in.",
      "Relationships use Spearman rank correlation, which compares the order of universities, so a few extreme scores cannot distort the result. Each pair uses only universities that have both scores.",
      "Experimental ranks use each indicator's 0-1 normalised score multiplied by the experiment weights (re-scaled to 100%); missing scores are filled with the indicator's median.",
      `The stability test is a Monte Carlo sensitivity analysis with a fixed random seed (${stability.seed}), so the same experiment always gives the same result.`,
    ],
  });

  return {
    title: "UniMatch Research Report",
    subtitle: `${DATASET_TITLES[dataset]} ${statistics.year} · Experiment: ${experiment.name}`,
    experiment,
    datasetLabel: `${DATASET_SHORT[dataset]} ${statistics.year}`,
    generatedAt: new Date().toISOString(),
    sections,
  };
}

function fileBaseName(report) {
  if (report.fileName) return report.fileName;
  return `research-report-${report.experiment.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatReportDate(value) {
  return formatDateTime(value);
}

export function shareReportCsv(report) {
  const rows = [
    ['Report', report.subtitle],
    ['Generated', formatDateTime(report.generatedAt)],
  ];

  report.sections.forEach((section) => {
    rows.push([], [section.title]);
    if (section.intro) rows.push(['', section.intro]);
    (section.findings || []).forEach((finding) => rows.push(['Finding', finding.title, finding.text]));
    (section.paragraphs || []).forEach((paragraph) => rows.push(['', paragraph]));
    (section.tables || []).forEach((table) => {
      rows.push([], [table.caption], table.head, ...table.body);
    });
  });

  return shareCSV([report.title || 'UniMatch Research Report', ''], rows, `${fileBaseName(report)}.csv`);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const FINDING_COLORS = {
  warning: { border: '#FDE68A', background: '#FFFBEB' },
  good: { border: '#A7F3D0', background: '#ECFDF5' },
  normal: { border: '#BCEAD8', background: '#F3FBF8' },
};

// Same layout as the web PDF: teal title block, sections with findings,
// bullet notes and striped tables, page footer.
export function buildReportHtml(report) {
  const sectionsHtml = report.sections
    .map((section) => {
      const findings = (section.findings || [])
        .map((finding) => {
          const tone = FINDING_COLORS[finding.tone] || FINDING_COLORS.normal;
          return `<div class="finding" style="border-color:${tone.border};background:${tone.background}">
            <div class="finding-title">${escapeHtml(finding.title)}</div>
            <div class="finding-text">${escapeHtml(finding.text)}</div>
          </div>`;
        })
        .join('');

      const paragraphs = (section.paragraphs || []).length
        ? `<ul>${section.paragraphs.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`
        : '';

      const tables = (section.tables || [])
        .map(
          (table) => `<div class="caption">${escapeHtml(table.caption)}</div>
          <table>
            <thead><tr>${table.head.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>
            <tbody>${table.body
              .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
              .join('')}</tbody>
          </table>`
        )
        .join('');

      return `<section>
        <h2>${escapeHtml(section.title)}</h2>
        ${section.intro ? `<p class="intro">${escapeHtml(section.intro)}</p>` : ''}
        ${findings}
        ${paragraphs}
        ${tables}
      </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 40px 36px 50px 36px; }
  body { font-family: Helvetica, Arial, sans-serif; color: #0F172A; font-size: 11px; }
  .bar { height: 6px; background: #008C8C; margin-bottom: 14px; }
  h1 { color: #008C8C; font-size: 22px; margin: 0 0 4px 0; }
  .subtitle { font-weight: bold; font-size: 12px; margin-bottom: 2px; }
  .generated { color: #64748B; font-size: 9px; margin-bottom: 16px; }
  section { margin-bottom: 14px; }
  h2 { color: #008C8C; font-size: 15px; margin: 16px 0 4px 0; page-break-after: avoid; }
  .intro { color: #64748B; font-size: 10px; margin: 0 0 8px 0; line-height: 1.45; }
  .finding { border: 1px solid; border-radius: 8px; padding: 7px 9px; margin-bottom: 6px; page-break-inside: avoid; }
  .finding-title { font-weight: bold; font-size: 11px; margin-bottom: 2px; }
  .finding-text { font-size: 10.5px; line-height: 1.45; }
  ul { padding-left: 16px; margin: 6px 0; }
  li { font-size: 10px; margin-bottom: 4px; line-height: 1.45; }
  .caption { font-weight: bold; font-size: 11px; margin: 10px 0 4px 0; page-break-after: avoid; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9px; }
  th { background: #008C8C; color: #FFFFFF; text-align: left; padding: 4px; border: 1px solid #B7E9D4; }
  td { padding: 4px; border: 1px solid #B7E9D4; }
  tr:nth-child(even) td { background: #ECFDF5; }
  tr { page-break-inside: avoid; }
  .footer { margin-top: 18px; color: #64748B; font-size: 8px; border-top: 1px solid #E2E8F0; padding-top: 6px; }
</style>
</head>
<body>
  <div class="bar"></div>
  <h1>${escapeHtml(report.title)}</h1>
  <div class="subtitle">${escapeHtml(report.subtitle)}</div>
  <div class="generated">Generated ${escapeHtml(formatDateTime(report.generatedAt))}</div>
  ${sectionsHtml}
  <div class="footer">${escapeHtml(report.footer || `UniMatch Research Report · ${report.datasetLabel} · ${report.experiment?.name}`)}</div>
</body>
</html>`;
}

export function shareReportPdf(report) {
  return sharePdfFromHtml(buildReportHtml(report), `${fileBaseName(report)}.pdf`);
}
