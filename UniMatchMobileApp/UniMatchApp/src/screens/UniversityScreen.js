// src/screens/UniversityScreen.js
//
// University introduction page (web: pages/UniversityIntroPage.jsx). Opens
// when a university name is tapped anywhere in the app, for every role.
//   Hero        - name, location, type, rank badge per ranking; students can
//                 Save and Compare it.
//   For you     - students only: admission chance and total cost (POST /student/plan).
//   Trend       - rank over the years in QS, THE and ARWU.
//   Details     - Overview / Rankings / Cost / Academics / Outcomes / Links.
// Data: GET /rankings/{ds}/export?search= (all attributes per ranking),
// GET /researcher/university-journey (history) and GET /researcher/attributes
// (fallback when the university is in no ranking).

import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../components/AppText';
import AppLayout from '../components/app/AppLayout';
import { Pill } from '../components/app/RoleUI';
import RankJourneyChart from '../components/RankJourneyChart';
import CompareBar from '../components/CompareBar';
import CompareModal from '../components/CompareModal';
import { PlanDetails } from '../components/student/PlanWidgets';
import { Card, ErrorBox, InlineLoader, LoadingBlock, SectionHeading } from '../components/researcher/ResearcherUI';
import { researcherStyles as styles } from '../styles/researcherStyles';
import { authTheme } from '../styles/authTheme';
import { fetchUniversityAttributes, fetchUniversityJourney } from '../services/researcherApi';
import { findUniversityInRankings, identityKey, RANKING_KEYS, searchAllRankings } from '../services/universitySearch';
import { useStudentPlan } from '../services/backendData';
import { useSavedUniversities } from '../services/savedUniversities';
import { useCompareList } from '../services/compareList';
import { useUserRole } from '../services/userRole';

const DATASETS = {
  qs: { label: 'QS', color: '#008C8C' },
  the: { label: 'THE', color: '#55B947' },
  arwu: { label: 'ARWU', color: '#F59E0B' },
};

// [label, export column (raw), attributes-endpoint key]
const SECTIONS = [
  {
    key: 'overview',
    label: 'Overview',
    about: 'Basic information from the datasets.',
    fields: [
      ['Country', 'Country', null],
      ['Region', 'Region', 'region'],
      ['Type', 'Public__Private', 'public_private'],
      ['Teaching language', 'Language', 'language'],
      ['Degree levels', 'Degree_Level_offered', 'degree_level'],
    ],
  },
  { key: 'rankings', label: 'Rankings', about: 'Latest edition of each ranking. Tap one for past years.' },
  {
    key: 'cost',
    label: 'Cost',
    about: 'Yearly tuition, living cost and scholarships.',
    fields: [
      ['Tuition (local)', 'Tuition_Fee_local', 'tuition_fee_local'],
      ['Tuition (international)', 'Tuition_Fee_international', 'tuition_fee_international'],
      ['Living cost', 'Living_Cost', 'living_cost'],
      ['Scholarship', 'Scholarship_YesNo', 'scholarship'],
    ],
  },
  {
    key: 'academics',
    label: 'Academics',
    about: 'Programmes, tests and admission.',
    fields: [
      ['Minimum CGPA', 'Minimum_CGPA_Requirement', 'cgpa_requirement'],
      ['Acceptance rate', 'Acceptance_Rate', 'acceptance_rate'],
      ['Tests', 'Standardized_Test', null],
      ['Own admission test', 'University_Acceptance_Test_YesNo', null],
      ['Programmes', 'Programmes_Offered', null, true],
    ],
  },
  {
    key: 'outcomes',
    label: 'Outcomes',
    about: 'Work options, employability and equality.',
    fields: [
      ['Internships', 'Internship_Available', 'internship'],
      ['Part-time work', 'PartTime_Job_Allowed', 'part_time_job'],
      ['Employability', 'Graduate_Employability_Rate', 'employability_rate'],
      ['Gender ratio (F : M)', 'Gender_Equality', 'gender_equality'],
    ],
  },
  {
    key: 'links',
    label: 'Links',
    about: 'Official pages for admission and funding.',
    links: [
      ['Official website', 'University_Official_Website_link'],
      ['Scholarships page', 'University_ScholarShip_webpage_link'],
    ],
  },
];

function hasValue(value) {
  if (value === null || value === undefined) return false;
  const text = String(value).trim();
  return text !== '' && !['nan', 'n/a', 'none', 'null'].includes(text.toLowerCase());
}

