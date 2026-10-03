// src/utils/researchInsights.js
//
// Ported from the web app (frontend-updated/src/utils/researchInsights.js).
// Only VERDICTS changed: Tailwind classes became React Native colours.

// Plain-English findings shared by the researcher pages and the research
// report, so the same analysis is always described in the same words.

// ---- Statistical summary ----

// Above this share of missing values an indicator is flagged, because its
// mean/median then describe only part of the universities.
export const HIGH_MISSING_PCT = 20;

// Mean minus median as a share of the min-max range. Beyond this the gap is
// large enough to call the indicator "top-heavy" (or "bottom-heavy").
const SKEW_THRESHOLD = 0.05;

function skewOf(row) {
  if (row.mean == null || row.median == null || row.max == null || row.min == null) return 0;
  const range = row.max - row.min;
  return range > 0 ? (row.mean - row.median) / range : 0;
}

// One or two plain-English sentences describing what an indicator's numbers mean.
export function interpretRow(row) {
  if (!row.available) {
    return { tone: "muted", text: "No scores were published for this indicator, so nothing can be calculated." };
  }

  const sentences = [];
  let tone = "normal";

  if ((row.missing_pct ?? 0) > HIGH_MISSING_PCT) {
    tone = "warning";
    sentences.push(
      `${row.missing_pct}% of universities have no score here, so these numbers describe only the ${row.available} that do.`
    );
  }

  const skew = skewOf(row);
  if (row.median === row.min) {
    sentences.push(
      `At least half of the universities have the lowest score (${row.min}). Only a small group scores higher.`
    );
  } else if (skew > SKEW_THRESHOLD) {
    sentences.push(
      `Most universities score low (half are below ${row.median}), while a few top universities pull the average up to ${row.mean}.`
    );
  } else if (skew < -SKEW_THRESHOLD) {
    sentences.push(
      `Most universities score high (half are above ${row.median}); a few low scores pull the average down to ${row.mean}.`
    );
  } else {
    sentences.push(`Scores are spread fairly evenly; a typical university scores around ${row.median}.`);
  }

  return { tone, text: sentences.join(" ") };
}

// The few most useful observations for the selected dataset, in plain words.
export function buildSummaryFindings(rows, totalUniversities) {
  const findings = [];
  const indicatorRows = rows.filter((row) => !row.isOverall);
  const scored = indicatorRows.filter((row) => row.available > 0);
  const overall = rows.find((row) => row.isOverall);

  if (overall && overall.missing > 0) {
    findings.push({
      tone: "warning",
      title: "Overall score is often not exact",
      text: overall.available
        ? `Only ${overall.available} of ${totalUniversities} universities have an exact overall score. For the rest it is missing or published only as a range, so compare them by rank or by the indicators below.`
        : `None of these ${totalUniversities} universities has an exact overall score. Compare them by rank or by the indicators below.`,
    });
  }

  const mostMissing = [...indicatorRows].sort((a, b) => (b.missing_pct ?? 0) - (a.missing_pct ?? 0))[0];
  if (mostMissing && mostMissing.missing > 0) {
    findings.push({
      tone: mostMissing.missing_pct > HIGH_MISSING_PCT ? "warning" : "normal",
      title: "Indicator with the most gaps",
      text: `${mostMissing.label} has no score for ${mostMissing.missing} of ${totalUniversities} universities (${mostMissing.missing_pct}%). Be careful when giving it a high weight.`,
    });
  } else if (indicatorRows.length) {
    findings.push({
      tone: "good",
      title: "Complete indicator data",
      text: "Every indicator has a score for every university in this selection.",
    });
  }

  const mostTopHeavy = [...scored].sort((a, b) => skewOf(b) - skewOf(a))[0];
  if (mostTopHeavy && skewOf(mostTopHeavy) > SKEW_THRESHOLD) {
    const leader = mostTopHeavy.max_university ? ` (led by ${mostTopHeavy.max_university})` : "";
    findings.push({
      tone: "normal",
      title: "Biggest gap between the top and the rest",
      text:
        mostTopHeavy.median === mostTopHeavy.min
          ? `In ${mostTopHeavy.label}, at least half of the universities have the lowest score (${mostTopHeavy.min}). Only a small group${leader} scores higher, which lifts the average to ${mostTopHeavy.mean}.`
          : `In ${mostTopHeavy.label}, half of the universities score below ${mostTopHeavy.median}, but the average is ${mostTopHeavy.mean} because a few universities${leader} score far higher.`,
    });
  }

  const mostEven = [...scored].sort((a, b) => Math.abs(skewOf(a)) - Math.abs(skewOf(b)))[0];
  if (mostEven && mostEven !== mostTopHeavy && Math.abs(skewOf(mostEven)) <= SKEW_THRESHOLD) {
    findings.push({
      tone: "normal",
      title: "Most evenly spread",
      text: `In ${mostEven.label} the average (${mostEven.mean}) is almost the same as the middle value (${mostEven.median}): no small group dominates, scores are spread evenly.`,
    });
  }

  // Up to three cards fit one row; keep the most important ones (order above).
  return findings.slice(0, 3);
}

