// Ported from the web app (administrator/recommendations.js) unchanged apart from imports.
import { officialMetricLabel } from "../constants/researcherConstants";
import { RANKING_STYLE } from "../constants/roleConstants";

const share = (part, total) => (total ? Math.round((part / total) * 100) : 0);

// Rule-based improvement suggestions. Each one says where it comes from
// (ranking, attributes or student demand), its evidence and its priority.
export function buildRecommendations({ performance, profile, demand }) {
  const list = [];
  const add = (priority, source, text, evidence) => list.push({ priority, source, text, evidence });

  Object.entries(performance?.rankings || {}).forEach(([key, perf]) => {
    if (!perf) return;
    const label = RANKING_STYLE[key].label;
    const worst = perf.weaknesses[0];
    if (worst && worst.gap <= -10) {
      add(worst.gap <= -20 ? "High" : "Medium", "Ranking", `Strengthen ${officialMetricLabel(key, worst.key)} (${label}).`,
        `${Math.abs(worst.gap)} points below the median of universities ranked near you.`);
    }
    if (perf.previous_rank && perf.rank - perf.previous_rank >= 20) {
      add("High", "Ranking", `Find out why the ${label} rank fell.`, `Down ${perf.rank - perf.previous_rank} places since ${perf.previous_year}.`);
    }
  });

  if (profile) {
    const { affordability, accessibility, support } = profile.summaries;
    if (affordability !== null && affordability < 40) {
      add("Medium", "Attributes", "Review fees or offer more scholarships.", `Fees and living cost are higher than at ${100 - affordability}% of ${profile.group_label}.`);
    }
    if (accessibility !== null && accessibility < 30) {
      add("Low", "Attributes", "Explain admission requirements clearly, or review the minimum CGPA.", `Admission is harder than at ${100 - accessibility}% of ${profile.group_label}.`);
    }
    if (support < profile.support_total) {
      add("Medium", "Attributes", "Offer or publicise scholarships, internships and part-time work.", `${support} of ${profile.support_total} kinds of student support listed.`);
    }
    const unsourced = profile.attributes.filter((a) => a.status !== "sourced").length;
    if (unsourced >= 5) {
      add("Medium", "Attributes", "Publish official figures for fees, admission and outcomes on your website.", `${unsourced} attributes are estimates, unsourced or missing.`);
    }
  }

  if (demand?.interested >= demand?.min_group) {
    const blockers = [
      ["fee_blocked", "Your international fee is above many interested students' budgets; consider scholarships or instalments."],
      ["cgpa_blocked", "Many interested students fall below your minimum CGPA; consider foundation or pathway routes."],
      ["living_blocked", "Living cost is above many interested students' limit; promote affordable housing."],
    ];
    blockers.forEach(([field, text]) => {
      const pct = share(demand[field], demand.interested);
      if (pct >= 30) add(pct >= 50 ? "High" : "Medium", "Student demand", text, `${pct}% of ${demand.interested} interested UniMatch students are ruled out.`);
    });
  }

  const order = { High: 0, Medium: 1, Low: 2 };
  return list.sort((a, b) => order[a.priority] - order[b.priority]);
}
