// src/components/researcher/ResearcherUI.js
//
// Small building blocks shared by every Researcher screen (mobile versions of
// the web's StatCard, CustomDropdown, PaginationControls, RankChangeBadge,
// MethodologyPanel, ...). They only use the existing theme tokens.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { MAX_FONT_SCALE, Text, TextInput } from '../AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { topBarPadding } from '../../utils/safeArea';

import PickerModal from '../PickerModal';
import { authTheme } from '../../styles/authTheme';
import { researcherStyles as styles } from '../../styles/researcherStyles';
import {
  RESEARCHER_DATASETS,
  RESEARCHER_DATASET_KEYS,
  RESEARCHER_METHODOLOGY,
  RESEARCHER_METRICS,
} from '../../constants/researcherConstants';

const LOGO = require('../../../assets/images/icon.png');

// ── Top bar ────────────────────────────────────────────────────────────────
export function ResearcherTopBar({ onBack, onMenu, roleLabel = 'RESEARCHER' }) {
  // The bar runs under the status bar / notch; the inset keeps its buttons
  // clear of it on every device.
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={authTheme.gradients.button}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.topBar, topBarPadding(insets)]}
    >
      <StatusBar barStyle="light-content" />
      <TouchableOpacity
        style={styles.topButton}
        activeOpacity={0.82}
        onPress={onBack || onMenu}
        accessibilityLabel={onBack ? 'Go back' : 'Open menu'}
      >
        <Ionicons name={onBack ? 'arrow-back' : 'menu-outline'} size={onBack ? 22 : 24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.brandRow}>
        <View style={styles.navLogoWrap}>
          <Image source={LOGO} style={styles.navLogo} resizeMode="contain" />
        </View>
        <View>
          <Text style={styles.navBrand}>UniMatch</Text>
          <Text style={styles.navRole}>{roleLabel}</Text>
        </View>
      </View>

      {onBack ? (
        <TouchableOpacity
          style={styles.topButton}
          activeOpacity={0.82}
          onPress={onMenu}
          accessibilityLabel="Open app menu"
        >
          <Ionicons name="grid-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 34, height: 34 }} />
      )}
    </LinearGradient>
  );
}

// ── Headings & cards ───────────────────────────────────────────────────────
// hint: optional one-line "how to use" instruction under the subtitle.
// guide (researcher pages, web: ResearcherPageHeader): { question, steps: [3
// short steps], next: { label, route, params } }. Shows a small foldable
// "How to use" (folded by default, remembered on the phone) and a
// "Next: X →" link.
export function PageHeader({ eyebrow, title, subtitle, hint, guide, children }) {
  return (
    <View style={styles.heroCard}>
      {!!eyebrow && (
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>{eyebrow}</Text>
        </View>
      )}
      <Text style={styles.heroTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}
      {!!hint && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
          <Ionicons name="information-circle-outline" size={14} color={authTheme.colors.brandTeal} style={{ marginTop: 1, marginRight: 5 }} />
          <Text style={[styles.heroSubtitle, styles.flex1, { color: authTheme.colors.gray700 }]}>{hint}</Text>
        </View>
      )}
      {guide ? <PageGuide guide={guide} /> : null}
      {children}
    </View>
  );
}

const GUIDE_STORAGE_KEY = 'researcher_page_guide_open';

