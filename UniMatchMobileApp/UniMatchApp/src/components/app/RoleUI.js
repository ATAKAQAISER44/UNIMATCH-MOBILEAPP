// src/components/app/RoleUI.js
//
// Small building blocks for the Administrator, Policymaker and new Student
// screens, in the same theme as components/researcher/ResearcherUI:
//   DataTable        - web-style table; columns stretch on tablets and scroll
//                      sideways on phones, the first column stays readable.
//   Pill             - small coloured badge (data status, priority, chance).
//   StatTile / TileGrid - big number tiles that reflow 1-4 per row.
//   BarList          - share-of-total bars (student demand).
//   RankChange       - "#364 ▲ 12" against a baseline rank.
//   UniversityPicker - search box over every ranked university (debounced).
//   ChooseFirst      - "Choose your university / country on the dashboard first."
//   ButtonRow        - wraps buttons onto new lines on narrow phones.

import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Text } from '../AppText';
import { Card, GradientButton, InlineLoader, ProgressBar, SearchInput, useDebouncedValue } from '../researcher/ResearcherUI';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import { authTheme } from '../../styles/authTheme';
import { searchJourneyUniversities } from '../../services/researcherApi';

const GREEN = '#047857';
const RED = '#B91C1C';

// cells: string | number | { text, color, bold, node }
function Cell({ cell, width, flex, first, header, odd }) {
  const value = cell && typeof cell === 'object' && !React.isValidElement(cell) ? cell : { text: cell };
  return (
    <View
      style={[
        header ? styles.tableHeadCell : styles.tableCell,
        { width, minWidth: width, flexGrow: flex ? 1 : 0, flexShrink: 0 },
        odd && !header && { backgroundColor: '#F3FBF8' },
      ]}
    >
      {value.node || (
        <Text
          style={[
            header ? styles.tableHeadText : styles.tableCellText,
            (first || value.bold) && !header && { fontWeight: '800' },
            value.color && { color: value.color, fontWeight: '900' },
          ]}
        >
          {value.text === null || value.text === undefined || value.text === '' ? '–' : String(value.text)}
        </Text>
      )}
    </View>
  );
}

