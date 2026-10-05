// Ported from the web app (policymaker/policyReport.js) unchanged apart from imports.
// Policy recommendations (rule-based) and the policy report (UC-PM report /
// export) in the shared { title, subtitle, generatedAt, sections } shape, so the
// ReportDocument view and the PDF / CSV export are reused.

import { officialMetricLabel } from "../constants/researcherConstants";
import { RANKING_ORDER, RANKING_STYLE } from "../constants/roleConstants";
import { ACCESS_ROWS, formatValue } from "../constants/roleConstants";

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

export function buildPolicyRecommendations(data) {
  const list = [];
  const add = (priority, source, text, evidence) => list.push({ priority, source, text, evidence });

  RANKING_ORDER.forEach((key) => {
    const r = data.rankings[key];
    const label = RANKING_STYLE[key].label;
    if (!r.country.count) {
      add("Medium", "Ranking", `Encourage universities to take part in ${label}.`, `No university from ${data.country} is ranked by ${label}.`);
      return;
    }
    r.metrics.forEach((m) => {
      // Mobile fix: a missing (unpublished) median is not a gap.
      if (r.country.indicators[m] == null || r.world.indicators[m] == null) return;
      const gap = r.country.indicators[m] - r.world.indicators[m];
      if (gap <= -10) {
        add(gap <= -20 ? "High" : "Medium", "Ranking", `Invest in ${officialMetricLabel(key, m)} (${label}).`,
          `National median is ${Math.abs(Math.round(gap))} points below the world median.`);
      }
    });
    const points = data.trend[key].slice(-5);
    if (points.length > 1 && points[points.length - 1].top_500 < points[0].top_500) {
      add("High", "Ranking", `Find out why fewer universities reach the ${label} top 500.`,
        `${points[0].top_500} in ${points[0].year}, ${points[points.length - 1].top_500} in ${points[points.length - 1].year}.`);
    }
  });

  const { country, region } = data.access;
  const fee = "Tuition Fee (international)";
  if (country.medians[fee] && region.medians[fee] && country.medians[fee] > region.medians[fee] * 1.5) {
    add("Medium", "Attributes", "Review international fees or fund more scholarships.",
      `Median international fee ${formatValue(country.medians[fee], "$")} vs ${formatValue(region.medians[fee], "$")} in ${data.region}.`);
  }
  if (country.scholarship_share !== null && region.scholarship_share !== null && country.scholarship_share < region.scholarship_share - 10) {
    add("Medium", "Attributes", "Widen scholarship availability.", `${country.scholarship_share}% of universities offer scholarships vs ${region.scholarship_share}% in ${data.region}.`);
  }
  const emp = "Graduate Employability Rate";
  if (country.medians[emp] && region.medians[emp] && country.medians[emp] < region.medians[emp] - 5) {
    add("Medium", "Attributes", "Strengthen links between universities and employers.", `Median employability ${country.medians[emp]}% vs ${region.medians[emp]}% in ${data.region}.`);
  }

  return list.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

export function buildPolicyReport(data, recommendations) {
  const ranked = RANKING_ORDER.filter((key) => data.rankings[key].country.count);
  const years = [...new Set(RANKING_ORDER.flatMap((key) => data.trend[key].map((p) => p.year)))].sort();

  const sections = [
    {
      id: "presence",
      title: "1. Ranking presence",
      intro: `Universities from ${data.country} in the latest edition of each ranking.`,
      tables: [{
        caption: "Universities ranked",
        head: ["Ranking", "Year", "Ranked", "Top 100", "Top 200", "Top 500", "Best"],
        body: RANKING_ORDER.map((key) => {
          const r = data.rankings[key];
          return [RANKING_STYLE[key].label, r.year, r.country.count, r.country.tiers["100"], r.country.tiers["200"], r.country.tiers["500"],
            r.country.best_rank ? `#${r.country.best_rank} ${r.country.best_university}` : "-"];
        }),
      }],
    },
    {
      id: "gaps",
      title: "2. Indicator gaps",
      intro: `Median published score in ${data.country}, ${data.region} and the world.`,
      tables: ranked.map((key) => {
        const r = data.rankings[key];
        return {
          caption: `${RANKING_STYLE[key].label} ${r.year}`,
          head: ["Indicator", data.country, data.region, "World"],
          body: r.metrics.map((m) => [officialMetricLabel(key, m), r.country.indicators[m] ?? "-", r.region.indicators[m] ?? "-", r.world.indicators[m] ?? "-"]),
        };
      }),
    },
    {
      id: "trend",
      title: "3. Trend",
      intro: "Universities in the top 500 by edition. Rankings change their methods from time to time.",
      tables: [{
        caption: "Top-500 universities by year",
        head: ["Year", ...RANKING_ORDER.map((key) => RANKING_STYLE[key].label)],
        body: years.map((year) => [year, ...RANKING_ORDER.map((key) => data.trend[key].find((p) => p.year === year)?.top_500 ?? "-")]),
      }],
    },
    {
      id: "access",
      title: "4. Access & affordability",
      intro: `Medians from the UniMatch attributes dataset (${data.access.country.count} universities in ${data.country}); some values are estimates.`,
      tables: [{
        caption: "Students' view",
        head: ["", data.country, data.region, "World"],
        body: [
          ...ACCESS_ROWS.map(([column, unit]) => [column, ...["country", "region", "world"].map((s) => formatValue(data.access[s].medians[column], unit))]),
          ["Offering scholarships", ...["country", "region", "world"].map((s) => formatValue(data.access[s].scholarship_share, "%"))],
          ["Public universities", ...["country", "region", "world"].map((s) => formatValue(data.access[s].public_share, "%"))],
        ],
      }],
    },
    {
      id: "recommendations",
      title: "5. Recommendations",
      intro: "Rule-based suggestions with their evidence; they are not predictions.",
      tables: [{ caption: "Recommendations", head: ["Priority", "From", "Recommendation", "Evidence"], body: recommendations.map((r) => [r.priority, r.source, r.text, r.evidence]) }],
    },
    {
      id: "method",
      title: "6. Method notes",
      paragraphs: [
        "Ranking scores are used exactly as published; medians use only universities with a published score.",
        "Region comes from the UniMatch attributes dataset; countries are matched across rankings by a normalised country name.",
        "Rankings and attributes are reported separately and never combined into one score.",
      ],
    },
  ];

  return {
    title: "UniMatch Policy Report",
    subtitle: `${data.country}${data.region ? `, ${data.region}` : ""}`,
    meta: "QS, THE and ARWU with the UniMatch attributes dataset",
    footer: `UniMatch Policy Report · ${data.country}`,
    fileName: `policy-report-${data.country.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    generatedAt: new Date().toISOString(),
    sections,
  };
}
