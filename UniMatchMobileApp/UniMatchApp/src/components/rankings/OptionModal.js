
// src/components/rankings/OptionModal.js

import React, { memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rankingsStyles as styles } from '../../styles/rankingsStyles';

const OptionModal = memo(function OptionModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  activeColor,
  activeLightColor,
}) {
  // Keep the last option above the home indicator / navigation bar.
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>

            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => String(item)}
            renderItem={({ item }) => {
              const active = selected === item;

              return (
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    active && { backgroundColor: activeLightColor },
                  ]}
                  onPress={() => onSelect(item)}
                >
                  <Text style={styles.optionText}>{item}</Text>

                  {active ? (
                    <Text style={[styles.optionCheck, { color: activeColor }]}>
                      ✓
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
          <View style={{ height: insets.bottom }} />
        </View>
      </View>
    </Modal>
  );
});

export default OptionModal;