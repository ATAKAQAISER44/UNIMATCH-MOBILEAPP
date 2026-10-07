// src/components/smart-match/SelectField.js
//
// A dropdown-style field that opens a list of options (single or multiple
// choice, with search for long lists). Used instead of free-text inputs so
// only values that exist in the dataset can be picked (web CustomDropdown).

import React, { memo, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Text, TextInput } from '../AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '../../styles/authTheme';

const SEARCH_THRESHOLD = 8;

function toOption(option) {
  if (option && typeof option === 'object') {
    return { value: option.value, label: String(option.label ?? option.value) };
  }
  return { value: option, label: String(option) };
}

const SelectField = memo(function SelectField({
  value,
  options = [],
  onChange,
  placeholder = 'Select',
  title,
  multiple = false,
  disabled = false,
  invalid = false,
  accessibilityLabel,
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const items = useMemo(() => options.map(toOption), [options]);
  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : [value];

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return items;
    return items.filter((item) => item.label.toLowerCase().includes(text));
  }, [items, query]);

  const displayText = multiple
    ? selectedValues.length
      ? selectedValues.join(', ')
      : ''
    : items.find((item) => item.value === value)?.label || (value ? String(value) : '');

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const handleSelect = (optionValue) => {
    if (!multiple) {
      onChange?.(optionValue);
      close();
      return;
    }

    const next = selectedValues.includes(optionValue)
      ? selectedValues.filter((item) => item !== optionValue)
      : [...selectedValues, optionValue];

    onChange?.(next);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.box, invalid && styles.boxInvalid, disabled && styles.boxDisabled]}
        onPress={() => setOpen(true)}
        disabled={disabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title || placeholder}
        accessibilityState={{ disabled }}
      >
        <Text
          style={[styles.boxText, !displayText && styles.placeholderText]}
          numberOfLines={1}
        >
          {displayText || placeholder}
        </Text>
        <Text style={styles.arrow}>⌄</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { marginBottom: insets.bottom }]}>
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                {title || placeholder}
              </Text>

              <TouchableOpacity
                style={styles.headerButton}
                onPress={close}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={multiple ? 'Done' : 'Close'}
              >
                <Text style={styles.headerButtonText}>{multiple ? 'Done' : '✕'}</Text>
              </TouchableOpacity>
            </View>

            {items.length > SEARCH_THRESHOLD ? (
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor="#94A3B8"
                autoCorrect={false}
              />
            ) : null}

            {multiple && selectedValues.length > 0 ? (
              <TouchableOpacity
                style={styles.clearRow}
                onPress={() => onChange?.([])}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.clearText}>Clear all ({selectedValues.length})</Text>
              </TouchableOpacity>
            ) : null}

            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.value)}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              ListEmptyComponent={<Text style={styles.empty}>No matches</Text>}
              renderItem={({ item }) => {
                const active = selectedValues.includes(item.value);

                return (
                  <TouchableOpacity
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.85}
                    accessibilityRole={multiple ? 'checkbox' : 'button'}
                    accessibilityState={multiple ? { checked: active } : { selected: active }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item.label}
                    </Text>
                    {active ? <Text style={styles.check}>✓</Text> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
});

export default SelectField;

const styles = StyleSheet.create({
  box: {
    width: '100%',
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  boxInvalid: {
    borderColor: '#FCA5A5',
  },

  boxDisabled: {
    opacity: 0.55,
  },

  boxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: authTheme.colors.gray900,
  },

  placeholderText: {
    color: '#94A3B8',
    fontWeight: '700',
  },

  arrow: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    marginLeft: 8,
    marginTop: -2,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  sheet: {
    width: '92%',
    maxWidth: 430,
    maxHeight: '72%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    paddingRight: 10,
  },

  headerButton: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  search: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    color: authTheme.colors.gray900,
    marginBottom: 8,
  },

  clearRow: {
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 4,
  },

  clearText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B91C1C',
  },

  option: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    backgroundColor: '#FFFFFF',
  },

  optionActive: {
    backgroundColor: '#EAF7F3',
    borderColor: authTheme.colors.brandBorder,
  },

  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: authTheme.colors.gray900,
    paddingRight: 8,
  },

  optionTextActive: {
    color: authTheme.colors.brandTeal,
    fontWeight: '900',
  },

  check: {
    fontSize: 17,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  empty: {
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 12.5,
    fontWeight: '700',
    color: authTheme.colors.brandMuted,
  },
});
