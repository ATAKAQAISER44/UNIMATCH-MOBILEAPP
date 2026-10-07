// src/components/rankings/PaginationControls.js
//
// Numbered pagination shared by the Rankings lists and Smart Match results
// (web PaginationControls.jsx): first / previous, page numbers with
// ellipses, next / last. On narrow phones it shows fewer page numbers.

import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Text } from '../AppText';

import { authTheme } from '../../styles/authTheme';

const COMPACT_WIDTH = 400;
// Below this width there is no room for the "…" marks.
const TINY_WIDTH = 380;

function getPageItems(page, totalPages, compact, showGaps = true) {
  const windowSize = compact ? 3 : 5;

  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const items = [];

  if (start > 1) {
    // Wide screens show page 1; phones rely on the "first" button.
    if (!compact) items.push(1);
    if (showGaps && start > (compact ? 1 : 2)) items.push('start-gap');
  }

  for (let number = start; number <= end; number += 1) items.push(number);

  if (end < totalPages) {
    if (showGaps && end < totalPages - (compact ? 0 : 1)) items.push('end-gap');
    if (!compact) items.push(totalPages);
  }

  return items;
}

function NavButton({ label, accessibilityLabel, disabled, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.navText, disabled && styles.textDisabled]}>{label}</Text>
    </TouchableOpacity>
  );
}

const PaginationControls = memo(function PaginationControls({
  page,
  totalPages,
  onPageChange,
  style,
}) {
  const { width } = useWindowDimensions();
  const total = Math.max(1, Number(totalPages) || 1);

  if (total <= 1) return null;

  const current = Math.min(Math.max(Number(page) || 1, 1), total);
  const compact = width < COMPACT_WIDTH;
  const items = getPageItems(current, total, compact, width >= TINY_WIDTH);

  const goTo = (target) => {
    if (target !== current && target >= 1 && target <= total) onPageChange?.(target);
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.row}>
        <NavButton label="«" accessibilityLabel="First page" disabled={current <= 1} onPress={() => goTo(1)} />
        <NavButton label="‹" accessibilityLabel="Previous page" disabled={current <= 1} onPress={() => goTo(current - 1)} />

        {items.map((item) =>
          typeof item === 'number' ? (
            <TouchableOpacity
              key={item}
              style={[styles.button, item === current && styles.buttonActive]}
              onPress={() => goTo(item)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Page ${item}`}
              accessibilityState={{ selected: item === current }}
            >
              <Text style={[styles.pageText, item === current && styles.pageTextActive]}>{item}</Text>
            </TouchableOpacity>
          ) : (
            <Text key={item} style={styles.gap}>
              …
            </Text>
          )
        )}

        <NavButton label="›" accessibilityLabel="Next page" disabled={current >= total} onPress={() => goTo(current + 1)} />
        <NavButton label="»" accessibilityLabel="Last page" disabled={current >= total} onPress={() => goTo(total)} />
      </View>

      <Text style={styles.caption}>
        Page {current} of {total}
      </Text>
    </View>
  );
});

export default PaginationControls;

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    alignItems: 'center',
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  button: {
    minWidth: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonActive: {
    borderColor: authTheme.colors.brandTeal,
    backgroundColor: authTheme.colors.brandTeal,
  },

  buttonDisabled: {
    opacity: 0.4,
  },

  navText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  pageText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
  },

  pageTextActive: {
    color: '#FFFFFF',
  },

  textDisabled: {
    color: '#94A3B8',
  },

  gap: {
    paddingHorizontal: 1,
    fontSize: 13,
    fontWeight: '900',
    color: '#94A3B8',
  },

  caption: {
    marginTop: 6,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
    color: authTheme.colors.brandMuted,
  },
});
