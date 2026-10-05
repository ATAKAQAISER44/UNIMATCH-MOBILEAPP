// src/components/student/PlanWidgets.js
//
// Admission chance and total cost of one university for the signed-in
// student (web: student/PlanWidgets.jsx). Data comes from POST /student/plan
// through useStudentPlan (services/backendData.js).
//   ChanceBadge - Safe / Match / Reach / Unknown pill.
//   PlanDetails - chance, cost table, budget checks, tests and links.

import React from 'react';
import { Linking, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../AppText';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { pkrRange, usdRange } from '../../services/backendData';

export const CHANCE_ORDER = ['Reach', 'Match', 'Safe', 'Unknown'];

export const CHANCE_STYLE = {
  Safe: { color: '#047857', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  Match: { color: '#B45309', backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  Reach: { color: '#B91C1C', backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  Unknown: { color: '#475569', backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
};

export function ChanceBadge({ chance = 'Unknown' }) {
  const tone = CHANCE_STYLE[chance] || CHANCE_STYLE.Unknown;
  return (
    <View style={[styles.pill, { borderColor: tone.borderColor, backgroundColor: tone.backgroundColor }]}>
      <Text style={[styles.pillText, { color: tone.color }]}>{chance}</Text>
    </View>
  );
}

const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : '–');

function Row({ label, value, tone }) {
  return (
    <View style={[styles.rowBetween, { paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#E8F3EE', alignItems: 'flex-start' }]}>
      <Text style={[styles.kvLabel, { flex: 1, marginRight: 10, fontSize: 11 }]}>{label}</Text>
      <Text style={[styles.kvValue, { flex: 1.2, marginTop: 0, textAlign: 'right' }, tone && { color: tone }]}>{value}</Text>
    </View>
  );
}

function LinkButton({ label, url }) {
  if (!url) return null;
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(url).catch(() => {})}
      style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14, paddingVertical: 6 }}
      accessibilityRole="link"
    >
      <Ionicons name="open-outline" size={14} color={authTheme.colors.brandTeal} />
      <Text style={[styles.expandText, { marginTop: 0, marginLeft: 4 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function PlanDetails({ plan, pkrPerUsd }) {
  if (!plan) return null;
  if (!plan.available) {
    return <Text style={styles.mutedText}>No fee or admission data for this university yet.</Text>;
  }

  const estimated = Object.values(plan.data_status || {}).some((status) => status !== 'sourced');
  const testsNote = plan.tests_ok === false ? ' · you have none yet' : plan.tests_ok === true ? ' · you have one' : '';
  const budgetTone = (value) => (value === true ? '#047857' : value === false ? '#B91C1C' : undefined);

  return (
    <View>
      <View style={[styles.rowTop, { flexWrap: 'wrap', gap: 8 }]}>
        <ChanceBadge chance={plan.chance} />
        <Text style={[styles.bodyText, styles.flex1, { fontSize: 12.5 }]}>{plan.chance_reason}</Text>
      </View>
      <Text style={[styles.mutedText, { marginTop: 6, marginBottom: 6 }]}>
        Your CGPA {plan.your_gpa ?? '–'} / 4.0 · minimum {plan.min_cgpa ?? 'not published'} · acceptance{' '}
        {plan.acceptance_rate !== null && plan.acceptance_rate !== undefined ? `${plan.acceptance_rate}%` : 'not published'}
      </Text>

      <Row label={`Tuition per year (${plan.fee_type})`} value={usdRange(plan.yearly_fee)} />
      <Row label="Living cost per year" value={usdRange(plan.yearly_living)} />
      <Row
        label={`Total for ${plan.years} years`}
        value={`${usdRange(plan.total_cost)}${plan.total_cost && pkrPerUsd ? `\n${pkrRange(plan.total_cost, pkrPerUsd)}` : ''}`}
      />
      <Row label="Fee within your budget" value={yesNo(plan.fee_within_budget)} tone={budgetTone(plan.fee_within_budget)} />
      <Row label="Living cost within your limit" value={yesNo(plan.living_within_limit)} tone={budgetTone(plan.living_within_limit)} />
      <Row label="Tests asked (any one)" value={`${plan.tests_required || '–'}${plan.tests_required ? testsNote : ''}`} />
      <Row label="Scholarships" value={plan.scholarship || '–'} />

      {estimated && (
        <View style={[styles.warningBox, { marginTop: 8, marginBottom: 0 }]}>
          <Text style={styles.warningText}>Some figures are estimates. Check the university website before deciding.</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
        <LinkButton label="Official website" url={plan.website} />
        <LinkButton label="Scholarships page" url={plan.scholarship_link} />
      </View>
    </View>
  );
}