// ---- Indicator relationships (correlation) ----

// Two indicators linked at least this strongly measure almost the same thing.
export const OVERLAP_THRESHOLD = 0.8;

export function strengthOf(value) {
  const size = Math.abs(value);
  if (size >= 0.7) return "Strong";
  if (size >= 0.4) return "Moderate";
  if (size >= 0.2) return "Weak";
  return "No real";
}

const HOW_OFTEN = { Strong: "very often", Moderate: "usually", Weak: "slightly more often" };

// Plain-English meaning of one cell. `withOverall` = one side is the overall
// score, which is a result of the indicators rather than something weighted.
export function describePair(labelA, labelB, value, pairs, withOverall = false) {
  if (value == null) {
    return `Too few universities have both scores (${pairs}) to say anything reliable.`;
  }

  const strength = strengthOf(value);
  let meaning;
  if (strength === "No real") {
    meaning = `Knowing a university's ${labelA} tells you almost nothing about its ${labelB}. The two scores move independently.`;
  } else if (value > 0) {
    meaning = `Universities with a high ${labelA} ${HOW_OFTEN[strength]} also have a high ${labelB}.`;
  } else {
    meaning = `Universities with a high ${labelA} ${HOW_OFTEN[strength]} have a LOW ${labelB} — the two scores move in opposite directions.`;
  }

  let overlap = "";
  if (value >= OVERLAP_THRESHOLD) {
    overlap = withOverall
      ? " This indicator has a big influence on where a university ends up in the ranking."
      : " They measure almost the same thing, so giving both a high weight counts the same strength twice.";
  }

  return `${meaning}${overlap} Based on ${pairs} universities that have both scores.`;
}

export function buildCorrelationFindings(cells, overallKey) {
  const findings = [];
  const indicatorCells = cells.filter((cell) => cell.value != null && cell.a !== overallKey && cell.b !== overallKey);
  if (!indicatorCells.length) return findings;

  const strongest = [...indicatorCells].sort((x, y) => y.value - x.value)[0];
  findings.push({
    tone: strongest.value >= OVERLAP_THRESHOLD ? "warning" : "normal",
    title: "Most closely linked",
    text:
      strongest.value >= OVERLAP_THRESHOLD
        ? `${strongest.labelA} and ${strongest.labelB} (${strongest.value}) rise and fall together so closely that they measure almost the same thing. Be careful giving both a high weight.`
        : `${strongest.labelA} and ${strongest.labelB} (${strongest.value}) move together the most: high in one usually means high in the other.`,
  });

  if (overallKey) {
    const drivers = cells
      .filter((cell) => cell.value != null && (cell.a === overallKey) !== (cell.b === overallKey))
      .map((cell) => ({ ...cell, indicator: cell.a === overallKey ? cell.labelB : cell.labelA }))
      .sort((x, y) => y.value - x.value);
    if (drivers.length) {
      findings.push({
        tone: "normal",
        title: "What drives the overall score",
        text: `${drivers[0].indicator} is linked most closely with the overall score (${drivers[0].value}), so universities strong in it tend to be ranked high. ${drivers[drivers.length - 1].indicator} matters least (${drivers[drivers.length - 1].value}).`,
      });
    }
  }

  const opposite = [...indicatorCells].sort((x, y) => x.value - y.value)[0];
  const independent = [...indicatorCells].sort((x, y) => Math.abs(x.value) - Math.abs(y.value))[0];
  if (opposite.value <= -0.2) {
    findings.push({
      tone: "normal",
      title: "Moves in opposite directions",
      text: `${opposite.labelA} and ${opposite.labelB} (${opposite.value}): universities high in one tend to be low in the other.`,
    });
  } else {
    findings.push({
      tone: "normal",
      title: "Least connected",
      text:
        Math.abs(independent.value) < 0.2
          ? `${independent.labelA} and ${independent.labelB} (${independent.value}) are almost unrelated, so each one adds information the other does not.`
          : `${independent.labelA} and ${independent.labelB} (${independent.value}) have the weakest link here. Even so, all indicators in this dataset are at least ${strengthOf(independent.value).toLowerCase()}ly linked.`,
    });
  }

  return findings.slice(0, 3);
}

