// src/components/RankJourneyChart.js
//
// Rank of a university (or a country's best university) over the years in
// QS, THE and ARWU, one line each. Higher on the chart is a better rank.
// Drawn with plain Views (no chart library). Shared by University Journey,
// the university page, administrator Performance and policymaker Country.
// datasets: { qs: [{ year, rank }], the: [...], arwu: [...] }

import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';

import { researcherStyles as styles } from '../styles/researcherStyles';
import { authTheme } from '../styles/authTheme';

export const DATASET_ORDER = ['qs', 'the', 'arwu'];
export const DATASET_STYLE = {
  qs: { label: 'QS', color: '#008C8C' },
  the: { label: 'THE', color: '#55B947' },
  arwu: { label: 'ARWU', color: '#F59E0B' },
};

const CHART_HEIGHT = 230;
const PAD_LEFT = 44;
const PAD_RIGHT = 18;
const PAD_TOP = 22;
const PAD_BOTTOM = 30;

export function useChartGeometry(datasets, width) {
  return useMemo(() => {
    if (!datasets || !width) return null;

    const allYears = new Set();
    const allRanks = [];

    Object.values(datasets).forEach((points) => {
      (points || []).forEach((point) => {
        if (point.rank === null || point.rank === undefined) return;
        allYears.add(point.year);
        allRanks.push(point.rank);
      });
    });

    if (!allYears.size || !allRanks.length) return null;

    const years = Array.from(allYears).sort((a, b) => a - b);
    const minRank = Math.min(...allRanks);
    const maxRank = Math.max(...allRanks);
    const rankPad = Math.max(1, Math.round((maxRank - minRank) * 0.2));
    const rankTop = Math.max(1, minRank - rankPad);
    const rankBottom = maxRank + rankPad;

    const plotWidth = width - PAD_LEFT - PAD_RIGHT;
    const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

    const xForYear = (year) =>
      years.length === 1 ? PAD_LEFT + plotWidth / 2 : PAD_LEFT + (years.indexOf(year) / (years.length - 1)) * plotWidth;
    const yForRank = (rank) => PAD_TOP + ((rank - rankTop) / (rankBottom - rankTop || 1)) * plotHeight;

    // Space between two editions; when it is tight, label fewer years and
    // only the first and last point of each line so labels never overlap.
    const step = years.length > 1 ? plotWidth / (years.length - 1) : plotWidth;
    const labelEvery = Math.max(1, Math.ceil(38 / step));
    const yearLabels = years.filter(
      (year, index) =>
        index === years.length - 1 || (index % labelEvery === 0 && years.length - 1 - index >= labelEvery)
    );
    const labelAllPoints = step >= 44;

    return { years, yearLabels, labelAllPoints, rankTop, rankBottom, xForYear, yForRank, plotHeight, width };
  }, [datasets, width]);
}

function Segment({ x1, y1, x2, y2, color }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  return (
    <View
      style={{
        position: 'absolute',
        left: (x1 + x2) / 2 - length / 2,
        top: (y1 + y2) / 2 - 1.25,
        width: length,
        height: 2.5,
        backgroundColor: color,
        transform: [{ rotate: `${angle}rad` }],
      }}
    />
  );
}

export function JourneyChart({ journey, geometry }) {
  const { yearLabels, labelAllPoints, rankTop, rankBottom, xForYear, yForRank, plotHeight, width } = geometry;
  const gridValues = Array.from({ length: 5 }, (_, index) =>
    Math.round(rankTop + ((rankBottom - rankTop) * index) / 4)
  );

  return (
    <View style={{ width, height: CHART_HEIGHT }}>
      {gridValues.map((value, index) => (
        <View key={`${value}-${index}`} style={{ position: 'absolute', left: 0, right: 0, top: yForRank(value) - 7 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ width: PAD_LEFT - 6, textAlign: 'right', fontSize: 9.5, fontWeight: '700', color: '#64748B' }}>
              #{value}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0', marginLeft: 6, marginRight: PAD_RIGHT }} />
          </View>
        </View>
      ))}

      {yearLabels.map((year) => (
        <Text
          key={year}
          style={{
            position: 'absolute',
            top: PAD_TOP + plotHeight + 10,
            left: xForYear(year) - 20,
            width: 40,
            textAlign: 'center',
            fontSize: 10.5,
            fontWeight: '800',
            color: authTheme.colors.gray900,
          }}
        >
          {year}
        </Text>
      ))}

      {DATASET_ORDER.map((key) => {
        const points = (journey.datasets[key] || []).filter((point) => point.rank !== null && point.rank !== undefined);
        if (!points.length) return null;
        const color = DATASET_STYLE[key].color;

        return (
          <React.Fragment key={key}>
            {points.slice(1).map((point, index) => (
              <Segment
                key={`${key}-line-${point.year}`}
                x1={xForYear(points[index].year)}
                y1={yForRank(points[index].rank)}
                x2={xForYear(point.year)}
                y2={yForRank(point.rank)}
                color={color}
              />
            ))}
            {points.map((point, index) => (
              <React.Fragment key={`${key}-${point.year}`}>
                <View
                  style={{
                    position: 'absolute',
                    left: xForYear(point.year) - 5,
                    top: yForRank(point.rank) - 5,
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    borderWidth: 2.5,
                    borderColor: color,
                    backgroundColor: '#FFFFFF',
                  }}
                />
                {(labelAllPoints || index === 0 || index === points.length - 1) && <Text
                  style={{
                    position: 'absolute',
                    // First/last labels sit inside the plot so they never cover the axis.
                    left: xForYear(point.year) - (labelAllPoints ? 22 : index === 0 ? 4 : 40),
                    top: yForRank(point.rank) - 20,
                    width: 44,
                    textAlign: labelAllPoints ? 'center' : index === 0 ? 'left' : 'right',
                    fontSize: 9.5,
                    fontWeight: '900',
                    color,
                  }}
                >
                  #{point.rank}
                </Text>}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export function Legend() {
  return (
    <View style={{ flexDirection: 'row', gap: 14, marginBottom: 8 }}>
      {DATASET_ORDER.map((key) => (
        <View key={key} style={styles.rowTop}>
          <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: DATASET_STYLE[key].color, marginRight: 5 }} />
          <Text style={[styles.kvValue, { marginTop: 0 }]}>{DATASET_STYLE[key].label}</Text>
        </View>
      ))}
    </View>
  );
}


export default function RankJourneyChart({ datasets, emptyText = 'No ranked editions found.' }) {
  const [width, setWidth] = useState(0);
  const geometry = useChartGeometry(datasets, width);
  const journey = useMemo(() => ({ datasets: datasets || {} }), [datasets]);

  return (
    <View>
      <Legend />
      <View
        style={{ borderRadius: 16, borderWidth: 1, borderColor: authTheme.colors.brandBorder, backgroundColor: '#FFFFFF', paddingVertical: 6 }}
        onLayout={(event) => setWidth(Math.floor(event.nativeEvent.layout.width))}
      >
        {geometry ? (
          <JourneyChart journey={journey} geometry={geometry} />
        ) : width ? (
          <Text style={[styles.mutedText, { padding: 20, textAlign: 'center' }]}>{emptyText}</Text>
        ) : null}
      </View>
    </View>
  );
}