function PageGuide({ guide }) {
  const navigation = useNavigation();
  const [open, toggle] = usePersistentToggle(GUIDE_STORAGE_KEY, false);
  const { question, steps = [], next } = guide;

  return (
    <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: authTheme.colors.brandBorder, paddingTop: 2 }}>
      <View style={[styles.rowBetween, { flexWrap: 'wrap' }]}>
        {steps.length > 0 || question ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={open ? 'Hide how to use' : 'Show how to use'}
            style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', paddingRight: 8 }}
          >
            <Ionicons name="help-circle-outline" size={15} color={authTheme.colors.brandTeal} style={{ marginRight: 4 }} />
            <Text style={[styles.eyebrow, { marginBottom: 0 }]}>How to use</Text>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={13} color={authTheme.colors.brandTeal} style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        ) : (
          <View />
        )}
        {!!next && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate(next.route, next.params, { pop: true })}
            accessibilityRole="link"
            style={{ minHeight: 40, justifyContent: 'center', marginLeft: 'auto' }}
          >
            <Text style={{ fontSize: 11.5, fontWeight: '900', color: authTheme.colors.brandTeal }}>Next: {next.label} →</Text>
          </TouchableOpacity>
        )}
      </View>
      {open && (
        <View style={{ paddingBottom: 2 }}>
          {!!question && (
            <Text style={[styles.heroSubtitle, { color: authTheme.colors.gray700, fontWeight: '700', marginBottom: 6 }]}>{question}</Text>
          )}
          {steps.map((step, index) => (
            <View key={step} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: authTheme.colors.brandMintDeep,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 7,
                  marginTop: 0,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '900', color: authTheme.colors.brandTeal }}>{index + 1}</Text>
              </View>
              <Text style={[styles.heroSubtitle, styles.flex1, { color: authTheme.colors.gray700 }]}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeading({ eyebrow, title, subtitle, right }) {
  return (
    <View style={[styles.rowBetween, { alignItems: 'flex-start' }]}>
      <View style={styles.flex1}>
        {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        {!!title && <Text style={styles.sectionTitle}>{title}</Text>}
        {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {right ? <View style={{ marginLeft: 8 }}>{right}</View> : null}
    </View>
  );
}

// Card with a Show / Hide toggle (the web's "How to read" panels).
export function CollapsibleCard({ eyebrow, title, open, onToggle, children }) {
  return (
    <Card>
      <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={styles.rowBetween}>
        <View style={styles.flex1}>
          {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{title}</Text>
        </View>
        <View style={[styles.outlineButton, styles.outlineButtonSmall]}>
          <Text style={[styles.outlineButtonText, { fontSize: 11.5 }]}>{open ? 'Hide' : 'Show'}</Text>
        </View>
      </TouchableOpacity>
      {open ? <View style={{ marginTop: 10 }}>{children}</View> : null}
    </Card>
  );
}

// Remembers an open/closed toggle on the phone (web used localStorage).
export function usePersistentToggle(storageKey, defaultValue = true) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (active && stored !== null) setValue(stored !== 'false');
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [storageKey]);

  const toggle = useCallback(() => {
    setValue((current) => {
      const next = !current;
      AsyncStorage.setItem(storageKey, String(next)).catch(() => {});
      return next;
    });
  }, [storageKey]);

  return [value, toggle];
}

// ── Buttons ────────────────────────────────────────────────────────────────
export function GradientButton({ title, onPress, disabled, loading, small, style, icon }) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.gradientButtonOuter, (disabled || loading) && styles.buttonDisabled, style]}
    >
      <LinearGradient
        colors={authTheme.gradients.button}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.gradientButton, small && styles.gradientButtonSmall]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={[styles.gradientButtonText, small && { fontSize: 11.5 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {icon ? `${icon}  ` : ''}
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function OutlineButton({ title, onPress, disabled, small, danger, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.outlineButton,
        small && styles.outlineButtonSmall,
        danger && styles.dangerButton,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text
        style={[styles.outlineButtonText, small && { fontSize: 11.5 }, danger && styles.dangerButtonText]}
        numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// ── Segmented control & dataset switcher ───────────────────────────────────
export function SegmentedControl({ options, value, onChange, style }) {
  return (
    <View style={[styles.segment, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={String(option.value)}
            activeOpacity={0.86}
            style={styles.segmentItem}
            onPress={() => onChange(option.value)}
          >
            {active ? (
              <LinearGradient
                colors={authTheme.gradients.button}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.segmentFill}
              >
                <Text
                  style={[styles.segmentText, styles.segmentTextActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {option.label}
                </Text>
                {!!option.hint && (
                  <Text style={[styles.segmentHint, styles.segmentHintActive]}>{option.hint}</Text>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.segmentFill}>
                <Text style={styles.segmentText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {option.label}
                </Text>
                {!!option.hint && <Text style={styles.segmentHint}>{option.hint}</Text>}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const DATASET_OPTIONS = RESEARCHER_DATASET_KEYS.map((key) => ({
  value: key,
  label: RESEARCHER_DATASETS[key].shortName,
}));

// QS / THE / ARWU tabs plus the edition (year) selector.
export function DatasetYearBar({ datasetKey, onDatasetChange, year, years, onYearChange }) {
  const yearOptions = useMemo(
    () => (years?.length ? years : [year]).map((item) => ({ value: item, label: String(item) })),
    [years, year]
  );

  // On narrow phones (or with large system text) the edition picker moves
  // under the QS / THE / ARWU switch so neither gets squeezed.
  const { width, fontScale } = useWindowDimensions();
  const stacked = width / Math.min(Math.max(fontScale || 1, 1), MAX_FONT_SCALE) < 360;

  return (
    <View style={[styles.switcherRow, stacked && { flexDirection: 'column', alignItems: 'stretch' }]}>
      <SegmentedControl
        options={DATASET_OPTIONS}
        value={datasetKey}
        onChange={onDatasetChange}
        style={stacked ? { marginBottom: 0 } : { flex: 1, marginBottom: 0 }}
      />
      <View style={stacked ? null : { width: 100 }}>
        <SelectField
          title="Edition"
          value={year}
          options={yearOptions}
          onChange={onYearChange}
          disabled={yearOptions.length <= 1}
        />
      </View>
    </View>
  );
}

// ── Select field (opens the app's PickerModal) ─────────────────────────────
export function SelectField({ label, title, value, options, onChange, disabled, placeholder, style }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => String(option.value) === String(value));
  const labels = options.map((option) => option.label);

  return (
    <View style={style}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        activeOpacity={0.86}
        style={[styles.selectBox, disabled && styles.selectDisabled]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <Text style={styles.selectText} numberOfLines={1}>
          {selected?.label ?? placeholder ?? 'Select'}
        </Text>
        <Text style={styles.selectArrow}>⌄</Text>
      </TouchableOpacity>

      <PickerModal
        visible={open}
        title={title || label || 'Select'}
        options={labels}
        selected={selected?.label}
        onSelect={(chosenLabel) => {
          const option = options.find((item) => item.label === chosenLabel);
          setOpen(false);
          if (option && String(option.value) !== String(value)) onChange(option.value);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

export function SearchInput({ value, onChangeText, placeholder, editable = true, onFocus, style }) {
  return (
    <View style={[styles.searchBox, !editable && styles.selectDisabled, style]}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        editable={editable}
        onFocus={onFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {!!value && editable && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8}>
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Stats & findings ───────────────────────────────────────────────────────
export function StatGrid({ items }) {
  return (
    <View style={styles.statGrid}>
      {items.map((item) => (
        <View key={item.label} style={styles.statCard}>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {item.value}
          </Text>
          <Text style={styles.statLabel}>{item.label}</Text>
          {!!item.hint && <Text style={styles.statHint}>{item.hint}</Text>}
        </View>
      ))}
    </View>
  );
}

const TONES = {
  warning: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  good: { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
  normal: { borderColor: authTheme.colors.brandBorder, backgroundColor: '#F3FBF8' },
};

export function FindingCards({ findings }) {
  if (!findings?.length) return null;

  return (
    <View>
      {findings.map((finding) => (
        <View key={finding.title} style={[styles.finding, TONES[finding.tone] || TONES.normal]}>
          <Text style={styles.findingTitle}>{finding.title}</Text>
          <Text style={styles.findingText}>{finding.text}</Text>
        </View>
      ))}
    </View>
  );
}

// ── States ─────────────────────────────────────────────────────────────────
// Loading state: spinner only, no text.
export function LoadingBlock() {
  return (
    <View style={styles.loadingBox} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <ActivityIndicator size="large" color={authTheme.colors.brandTeal} />
    </View>
  );
}

// Small inline spinner (search suggestions, inline values).
export function InlineLoader({ style }) {
  return (
    <View style={[{ padding: 12, alignItems: 'center' }, style]} accessibilityLabel="Loading">
      <ActivityIndicator size="small" color={authTheme.colors.brandTeal} />
    </View>
  );
}

export function EmptyState({ text, children }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{text}</Text>
      {children}
    </View>
  );
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null;

  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <OutlineButton title="Try again" small danger onPress={onRetry} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
      ) : null}
    </View>
  );
}

export function WarningBox({ message }) {
  if (!message) return null;
  return (
    <View style={styles.warningBox}>
      <Text style={styles.warningText}>{message}</Text>
    </View>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const go = (next) => onPageChange(Math.min(Math.max(next, 1), totalPages));

  return (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[styles.pageButton, page <= 1 && styles.buttonDisabled]}
        disabled={page <= 1}
        onPress={() => go(1)}
        accessibilityLabel="First page"
      >
        <Text style={styles.pageButtonText}>«</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.pageButton, page <= 1 && styles.buttonDisabled]}
        disabled={page <= 1}
        onPress={() => go(page - 1)}
        accessibilityLabel="Previous page"
      >
        <Text style={styles.pageButtonText}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.pageInfo} accessibilityLabel={`Page ${page} of ${totalPages}`}>
        {page} / {totalPages}
      </Text>
      <TouchableOpacity
        style={[styles.pageButton, page >= totalPages && styles.buttonDisabled]}
        disabled={page >= totalPages}
        onPress={() => go(page + 1)}
        accessibilityLabel="Next page"
      >
        <Text style={styles.pageButtonText}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.pageButton, page >= totalPages && styles.buttonDisabled]}
        disabled={page >= totalPages}
        onPress={() => go(totalPages)}
        accessibilityLabel="Last page"
      >
        <Text style={styles.pageButtonText}>»</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Badges ─────────────────────────────────────────────────────────────────
export function RankChangeBadge({ value }) {
  if (value === null || value === undefined) {
    return <Text style={[styles.pillText, { color: authTheme.colors.brandMuted }]}>N/A</Text>;
  }

  if (value > 0) {
    return (
      <View style={[styles.pill, { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' }]}>
        <Text style={[styles.pillText, { color: '#059669' }]}>▲ +{value}</Text>
      </View>
    );
  }

  if (value < 0) {
    return (
      <View style={[styles.pill, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
        <Text style={[styles.pillText, { color: '#DC2626' }]}>▼ {value}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.pill, { borderColor: authTheme.colors.brandBorder, backgroundColor: authTheme.colors.brandMintDeep }]}>
      <Text style={[styles.pillText, { color: authTheme.colors.brandMuted }]}>— 0</Text>
    </View>
  );
}

export function RankPill({ rank, highlight }) {
  if (highlight) {
    return (
      <LinearGradient
        colors={authTheme.gradients.button}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.rankPill, { borderWidth: 0 }]}
      >
        <Text style={[styles.rankPillText, styles.rankPillTopText]}>#{rank}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.rankPill}>
      <Text style={styles.rankPillText}>#{rank ?? 'N/A'}</Text>
    </View>
  );
}

export function ProgressBar({ share, color, height = 7, style }) {
  const width = `${Math.max(0, Math.min(Number(share) || 0, 100))}%`;
  return (
    <View style={[styles.barTrack, { height }, style]}>
      <View style={[styles.barFill, { width, height, backgroundColor: color || authTheme.colors.brandTeal }]} />
    </View>
  );
}

// ── Methodology ────────────────────────────────────────────────────────────
export function MethodologyPanel({ datasetKey, showDescription = true }) {
  const info = RESEARCHER_METHODOLOGY[datasetKey];
  const metrics = RESEARCHER_METRICS[datasetKey] || [];

  return (
    <View>
      {showDescription && <Text style={[styles.mutedText, { marginBottom: 8 }]}>{info.methodology}</Text>}
      <View style={styles.kvGrid}>
        {metrics.map((metric) => (
          <View key={metric.key} style={[styles.kvItem, { alignItems: 'center' }]}>
            <Text style={[styles.kvLabel, { textAlign: 'center' }]} numberOfLines={2}>
              {metric.label}
            </Text>
            <Text style={[styles.kvValue, { color: authTheme.colors.brandTeal, fontSize: 14 }]}>
              {metric.weight || 'Used'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Asks whether to export the current page or every filtered row (web's
// ExportDropdown).
export function chooseExportScope(onCurrentPage, onComplete) {
  Alert.alert('Export CSV', 'Which rows do you want to export?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Current page', onPress: onCurrentPage },
    { text: 'Complete (filtered)', onPress: onComplete },
  ]);
}

// Returns a function that tells whether an async response is still the
// latest one (guards against out-of-order responses, like the web's
// requestIdRef pattern).
export function useLatestRequest() {
  const ref = React.useRef(0);
  return useCallback(() => {
    const id = ++ref.current;
    return () => id === ref.current;
  }, []);
}

// Debounced copy of a value (search boxes).
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), value ? delay : 0);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
