
// src/components/smart-match/CustomFilterBuilder.js

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { authTheme } from '../../styles/authTheme';

const FIELD_OPTIONS = [
  { value: 'region', label: 'Region', type: 'text', placeholder: 'Asia' },
  { value: 'country', label: 'Country', type: 'text', placeholder: 'Pakistan' },
  { value: 'degree', label: 'Degree', type: 'text', placeholder: 'MS' },
  { value: 'program', label: 'Program', type: 'text', placeholder: 'Cyber Security' },
  { value: 'cgpa', label: 'CGPA', type: 'number', placeholder: '3.1' },
  { value: 'tuition', label: 'Tuition', type: 'number', placeholder: '4000' },
  { value: 'living_cost', label: 'Living Cost', type: 'number', placeholder: '25000' },
  { value: 'scholarship', label: 'Scholarship', type: 'text', placeholder: 'Scholarship-supported' },
  { value: 'acceptance_rate', label: 'Acceptance Rate', type: 'number', placeholder: '50' },
  { value: 'employability', label: 'Employability', type: 'number', placeholder: '80' },
];

const NUMBER_FIELDS = [
  'cgpa',
  'tuition',
  'living_cost',
  'acceptance_rate',
  'employability',
];

const TEXT_FIELDS = ['program', 'degree', 'region', 'country', 'scholarship'];

function getOperators(field) {
  if (NUMBER_FIELDS.includes(field)) {
    return ['<=', '>=', '='];
  }

  if (TEXT_FIELDS.includes(field)) {
    return ['=', 'contains'];
  }

  return ['='];
}

function getFieldConfig(fieldValue) {
  return FIELD_OPTIONS.find((field) => field.value === fieldValue) || FIELD_OPTIONS[0];
}

function formatFieldLabel(fieldValue) {
  return getFieldConfig(fieldValue).label;
}

export default function CustomFilterBuilder({
  filters = [],
  setFilters,
  actionsComponent = null,
}) {
  const [fieldModalIndex, setFieldModalIndex] = useState(null);
  const [operatorModalIndex, setOperatorModalIndex] = useState(null);

  const hasFilters = Array.isArray(filters) && filters.length > 0;

  const addFilter = () => {
    setFilters((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        field: 'region',
        operator: '=',
        value: '',
      },
    ]);
  };

  const removeFilter = (index) => {
    setFilters((prev) =>
      Array.isArray(prev) ? prev.filter((_, i) => i !== index) : []
    );
  };

  const updateFilter = (index, key, value) => {
    setFilters((prev) =>
      (Array.isArray(prev) ? prev : []).map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (key === 'field') {
          return {
            field: value,
            operator: getOperators(value)[0],
            value: '',
          };
        }

        return {
          ...item,
          [key]: value,
        };
      })
    );
  };

  const selectedFieldOptions = FIELD_OPTIONS;

  const selectedOperatorOptions = useMemo(() => {
    if (operatorModalIndex === null) return [];

    const currentFilter = filters?.[operatorModalIndex];

    return getOperators(currentFilter?.field);
  }, [operatorModalIndex, filters]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>Custom Filters</Text>

          <Text style={styles.subtitle}>
            Add  your custom filters here.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButtonShell}
          onPress={addFilter}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={authTheme.gradients.button}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {!hasFilters && (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconBox}>
            <Text style={styles.emptyIcon}>🔎</Text>
          </View>

          <Text style={styles.emptyTitle}>No custom filters added yet</Text>

          <Text style={styles.emptyText}>
            Tap Add to create your first filter.
          </Text>
        </View>
      )}

      {hasFilters &&
        filters.map((filter, index) => {
          const fieldConfig = getFieldConfig(filter?.field);
          const operators = getOperators(filter?.field);
          const currentOperator = operators.includes(filter?.operator)
            ? filter.operator
            : operators[0];

          return (
            <View
              key={`${filter?.field || 'filter'}-${index}`}
              style={styles.filterCard}
            >
              <View style={styles.filterTopRow}>
                <View style={styles.filterNumber}>
                  <Text style={styles.filterNumberText}>{index + 1}</Text>
                </View>

                <Text style={styles.filterCardTitle}>Filter</Text>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeFilter(index)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Field</Text>

                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setFieldModalIndex(index)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.selectText}>
                    {formatFieldLabel(filter?.field)}
                  </Text>

                  <Text style={styles.selectArrow}>⌄</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Operator</Text>

                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setOperatorModalIndex(index)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.selectText}>{currentOperator}</Text>

                  <Text style={styles.selectArrow}>⌄</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Value</Text>

                <TextInput
                  style={styles.input}
                  value={String(filter?.value ?? '')}
                  onChangeText={(value) => updateFilter(index, 'value', value)}
                  placeholder={fieldConfig.placeholder || 'Enter value'}
                  placeholderTextColor="#94a3b8"
                  keyboardType={fieldConfig.type === 'number' ? 'numeric' : 'default'}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Preview</Text>

                <Text style={styles.previewText}>
                  {formatFieldLabel(filter?.field)} {currentOperator}{' '}
                  {filter?.value ? String(filter.value) : '...'}
                </Text>
              </View>
            </View>
          );
        })}

      {actionsComponent ? (
        <View style={styles.actionsSlot}>{actionsComponent}</View>
      ) : null}

      <OptionModal
        visible={fieldModalIndex !== null}
        title="Select Field"
        options={selectedFieldOptions.map((item) => ({
          label: item.label,
          value: item.value,
        }))}
        selectedValue={
          fieldModalIndex !== null ? filters?.[fieldModalIndex]?.field : ''
        }
        onClose={() => setFieldModalIndex(null)}
        onSelect={(value) => {
          updateFilter(fieldModalIndex, 'field', value);
          setFieldModalIndex(null);
        }}
      />

      <OptionModal
        visible={operatorModalIndex !== null}
        title="Select Operator"
        options={selectedOperatorOptions.map((operator) => ({
          label: operator,
          value: operator,
        }))}
        selectedValue={
          operatorModalIndex !== null
            ? filters?.[operatorModalIndex]?.operator
            : ''
        }
        onClose={() => setOperatorModalIndex(null)}
        onSelect={(value) => {
          updateFilter(operatorModalIndex, 'operator', value);
          setOperatorModalIndex(null);
        }}
      />
    </View>
  );
}

function OptionModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => String(item.value)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.optionList}
            renderItem={({ item }) => {
              const active = selectedValue === item.value;

              return (
                <TouchableOpacity
                  style={[styles.optionRow, active && styles.optionRowActive]}
                  onPress={() => onSelect(item.value)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.optionText,
                      active && styles.optionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {active && <Text style={styles.optionCheck}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  headerTextBlock: {
    flex: 1,
    paddingRight: 10,
  },

  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    letterSpacing: -0.45,
    marginBottom: 2,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.colors.brandMuted,
  },

  addButtonShell: {
    minWidth: 78,
    minHeight: 40,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: authTheme.colors.brandTeal,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 4,
  },

  addButton: {
    minHeight: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },

  addButtonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  emptyBox: {
    minHeight: 160,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  emptyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: authTheme.colors.brandMintDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  emptyIcon: {
    fontSize: 21,
  },

  emptyTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    marginBottom: 4,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.colors.brandMuted,
    textAlign: 'center',
    fontWeight: '700',
  },

  filterCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 10,
  },

  filterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  filterNumber: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: authTheme.colors.brandTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  filterNumberText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  filterCardTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.gray900,
  },

  deleteButton: {
    minHeight: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  deleteButtonText: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '900',
    color: '#B91C1C',
  },

  inputGroup: {
    width: '100%',
    marginBottom: 10,
  },

  label: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 7,
  },

  selectBox: {
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

  selectText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: authTheme.colors.gray900,
  },

  selectArrow: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
    marginLeft: 8,
    marginTop: -2,
  },

  input: {
    width: '100%',
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: authTheme.colors.gray900,
  },

  previewBox: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    backgroundColor: '#F8FFFC',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  previewLabel: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '900',
    color: authTheme.colors.brandMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 3,
  },

  previewText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: authTheme.colors.brandTeal,
  },

  actionsSlot: {
    marginTop: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  sheet: {
    width: '92%',
    maxHeight: '70%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: authTheme.colors.brandBorder,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 14,
  },

  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  sheetTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    letterSpacing: -0.45,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },

  optionList: {
    paddingBottom: 4,
  },

  optionRow: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },

  optionRowActive: {
    backgroundColor: '#EAF7F3',
    borderColor: authTheme.colors.brandBorder,
  },

  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: authTheme.colors.gray900,
    paddingRight: 10,
  },

  optionTextActive: {
    color: authTheme.colors.brandTeal,
    fontWeight: '900',
  },

  optionCheck: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },
});