// src/components/policymaker/PolicyUI.js
//
// Small helpers shared by the Policymaker screens:
//   CountryGate      - spinner while the saved country loads, ChooseFirst when none.
//   isOwnCountryRow  - does a region_countries row belong to the policymaker's country
//                      (rankings spell countries differently: "China" vs "China (Mainland)").
//   accessTableRows  - Access & affordability rows (ACCESS_ROWS + scholarship / public share).
//   RankingDot       - small coloured dot + "QS 2027" label.

import React from 'react';
import { View } from 'react-native';

import { Text } from '../AppText';
import { Card, LoadingBlock } from '../researcher/ResearcherUI';
import { ChooseFirst } from '../app/RoleUI';
import { ACCESS_ROWS, formatValue } from '../../constants/roleConstants';
import { researcherStyles as styles } from '../../styles/researcherStyles';

export function CountryGate({ country, children }) {
  if (country === undefined) {
    return (
      <Card>
        <LoadingBlock />
      </Card>
    );
  }
  if (country === null) return <ChooseFirst what="country" />;
  return children;
}

export function isOwnCountryRow(row, country) {
  if (!row || !country) return false;
  const mine = country.toLowerCase();
  const name = String(row.name || '').toLowerCase();
  const key = String(row.country || '').toLowerCase();
  return (
    name === mine ||
    name.startsWith(mine) ||
    key === mine ||
    (key.length >= 4 && mine.startsWith(key))
  );
}

// columns: one { medians, scholarship_share, public_share } object per table column.
export function accessTableRows(columns) {
  return [
    ...ACCESS_ROWS.map(([label, unit]) => [label, ...columns.map((c) => formatValue(c?.medians?.[label], unit))]),
    ['Offering scholarships', ...columns.map((c) => formatValue(c?.scholarship_share, '%'))],
    ['Public universities', ...columns.map((c) => formatValue(c?.public_share, '%'))],
  ];
}

export function RankingDot({ color, label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 6 }} />
      <Text style={[styles.findingTitle, { marginBottom: 0 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