// Latest ranked edition and best rank for one ranking system.
export function summariseDataset(points = []) {
  const ranked = points.filter((point) => Number.isFinite(point?.rank));
  if (!ranked.length) return null;

  const latest = ranked.reduce((a, b) => (b.year > a.year ? b : a));
  const best = ranked.reduce((a, b) => (b.rank < a.rank ? b : a));
  const previous = ranked.filter((point) => point.year < latest.year).sort((a, b) => b.year - a.year)[0];

  return {
    latest,
    best,
    // Positive = moved up since the previous edition.
    change: previous ? previous.rank - latest.rank : null,
    history: [...ranked].sort((a, b) => b.year - a.year),
  };
}

function RankCard({ dataset, summary, officialRank, highlight }) {
  const [open, setOpen] = useState(false);
  const { latest, best, change, history } = summary;
  const style = DATASETS[dataset];

  return (
    <View style={[styles.rowCard, highlight && styles.rowCardActive]}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen((value) => !value)} disabled={history.length < 2}>
        <View style={styles.rowTop}>
          <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: style.color, marginRight: 8 }} />
          <Text style={[styles.rowName, styles.flex1]}>
            {style.label} {latest.year}
          </Text>
          <Text style={[styles.rowScore, { fontSize: 16 }]}>#{officialRank || latest.rank}</Text>
        </View>

        <View style={[styles.rowBetween, { marginTop: 6 }]}>
          <Text style={[styles.rowSub, styles.flex1]}>
            Best #{best.rank} ({best.year})
            {change ? `  ·  ${change > 0 ? '▲' : '▼'} ${Math.abs(change)} since last edition` : ''}
          </Text>
          {history.length > 1 && <Text style={styles.expandText}>{open ? 'Hide' : 'History'}</Text>}
        </View>
      </TouchableOpacity>

      {open &&
        history.map((point) => (
          <View key={point.year} style={[styles.rowBetween, { paddingVertical: 3 }]}>
            <Text style={styles.mutedText}>{point.year}</Text>
            <Text style={[styles.kvValue, { marginTop: 0 }]}>#{point.rank}</Text>
          </View>
        ))}
    </View>
  );
}