// ---- Rank stability ----

export const VERDICTS = {
  very_stable: {
    label: 'Very stable',
    colors: { border: '#A7F3D0', background: '#ECFDF5', text: '#047857' },
    meaning: 'Rank barely changes. You can trust this position.',
  },
  stable: {
    label: 'Stable',
    colors: { border: '#99F6E4', background: '#F0FDFA', text: '#0F766E' },
    meaning: 'Moves a few places, but stays in the same area.',
  },
  sensitive: {
    label: 'Sensitive',
    colors: { border: '#FDE68A', background: '#FFFBEB', text: '#B45309' },
    meaning: 'Position depends noticeably on the exact weights.',
  },
  very_sensitive: {
    label: 'Very sensitive',
    colors: { border: '#FECACA', background: '#FEF2F2', text: '#B91C1C' },
    meaning: 'Position jumps a lot. Do not rely on this exact rank.',
  },
};

export function describeRow(row, runs) {
  const up = row.rank - row.range_low;
  const down = row.range_high - row.rank;
  if (up === 0 && down === 0) {
    return `Stayed at #${row.rank} in almost every test (${row.same_rank_pct}% of ${runs}).`;
  }
  return `In 90% of the tests it ranked between #${row.range_low} and #${row.range_high}${
    up ? ` (up to ${up} place${up === 1 ? "" : "s"} higher` : " ("
  }${up && down ? ", " : ""}${down ? `up to ${down} place${down === 1 ? "" : "s"} lower` : ""}).`;
}

// Plain-English findings of a rank stability test.
export function buildStabilityFindings(stability, labelFor) {
  if (!stability) return [];
  const rows = stability.results;
  const counts = stability.verdict_counts;
  const steady = counts.very_stable + counts.stable;
  const list = [
    {
      tone: steady >= rows.length * 0.7 ? "good" : "warning",
      title: "Overall",
      text: `${steady} of the top ${rows.length} universities keep a stable rank when the weights change a little. ${
        counts.sensitive + counts.very_sensitive
      } depend noticeably on the exact weights.`,
    },
  ];

  const mostMoving = [...rows].sort((a, b) => b.range_high - b.range_low - (a.range_high - a.range_low))[0];
  if (mostMoving && mostMoving.range_high > mostMoving.range_low) {
    list.push({
      tone: "normal",
      title: "Moves the most",
      text: `${mostMoving.name} is #${mostMoving.rank} with your weights, but could be anywhere from #${mostMoving.range_low} to #${mostMoving.range_high}.`,
    });
  }

  const topImpact = stability.indicator_impact[0];
  if (topImpact) {
    list.push({
      tone: "normal",
      title: "Most influential weight",
      text: `Changing the weight of ${labelFor(topImpact.key)} moves universities the most (on average ${topImpact.average_shift} places). Choose this weight carefully.`,
    });
  }
  return list;
}
