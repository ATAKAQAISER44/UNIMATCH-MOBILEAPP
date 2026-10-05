// Ported from the web app (administrator/institutionReport.js) unchanged apart from imports.
// Institutional report (UC-UA-04): the administrator analyses as plain
// { title, subtitle, generatedAt, sections }, so the same ReportDocument view
// and the researcher PDF / CSV export can show it.

import { officialMetricLabel } from "../constants/researcherConstants";
import { RANKING_ORDER, RANKING_STYLE } from "../constants/roleConstants";
import { STATUS_STYLE } from "../constants/roleConstants";

const show = (value, suffix = "") => (value === null || value === undefined ? "N/A" : `${value}${suffix}`);

export function buildInstitutionReport({ institution, performance, profile, demand, recommendations }) {
  const ranked = RANKING_ORDER.filter((key) => performance.rankings[key]);
  const sections = [];

  sections.push({
    id: "snapshot",
    title: "1. Ranking snapshot",
    intro: "Latest edition of each ranking. A smaller number is a better rank.",
    tables: [{
      caption: "Position in each ranking",
      head: ["Ranking", "Year", "Rank", "Previous", "In country", "Better than"],
      body: RANKING_ORDER.map((key) => {
        const p = performance.rankings[key];
        const label = RANKING_STYLE[key].label;
        if (!p) return [label, "-", "Not ranked", "-", "-", "-"];
        return [label, p.year, `#${p.official_rank}`, p.previous_rank ? `#${p.previous_rank} (${p.previous_year})` : "-",
          `${p.national_rank} of ${p.national_total}`, `${p.global_percentile}% of ${p.total_ranked}`];
      }),
    }],
  });

  sections.push({
    id: "indicators",
    title: "2. Indicators, strengths and weaknesses",
    intro: `Each indicator against all ranked universities, the same country, and universities within ±${performance.peer_rank_band} places (peers).`,
    findings: ranked.flatMap((key) => {
      const p = performance.rankings[key];
      const list = (items) => items.map((i) => `${officialMetricLabel(key, i.key)} (${i.gap > 0 ? "+" : ""}${i.gap})`).join(", ") || "none";
      return [
        { title: `${RANKING_STYLE[key].label} strengths`, text: list(p.strengths), tone: "good" },
        { title: `${RANKING_STYLE[key].label} weaknesses`, text: list(p.weaknesses), tone: "warning" },
      ];
    }),
    tables: ranked.map((key) => ({
      caption: `${RANKING_STYLE[key].label} ${performance.rankings[key].year} indicators`,
      head: ["Indicator", "Score", "World", "Country", "Peer median", "Gap"],
      body: performance.rankings[key].indicators.map((i) => [officialMetricLabel(key, i.key), show(i.value), show(i.percentile, "%"),
        show(i.national_percentile, "%"), show(i.peer_median), show(i.gap)]),
    })),
  });

  const years = [...new Set(ranked.flatMap((key) => performance.rankings[key].history.map((h) => h.year)))].sort();
  sections.push({
    id: "trend",
    title: "3. Rank over the years",
    intro: "Rankings change their methods from time to time, so large jumps should be read with care.",
    tables: [{
      caption: "Rank by edition",
      head: ["Year", ...ranked.map((key) => RANKING_STYLE[key].label)],
      body: years.map((year) => [year, ...ranked.map((key) => {
        const point = performance.rankings[key].history.find((h) => h.year === year);
        return point?.rank ? `#${point.rank}` : "-";
      })]),
    }],
  });

  if (profile) {
    sections.push({
      id: "profile",
      title: "4. Institutional profile (attributes)",
      intro: `Practical information for students, compared with ${profile.group_label}. Kept separate from the ranking scores.`,
      findings: [
        { title: "Affordability", text: `${show(profile.summaries.affordability, "/100")} - fees and living cost` },
        { title: "Accessibility", text: `${show(profile.summaries.accessibility, "/100")} - acceptance rate and CGPA needed` },
        { title: "Student support", text: `${profile.summaries.support} of ${profile.support_total} - scholarships, internships, part-time work` },
      ],
      tables: [{
        caption: "Attributes and data status",
        head: ["Attribute", "Value", "Data status"],
        body: profile.attributes.map((a) => [a.key, a.value ?? "-", STATUS_STYLE[a.status]?.[0] || a.status || "-"]),
      }],
    });
  }

  if (demand && demand.interested >= demand.min_group) {
    const pct = (n) => `${Math.round((n / demand.interested) * 100)}%`;
    sections.push({
      id: "demand",
      title: "5. Student demand",
      intro: `Totals from ${demand.total} UniMatch student profiles; ${demand.interested} are interested in ${profile?.region || "your region"}. No individual data is shown.`,
      findings: [
        { title: "Students you fit", text: pct(demand.fits_all) },
        { title: "Ruled out by fee", text: pct(demand.fee_blocked) },
        { title: "Ruled out by CGPA", text: pct(demand.cgpa_blocked) },
        { title: "Ruled out by living cost", text: pct(demand.living_blocked) },
      ],
    });
  }

  sections.push({
    id: "recommendations",
    title: `${sections.length + 1}. Recommendations`,
    intro: "Rule-based suggestions with their evidence; they are not predictions.",
    tables: [{ caption: "Recommendations", head: ["Priority", "From", "Recommendation", "Evidence"], body: recommendations.map((r) => [r.priority, r.source, r.text, r.evidence]) }],
  });

  sections.push({
    id: "method",
    title: `${sections.length + 1}. Method notes`,
    paragraphs: [
      "Ranking scores are used exactly as published; a missing score is shown as N/A and never filled in.",
      "Peers are universities ranked within the stated number of places in the same edition; gaps are your score minus the peers' median.",
      "Attribute values carry their data status: sourced, estimate (median of similar universities), no source or missing.",
      "Rankings and attributes are never combined into one score.",
    ],
  });

  return {
    title: "UniMatch Institutional Report",
    subtitle: `${institution.name}${institution.country ? `, ${institution.country}` : ""}`,
    meta: "QS, THE and ARWU with the UniMatch attributes dataset",
    footer: `UniMatch Institutional Report · ${institution.name}`,
    fileName: `institutional-report-${institution.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    generatedAt: new Date().toISOString(),
    sections,
  };
}
