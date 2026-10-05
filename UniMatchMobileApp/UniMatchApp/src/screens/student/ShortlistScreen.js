// src/screens/student/ShortlistScreen.js
//
// My application shortlist (web: student/StudentShortlist.jsx). The saved
// universities sorted into Reach / Match / Safe by the student's admission
// chance, with the total cost of the degree at each (POST /student/plan via
// useStudentPlan), balance advice and the shortlist report (PDF / CSV).

import React, { useMemo, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppLayout from '../../components/app/AppLayout';
import { ButtonRow } from '../../components/app/RoleUI';
import ReportDocument from '../../components/ReportDocument';
import { Text } from '../../components/AppText';
import {
  Card,
  CollapsibleCard,
  ErrorBox,
  GradientButton,
  LoadingBlock,
  PageHeader,
} from '../../components/researcher/ResearcherUI';
import { CHANCE_ORDER, ChanceBadge, PlanDetails } from '../../components/student/PlanWidgets';
import { EmptyCard, savedEntries } from '../../components/student/StudentUI';
import { useSavedUniversities } from '../../services/savedUniversities';
import { pkrRange, usdRange, useStudentPlan } from '../../services/backendData';
import { shareReportCsv, shareReportPdf } from '../../utils/researchReport';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';

// A balanced application list: a few ambitious choices, most realistic, some sure.
const BALANCE = { Reach: 2, Match: 3, Safe: 2 };
const RATED = CHANCE_ORDER.slice(0, 3);

function balanceAdvice(counts) {
  const advice = [];
  if (!counts.Safe) advice.push(`Add at least ${BALANCE.Safe} Safe universities so you are sure of an offer.`);
  if ((counts.Reach || 0) > BALANCE.Reach + 2) advice.push('Many Reach choices: some may not reply with an offer, so keep enough Match options.');
  if (!counts.Match) advice.push(`Add about ${BALANCE.Match} Match universities: they are your most realistic options.`);
  return advice;
}

function buildShortlistReport(plan, counts) {
  const ok = plan.universities.filter((u) => u.available);
  return {
    title: 'UniMatch Application Shortlist',
    subtitle: `${plan.degree} · ${ok.length} universities · your CGPA ${plan.gpa ?? '-'} / 4.0`,
    meta: 'Admission chances and total cost from the UniMatch attributes dataset',
    footer: 'UniMatch Application Shortlist',
    fileName: 'application-shortlist',
    generatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'summary',
        title: '1. Your list at a glance',
        findings: RATED.map((c) => ({ title: c, text: `${counts[c] || 0} universities (suggested about ${BALANCE[c]})` })),
        paragraphs: balanceAdvice(counts),
      },
      {
        id: 'list',
        title: '2. Universities, chances and cost',
        tables: [
          {
            caption: `Total cost for ${plan.years} years (tuition + living cost)`,
            head: ['University', 'Country', 'Chance', 'Total (USD)', 'Total (PKR)', 'Fee in budget', 'Tests (any one)'],
            body: ok.map((u) => [
              u.name,
              u.country,
              u.chance,
              usdRange(u.total_cost),
              pkrRange(u.total_cost, plan.pkr_per_usd),
              u.fee_within_budget == null ? '-' : u.fee_within_budget ? 'Yes' : 'No',
              u.tests_required || '-',
            ]),
          },
        ],
      },
      {
        id: 'checklist',
        title: '3. Checklist',
        paragraphs: ok.map(
          (u) =>
            `${u.name}: ${u.tests_ok === false ? `take one of ${u.tests_required}; ` : ''}check fees on ${u.website || 'the official website'}${
              u.scholarship_link ? `; scholarships: ${u.scholarship_link}` : ''
            }.`
        ),
      },
      {
        id: 'method',
        title: '4. How chances and cost are worked out',
        paragraphs: [
          `Safe: your CGPA is at least ${plan.rules.safe_margin} above the minimum and at least ${plan.rules.safe_acceptance}% of applicants are admitted.`,
          `Reach: your CGPA is below the minimum, or fewer than ${plan.rules.reach_acceptance}% of applicants are admitted. Everything in between is Match.`,
          'Cost uses the local fee in your own country and the international fee elsewhere, plus yearly living cost, times the years of your degree.',
          'Some figures are estimates (median of similar universities); check each university\'s website before applying.',
        ],
      },
    ],
  };
}

const rowKey = (u) => `${u.name}|${u.country}`;

function ChanceTile({ chance, count }) {
  return (
    <View style={[styles.statCard, { flexBasis: 90, alignItems: 'flex-start' }]}>
      <ChanceBadge chance={chance} />
      <Text style={[styles.statValue, { fontSize: 22, lineHeight: 27, color: authTheme.colors.gray900, marginTop: 4 }]}>{count}</Text>
      <Text style={styles.statHint} numberOfLines={2}>
        suggested about {BALANCE[chance]}
      </Text>
    </View>
  );
}