export function DataTable({ head, rows, firstWidth = 150, columnWidth = 96, caption }) {
  return (
    <View style={{ marginTop: caption ? 10 : 4 }}>
      {!!caption && <Text style={[styles.findingTitle, { marginBottom: 6 }]}>{caption}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.table, { flexGrow: 1 }]}>
          <View style={styles.tableRow}>
            {head.map((cell, index) => (
              <Cell key={`h-${index}`} cell={cell} header width={index === 0 ? firstWidth : columnWidth} flex />
            ))}
          </View>
          {rows.map((row, rowIndex) => (
            <View key={`r-${rowIndex}`} style={styles.tableRow}>
              {row.map((cell, index) => (
                <Cell
                  key={`c-${rowIndex}-${index}`}
                  cell={cell}
                  first={index === 0}
                  odd={rowIndex % 2 === 1}
                  width={index === 0 ? firstWidth : columnWidth}
                  flex
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Number coloured green when positive, red when negative.
export function gapCell(value, { suffix = '', plusSign = true } = {}) {
  if (value === null || value === undefined) return { text: '–' };
  return {
    text: `${value > 0 && plusSign ? '+' : ''}${value}${suffix}`,
    color: value > 0 ? GREEN : value < 0 ? RED : undefined,
  };
}

export function Pill({ label, tone }) {
  const colors = tone || { color: authTheme.colors.brandTeal, backgroundColor: '#FFFFFF', borderColor: authTheme.colors.brandBorder };
  return (
    <View style={[styles.pill, { borderColor: colors.borderColor, backgroundColor: colors.backgroundColor }]}>
      <Text style={[styles.pillText, { color: colors.color }]}>{label}</Text>
    </View>
  );
}

export function TileGrid({ children }) {
  return <View style={styles.statGrid}>{children}</View>;
}

export function StatTile({ label, value, suffix, note, accent }) {
  return (
    <View style={[styles.statCard, { minHeight: 74 }]}>
      <Text style={[styles.eyebrow, { marginBottom: 2 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {label}
      </Text>
      <Text style={[styles.statValue, { fontSize: 22, lineHeight: 26 }, accent && { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
        {value === null || value === undefined ? '–' : value}
        {!!suffix && value !== null && value !== undefined && <Text style={{ fontSize: 12 }}>{suffix}</Text>}
      </Text>
      {!!note && <Text style={styles.statHint}>{note}</Text>}
    </View>
  );
}

export function BarList({ title, items = [], total, limit = 6 }) {
  const pct = (count) => (total ? Math.round((count / total) * 100) : 0);
  return (
    <View style={{ flexGrow: 1, flexBasis: 220, marginBottom: 10 }}>
      <Text style={styles.eyebrow}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.mutedText}>No data yet.</Text>
      ) : (
        items.slice(0, limit).map((item) => (
          <View key={item.label} style={{ marginBottom: 7 }}>
            <View style={styles.rowBetween}>
              <Text style={[styles.kvValue, styles.flex1, { marginTop: 0 }]} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[styles.kvValue, { marginTop: 0 }]}>{pct(item.count)}%</Text>
            </View>
            <ProgressBar share={pct(item.count)} height={6} style={{ marginTop: 3 }} />
          </View>
        ))
      )}
    </View>
  );
}

export function RankChange({ rank, baseline }) {
  if (rank === null || rank === undefined) return <Text style={styles.mutedText}>–</Text>;
  const change = baseline - rank;
  return (
    <Text style={[styles.kvValue, { marginTop: 0 }]}>
      #{rank}{' '}
      <Text style={{ fontSize: 11, color: change > 0 ? GREEN : change < 0 ? RED : authTheme.colors.brandMuted }}>
        {change === 0 ? 'no change' : `${change > 0 ? '▲' : '▼'} ${Math.abs(change)}`}
      </Text>
    </Text>
  );
}

export function ButtonRow({ children, style }) {
  return <View style={[styles.buttonRow, { alignItems: 'center' }, style]}>{children}</View>;
}

// Search every ranked university (QS, THE, ARWU) by name; onPick({ key, name, country }).
export function UniversityPicker({ label = 'Find a university', placeholder = 'Search university...', onPick, disabled, exclude = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebouncedValue(query.trim(), 300);

  useEffect(() => {
    let active = true;
    if (debounced.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    searchJourneyUniversities(debounced)
      .then((data) => active && setResults(data.results || []))
      .catch(() => active && setResults([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [debounced]);

  const visible = results.filter((item) => !exclude.includes(item.key));
  const searching = query.trim().length >= 2 && (loading || query.trim() !== debounced);

  return (
    <View>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <SearchInput value={query} onChangeText={setQuery} placeholder={placeholder} editable={!disabled} />
      {query.trim().length >= 2 && (
        <View style={styles.suggestionBox}>
          {searching ? (
            <InlineLoader />
          ) : visible.length === 0 ? (
            <Text style={[styles.mutedText, { padding: 12 }]}>No university found. Try another name.</Text>
          ) : (
            visible.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.suggestionRow}
                activeOpacity={0.8}
                onPress={() => {
                  setQuery('');
                  setResults([]);
                  onPick(item);
                }}
              >
                <View style={styles.flex1}>
                  <Text style={styles.suggestionName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {!!item.country && <Text style={styles.suggestionSub}>{item.country}</Text>}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}

// Shown when the administrator / policymaker has not chosen yet.
export function ChooseFirst({ what = 'university' }) {
  const navigation = useNavigation();
  return (
    <Card style={{ borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
      <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Choose your {what} first</Text>
      <Text style={[styles.mutedText, { textAlign: 'center', marginVertical: 8 }]}>
        Pick it once on your dashboard; every tool then uses it.
      </Text>
      <GradientButton title="Open dashboard" onPress={() => navigation.navigate('Dashboard', undefined, { pop: true })} />
    </Card>
  );
}
