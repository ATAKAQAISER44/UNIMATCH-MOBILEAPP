// src/components/index.js
import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Modal, ScrollView,
} from 'react-native';
import { COLORS } from '../constants';

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ title, onPress, variant = 'primary', loading, disabled, style }) {
  const bg = {
    primary: COLORS.primary,
    emerald: COLORS.emerald,
    outline: 'transparent',
    ghost: 'transparent',
    danger: COLORS.rose,
  }[variant];

  const textColor = variant === 'outline' ? COLORS.primary : COLORS.white;
  const borderColor = variant === 'outline' ? COLORS.primary : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: bg, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} />
        : <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, style, inputStyle, ...props }) {
  return (
    <View style={[styles.inputWrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, inputStyle]}
        placeholderTextColor={COLORS.textMuted}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, color = COLORS.primary }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
// Spinner only - no loading text.
export function LoadingScreen() {
  return (
    <View style={styles.loadingScreen} accessibilityLabel="Loading">
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

// ─── Alert Box ────────────────────────────────────────────────────────────────
export function AlertBox({ message, type = 'error' }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <View style={[styles.alertBox, { backgroundColor: isError ? COLORS.errorLight : COLORS.successLight, borderColor: isError ? COLORS.error : COLORS.success }]}>
      <Text style={[styles.alertText, { color: isError ? COLORS.error : COLORS.success }]}>{message}</Text>
    </View>
  );
}

// ─── Picker Modal ─────────────────────────────────────────────────────────────
export function PickerModal({ visible, title, options, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.modalOption, selected === opt && styles.modalOptionSelected]}
                onPress={() => { onSelect(opt); onClose(); }}
              >
                <Text style={[styles.modalOptionText, selected === opt && styles.modalOptionTextSelected]}>
                  {opt}
                </Text>
                {selected === opt && <Text style={{ color: COLORS.primary, fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Select Field ─────────────────────────────────────────────────────────────
export function SelectField({ label, value, placeholder, onPress, disabled }) {
  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.input, styles.selectField, disabled && styles.disabledField]}
        onPress={!disabled ? onPress : undefined}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[styles.selectText, !value && { color: COLORS.textMuted }]}>
          {value || placeholder}
        </Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
export function StepIndicator({ steps, currentStep }) {
  return (
    <View style={styles.stepContainer}>
      {steps.map((step, index) => {
        const num = index + 1;
        const isActive = num === currentStep;
        const isDone = num < currentStep;
        return (
          <View key={step} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              isActive && { backgroundColor: COLORS.primary },
              isDone && { backgroundColor: COLORS.emerald },
            ]}>
              <Text style={[styles.stepNum, (isActive || isDone) && { color: COLORS.white }]}>
                {isDone ? '✓' : num}
              </Text>
            </View>
            <Text style={[styles.stepLabel, isActive && { color: COLORS.primary, fontWeight: '700' }, isDone && { color: COLORS.emerald }]} numberOfLines={2}>
              {step}
            </Text>
            {index < steps.length - 1 && (
              <View style={[styles.stepLine, isDone && { backgroundColor: COLORS.emerald }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  inputWrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 52,
  },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#4F6EF7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: COLORS.textLight, lineHeight: 20 },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 15, color: COLORS.textLight, fontWeight: '500' },
  alertBox: { borderWidth: 1, borderRadius: 12, padding: 14, marginVertical: 8 },
  alertText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '75%',
    paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  modalOption: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalOptionSelected: { backgroundColor: COLORS.primaryLight },
  modalOptionText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  modalOptionTextSelected: { color: COLORS.primary, fontWeight: '700' },
  selectField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 15, color: COLORS.text, flex: 1 },
  disabledField: { opacity: 0.5 },
  stepContainer: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4, marginBottom: 28 },
  stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6, zIndex: 1,
  },
  stepNum: { fontSize: 13, fontWeight: '700', color: COLORS.textLight },
  stepLabel: { fontSize: 10, color: COLORS.textLight, textAlign: 'center', fontWeight: '500', lineHeight: 13 },
  stepLine: {
    position: 'absolute', top: 16,
    left: '55%', right: '-55%',
    height: 2, backgroundColor: COLORS.border, zIndex: 0,
  },
});
