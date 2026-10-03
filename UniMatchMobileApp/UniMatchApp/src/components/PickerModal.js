
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';

import { authTheme } from '../styles/authTheme';

function isHeaderOption(option) {
  return (
    String(option).trim().startsWith('──') &&
    String(option).trim().endsWith('──')
  );
}

export default function PickerModal({
  visible,
  title,
  options = [],
  selected,
  onSelect,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{title}</Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeIcon}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.optionsScroll}
                contentContainerStyle={styles.optionsContent}
                showsVerticalScrollIndicator={false}
              >
                {options.map((option) => {
                  const isSelected = option === selected;
                  const isHeader = isHeaderOption(option);

                  if (isHeader) {
                    return (
                      <View key={option} style={styles.categoryHeader}>
                        <Text style={styles.categoryHeaderText}>
                          {String(option).replace(/─/g, '').trim()}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={option}
                      activeOpacity={0.86}
                      onPress={() => onSelect(option)}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>

                      {isSelected ? (
                        <Text style={styles.checkText}>✓</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 18 : 0,
  },

  sheet: {
    width: '92%',
    maxWidth: 420,
    maxHeight: '72%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: '#BFE8D8',

    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 14,
  },

  headerRow: {
    width: '100%',
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    color: authTheme.colors.gray900,
    paddingRight: 12,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },

  closeIcon: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '800',
    color: authTheme.colors.brandTeal,
    marginTop: -2,
  },

  optionsScroll: {
    width: '100%',
  },

  optionsContent: {
    paddingBottom: 8,
  },

  categoryHeader: {
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 8,
  },

  categoryHeaderText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: authTheme.colors.brandTeal,
  },

  optionRow: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },

  optionRowSelected: {
    backgroundColor: '#EEF4FF',
  },

  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: '#334155',
    paddingRight: 12,
  },

  optionTextSelected: {
    color: authTheme.colors.brandTeal,
    fontWeight: '900',
  },

  checkText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900',
    color: authTheme.colors.brandTeal,
  },
});