function HeroButton({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.outlineButton,
        styles.outlineButtonSmall,
        { flexDirection: 'row', flexGrow: 1, flexBasis: 120 },
        active && { backgroundColor: authTheme.colors.brandTeal, borderColor: authTheme.colors.brandTeal },
      ]}
    >
      <Ionicons name={icon} size={15} color={active ? '#FFFFFF' : authTheme.colors.brandTeal} />
      <Text style={[styles.outlineButtonText, { fontSize: 12, marginLeft: 6 }, active && { color: '#FFFFFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionTabs({ value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 2 }}>
      {SECTIONS.map((section) => {
        const active = section.key === value;
        return (
          <TouchableOpacity
            key={section.key}
            onPress={() => onChange(section.key)}
            activeOpacity={0.85}
            style={[
              styles.pill,
              { minHeight: 36, paddingHorizontal: 14, justifyContent: 'center', borderColor: authTheme.colors.brandBorder, backgroundColor: '#FFFFFF' },
              active && { backgroundColor: authTheme.colors.brandTeal, borderColor: authTheme.colors.brandTeal },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.pillText, { fontSize: 12, color: active ? '#FFFFFF' : authTheme.colors.brandTeal }]}>{section.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// Short generated introduction, e.g. "X is a public university in Y. It
// offers Bachelor, Master, PhD degrees, taught in English. Graduate
// employability is 91%."
export function introText(name, info) {
  const type = hasValue(info.type) ? `${String(info.type).toLowerCase()} ` : '';
  const sentences = [`${name} is a ${type}university${hasValue(info.country) ? ` in ${info.country}` : ''}.`];
  if (hasValue(info.degrees)) {
    sentences.push(`It offers ${info.degrees} degrees${hasValue(info.language) ? `, taught in ${info.language}` : ''}.`);
  } else if (hasValue(info.language)) {
    sentences.push(`Teaching is in ${info.language}.`);
  }
  if (hasValue(info.employability)) sentences.push(`Graduate employability is ${info.employability}.`);
  return sentences.join(' ');
}

// Session caches (see the loading effect below).
const pageCache = new Map();
const journeyCache = new Map();
const comparePoolCache = new Map();

// City column of an export row, when the dataset has one (web UNIVERSITY_FIELDS.city).
const CITY_COLUMNS = ['City', 'city', 'CITY', 'university_city', 'University City'];

// "Selected result" values passed in by the list that opened the page.
function SelectedResult({ officialRank, currentRank, score, scoreLabel }) {
  const items = [
    ['Official rank', hasValue(officialRank) ? `#${String(officialRank).replace(/^#/, '')}` : null],
    ['Current rank', hasValue(currentRank) ? `#${String(currentRank).replace(/^#/, '')}` : null],
    [scoreLabel || 'Score', hasValue(score) ? String(score) : null],
  ].filter(([, value]) => value);

  return (
    <Card>
      <SectionHeading title="Selected result" subtitle="Values from the list you opened this from." />
      <View style={[styles.kvGrid, { marginTop: 0 }]}>
        {items.map(([label, value]) => (
          <View key={label} style={styles.kvItem}>
            <Text style={styles.kvLabel}>{label}</Text>
            <Text style={styles.kvValue}>{value}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export default function UniversityScreen({ navigation, route }) {
  const params = route?.params || {};
  const name = params.name || 'University';
  const { key: role } = useUserRole();
  const isStudent = role === 'student';

  const [rows, setRows] = useState({});
  const [journey, setJourney] = useState(null);
  const [attributes, setAttributes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [section, setSection] = useState('overview');
  const [compareOpen, setCompareOpen] = useState(false);
  const [searchPool, setSearchPool] = useState(() => comparePoolCache.get(name) || []);

  const saved = useSavedUniversities();
  const compare = useCompareList();

  // The page shows as soon as the quick lookups (ranking rows + attributes)
  // are back; the rank history (slower) fills the chart on its own. Both are
  // remembered for the session, so reopening a university is instant.
  const pageKey = `${name}|${params.country || ''}`;
  const [journeyLoading, setJourneyLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const cached = pageCache.get(pageKey);

    async function loadPage() {
      if (cached && !reloadKey) {
        setRows(cached.rows);
        setAttributes(cached.attributes);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');

      const [rowsResult, attributeResult] = await Promise.allSettled([
        findUniversityInRankings(name, params.country),
        fetchUniversityAttributes(name, params.country),
      ]);
      if (!active) return;

      const nextRows = rowsResult.status === 'fulfilled' ? rowsResult.value : {};
      const nextAttributes = attributeResult.status === 'fulfilled' ? attributeResult.value : null;
      setRows(nextRows);
      setAttributes(nextAttributes);

      // "Not found" just means the university is in no ranking.
      const message = rowsResult.status === 'rejected' ? rowsResult.reason?.message || '' : '';
      if (!Object.keys(nextRows).length && !nextAttributes && message && !/not found/i.test(message)) {
        setError(message);
      } else {
        pageCache.set(pageKey, { rows: nextRows, attributes: nextAttributes });
      }
      setLoading(false);
    }

    async function loadJourney() {
      if (journeyCache.has(name) && !reloadKey) {
        setJourney(journeyCache.get(name));
        return;
      }
      setJourney(null);
      setJourneyLoading(true);
      try {
        const data = await fetchUniversityJourney(name);
        journeyCache.set(name, data);
        if (active) setJourney(data);
      } catch {
        if (active) setJourney(null);
      } finally {
        if (active) setJourneyLoading(false);
      }
    }

    loadPage();
    loadJourney();
    return () => {
      active = false;
    };
  }, [name, params.country, pageKey, reloadKey]);

  // Compare popup pool: QS / THE / ARWU results for this name (web
  // UniversityIntroPage searchPool). Loaded once the popup is first opened.
  useEffect(() => {
    if (!compareOpen || comparePoolCache.has(name)) return undefined;
    let active = true;
    searchAllRankings(name)
      .then((results) => {
        comparePoolCache.set(name, results);
        if (active) setSearchPool(results);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [compareOpen, name]);

  // The row of the ranking the user came from (or the first one found).
  const primaryKey = rows[params.dataset] ? params.dataset : RANKING_KEYS.find((key) => rows[key]);
  const primary = primaryKey ? rows[primaryKey] : null;
  const raw = primary?.raw || {};
  const country = primary?.country || journey?.country || params.country || '';

  // Value of one field: export row first, then the attributes endpoint.
  const field = (column, attributeKey) => {
    if (column === 'Country') return country;
    if (hasValue(raw[column])) return raw[column];
    for (const key of RANKING_KEYS) {
      if (hasValue(rows[key]?.raw?.[column])) return rows[key].raw[column];
    }
    return attributeKey && hasValue(attributes?.[attributeKey]) ? attributes[attributeKey] : null;
  };

  const info = {
    region: field('Region', 'region'),
    type: field('Public__Private', 'public_private'),
    language: field('Language', 'language'),
    degrees: field('Degree_Level_offered', 'degree_level'),
    employability: field('Graduate_Employability_Rate', 'employability_rate'),
    country,
  };

  const rankSummaries = useMemo(
    () =>
      RANKING_KEYS.map((key) => ({ key, summary: summariseDataset(journey?.datasets?.[key]) })).filter(
        (item) => item.summary || rows[item.key]
      ),
    [journey, rows]
  );

  // The university as a saved / compared item.
  const university = useMemo(
    () => ({
      ...(primary || {}),
      name: primary?.name || journey?.name || name,
      country,
      dataset: primaryKey || params.dataset,
      official_rank: primary?.official_rank || params.rank,
      raw: { ...(primary?.raw || {}), Institution_Name: primary?.name || name, Country: country },
    }),
    [primary, journey, name, country, primaryKey, params.dataset, params.rank]
  );

  const planList = useMemo(() => (isStudent ? [{ name: university.name, country }] : []), [isStudent, university.name, country]);
  const plan = useStudentPlan(planList);
  const myPlan = plan.data?.universities?.[0];

  // This university (each ranking's row), the name search results and the
  // saved list, one entry per university.
  const comparePool = useMemo(() => {
    const seen = new Set();
    return [university, ...RANKING_KEYS.map((key) => rows[key]).filter(Boolean), ...searchPool, ...saved.items].filter(
      (item) => {
        const key = identityKey(item?.name || item?.raw?.Institution_Name, item?.country || item?.raw?.Country);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }
    );
  }, [university, rows, searchPool, saved.items]);

  const city = CITY_COLUMNS.map((column) => field(column)).find(hasValue) || null;
  const hasSelectedResult = hasValue(params.currentRank) || hasValue(params.score);

  const isSaved = saved.isSaved(university);
  const isCompared = compare.isCompared(university);
  const displayName = primary?.name || journey?.name || name;
  const sectionInfo = SECTIONS.find((item) => item.key === section);

  const renderFields = () => {
    if (section === 'rankings') {
      return rankSummaries.length === 0 ? (
        <Text style={styles.mutedText}>Not listed in QS, THE or ARWU.</Text>
      ) : (
        rankSummaries.map(({ key, summary }) =>
          summary ? (
            <RankCard key={key} dataset={key} summary={summary} officialRank={rows[key]?.official_rank} highlight={key === primaryKey} />
          ) : (
            <View key={key} style={styles.rowCard}>
              <View style={styles.rowTop}>
                <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: DATASETS[key].color, marginRight: 8 }} />
                <Text style={[styles.rowName, styles.flex1]}>{DATASETS[key].label}</Text>
                <Text style={[styles.rowScore, { fontSize: 16 }]}>#{rows[key].official_rank}</Text>
              </View>
            </View>
          )
        )
      );
    }

    if (sectionInfo.links) {
      const links = sectionInfo.links.map(([label, column]) => [label, field(column)]).filter(([, url]) => hasValue(url));
      return links.length === 0 ? (
        <Text style={styles.mutedText}>No links on file yet.</Text>
      ) : (
        links.map(([label, url]) => (
          <TouchableOpacity
            key={label}
            onPress={() => Linking.openURL(String(url).split(' ; ')[0]).catch(() => {})}
            style={[styles.rowCard, styles.rowTop, { minHeight: 44 }]}
            accessibilityRole="link"
          >
            <Ionicons name="open-outline" size={16} color={authTheme.colors.brandTeal} style={{ marginRight: 8 }} />
            <View style={styles.flex1}>
              <Text style={styles.rowName}>{label}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {String(url)}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      );
    }

    const values = sectionInfo.fields.map(([label, column, attributeKey, wide]) => ({ label, value: field(column, attributeKey), wide }));
    if (!values.some((item) => hasValue(item.value))) {
      return <Text style={styles.mutedText}>No details on file yet.</Text>;
    }
    return (
      <View style={[styles.kvGrid, { marginTop: 0 }]}>
        {values.map((item) => (
          <View key={item.label} style={[styles.kvItem, item.wide && { flexBasis: '100%' }]}>
            <Text style={styles.kvLabel}>{item.label}</Text>
            <Text style={styles.kvValue} numberOfLines={item.wide ? 8 : 4}>
              {hasValue(item.value) ? String(item.value).replace(/,(?=\S)/g, ', ') : 'N/A'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <AppLayout
      navigation={navigation}
      bottomSpace={isStudent && compare.items.length ? 120 : 32}
      footer={
        isStudent ? (
          <>
            <CompareBar compareList={compare.items} onOpenCompare={() => setCompareOpen(true)} onClearCompare={compare.clear} />
            <CompareModal
              visible={compareOpen}
              compareList={compare.items}
              allUniversities={comparePool}
              onClose={() => setCompareOpen(false)}
              onAddUniversity={compare.add}
              onRemove={compare.remove}
              onGoToRankings={() => setCompareOpen(false)}
            />
          </>
        ) : null
      }
    >
      <View style={styles.heroCard}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>University profile</Text>
        </View>
        <Text style={styles.heroTitle}>{displayName}</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {hasValue(city) && <Pill label={`🏙️ ${city}`} />}
          {hasValue(country) && <Pill label={`📍 ${country}`} />}
          {hasValue(info.region) && <Pill label={info.region} />}
          {hasValue(info.type) && <Pill label={info.type} />}
        </View>

        {loading ? (
          <InlineLoader style={{ paddingHorizontal: 0, alignItems: 'flex-start' }} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {RANKING_KEYS.map((key) => (
              <View
                key={key}
                style={[
                  styles.statCard,
                  { minHeight: 0, flexBasis: 80, paddingVertical: 8, alignItems: 'center' },
                  key === primaryKey && { borderColor: authTheme.colors.brandTeal },
                ]}
              >
                <Text style={[styles.kvLabel, { color: DATASETS[key].color, fontWeight: '900' }]}>{DATASETS[key].label}</Text>
                <Text style={[styles.statValue, { fontSize: 16 }]} numberOfLines={1} adjustsFontSizeToFit>
                  {rows[key] ? `#${rows[key].official_rank}` : '–'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {isStudent && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <HeroButton
              label={isCompared ? 'Compared' : 'Compare'}
              icon={isCompared ? 'checkmark' : 'git-compare-outline'}
              active={isCompared}
              onPress={() => compare.toggle(university)}
            />
            <HeroButton
              label={isSaved ? 'Saved' : 'Save'}
              icon={isSaved ? 'star' : 'star-outline'}
              active={isSaved}
              onPress={() => saved.toggle(university, university.dataset)}
            />
          </View>
        )}
      </View>

      {loading ? (
        <Card>
          <LoadingBlock />
        </Card>
      ) : error ? (
        <ErrorBox message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : (
        <>
          {(primary || attributes) && (
            <Card>
              <SectionHeading title={`About ${displayName}`} />
              <Text style={styles.bodyText}>{introText(displayName, info)}</Text>
            </Card>
          )}

          {hasSelectedResult && (
            <SelectedResult
              officialRank={primary?.official_rank || params.rank}
              currentRank={params.currentRank}
              score={params.score}
              scoreLabel={params.scoreLabel}
            />
          )}

          {isStudent && (
            <Card>
              <SectionHeading eyebrow="For you" title="Your chances & total cost" subtitle="Based on your saved profile." />
              {plan.loading ? (
                <LoadingBlock />
              ) : plan.error ? (
                <Text style={styles.mutedText}>{plan.error}</Text>
              ) : (
                <PlanDetails plan={myPlan} pkrPerUsd={plan.data?.pkr_per_usd} />
              )}
            </Card>
          )}

          {(journey || journeyLoading) && (
            <Card>
              <SectionHeading eyebrow="Trend" title="Rank over the years" subtitle="Higher on the chart is a better rank." />
              {journey ? <RankJourneyChart datasets={journey.datasets} /> : <LoadingBlock />}
            </Card>
          )}

          <Card>
            <SectionTabs value={section} onChange={setSection} />
            <Text style={[styles.mutedText, { marginTop: 10, marginBottom: 8 }]}>{sectionInfo.about}</Text>
            {renderFields()}
          </Card>
        </>
      )}
    </AppLayout>
  );
}