function PlanRow({ plan, years, pkrPerUsd, open, onToggle, last }) {
  return (
    <View style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: '#E8F3EE', paddingVertical: 9 }}>
      <TouchableOpacity activeOpacity={0.8} onPress={onToggle} style={[styles.rowTop, { minHeight: 36 }]} accessibilityRole="button">
        <View style={styles.flex1}>
          <Text style={styles.rowName} numberOfLines={2}>
            {plan.name}
          </Text>
          {!!plan.country && <Text style={styles.rowSub}>{plan.country}</Text>}
          <Text style={[styles.kvValue, { marginTop: 3, color: plan.available ? authTheme.colors.gray900 : authTheme.colors.brandMuted }]}>
            {plan.available ? `${usdRange(plan.total_cost)} for ${plan.years ?? years} years` : 'no data'}
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={authTheme.colors.brandTeal} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
      {open && (
        <View style={{ marginTop: 8, borderRadius: 14, backgroundColor: '#F3FBF8', padding: 10 }}>
          <PlanDetails plan={plan} pkrPerUsd={pkrPerUsd} />
        </View>
      )}
    </View>
  );
}

export default function ShortlistScreen({ navigation }) {
  const saved = useSavedUniversities();
  const list = useMemo(() => savedEntries(saved.items).map(({ name, country }) => ({ name, country })), [saved.items]);
  const { data: plan, loading, error, retry } = useStudentPlan(list);

  const [open, setOpen] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [sharing, setSharing] = useState('');

  const counts = useMemo(() => {
    const result = {};
    (plan?.universities || []).forEach((u) => {
      if (u.available) result[u.chance] = (result[u.chance] || 0) + 1;
    });
    return result;
  }, [plan]);

  const report = useMemo(() => (plan ? buildShortlistReport(plan, counts) : null), [plan, counts]);
  const advice = balanceAdvice(counts);

  const share = async (format) => {
    if (!report) return;
    setSharing(format);
    try {
      if (format === 'pdf') await shareReportPdf({ ...report, generatedAt: new Date().toISOString() });
      else await shareReportCsv({ ...report, generatedAt: new Date().toISOString() });
    } catch (err) {
      Alert.alert('Share failed', err?.message || 'The report could not be shared.');
    } finally {
      setSharing('');
    }
  };

  const goToRankings = () => navigation.navigate('Rankings', { dataset: 'qs' });

  return (
    <AppLayout navigation={navigation} activeKey="shortlist">
      <PageHeader
        eyebrow="Student"
        title="My application shortlist"
        subtitle={`Your saved universities sorted into Reach, Match and Safe by admission chance, with the total cost of each; a good list has about ${BALANCE.Reach} Reach, ${BALANCE.Match} Match and ${BALANCE.Safe} Safe.`}
        hint="Tap a university to see its chance, costs and checklist."
      />

      {!saved.loaded ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <EmptyCard
          text="You have not saved any university yet. Save some from the rankings or Smart Match first."
          buttonTitle="Explore rankings"
          onPress={goToRankings}
        />
      ) : loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : plan ? (
        <>
          <Card>
            <View style={[styles.statGrid, { marginBottom: 8 }]}>
              {RATED.map((chance) => (
                <ChanceTile key={chance} chance={chance} count={counts[chance] || 0} />
              ))}
            </View>
            {advice.map((line) => (
              <Text key={line} style={[styles.warningText, { marginBottom: 6 }]}>
                {line}
              </Text>
            ))}
            <ButtonRow style={{ marginTop: 4 }}>
              <GradientButton
                small
                title="Share PDF"
                onPress={() => share('pdf')}
                loading={sharing === 'pdf'}
                disabled={!!sharing}
                style={{ flexGrow: 1, flexBasis: 120 }}
              />
              <GradientButton
                small
                title="Share CSV"
                onPress={() => share('csv')}
                loading={sharing === 'csv'}
                disabled={!!sharing}
                style={{ flexGrow: 1, flexBasis: 120 }}
              />
            </ButtonRow>
          </Card>

          {CHANCE_ORDER.map((chance) => {
            const group = plan.universities.filter((u) => (u.available ? u.chance : 'Unknown') === chance);
            if (!group.length) return null;
            return (
              <Card key={chance}>
                <View style={[styles.rowTop, { gap: 8, marginBottom: 2 }]}>
                  <ChanceBadge chance={chance} />
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{group.length}</Text>
                </View>
                {group.map((u, index) => (
                  <PlanRow
                    key={rowKey(u)}
                    plan={u}
                    years={plan.years}
                    pkrPerUsd={plan.pkr_per_usd}
                    open={open === rowKey(u)}
                    onToggle={() => setOpen(open === rowKey(u) ? null : rowKey(u))}
                    last={index === group.length - 1}
                  />
                ))}
              </Card>
            );
          })}

          <CollapsibleCard title="Report preview" open={showReport} onToggle={() => setShowReport((value) => !value)}>
            <ReportDocument report={report} />
          </CollapsibleCard>
        </>
      ) : null}
    </AppLayout>
  );
}
