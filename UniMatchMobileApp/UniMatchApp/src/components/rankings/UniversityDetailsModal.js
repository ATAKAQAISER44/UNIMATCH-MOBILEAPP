
// src/components/rankings/UniversityDetailsModal.js

import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

import { rankingsStyles as styles } from '../../styles/rankingsStyles';
import { EXCLUDED_DETAIL_KEYS } from '../../constants/rankingsConstants';

import {
  formatKey,
  formatValue,
  getCountry,
  getUniName,
} from '../../utils/rankingsUtils';

const DetailRow = memo(function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailKey}>{label}</Text>
      <Text style={styles.detailValue}>{String(value)}</Text>
    </View>
  );
});

export default function UniversityDetailsModal({
  visible,
  item,
  onClose,
  compared,
  saved,
  onCompare,
  onSave,
}) {
  const importantFields = useMemo(() => {
    if (!item) return [];

    return [
      ['University', getUniName(item)],
      ['Country', getCountry(item)],
      ['Current Rank', item.current_rank],
      ['Official Rank', item.official_rank || item.rank || item.world_rank],
      ['Personalized Score', item.personalized_score || item.final_score],
      ['Match Score', item.match_score || item.eligibility_score],
    ].filter(([, value]) => value !== null && value !== undefined && value !== '');
  }, [item]);

  const rawFields = useMemo(() => {
    if (!item?.raw || typeof item.raw !== 'object') return [];

    return Object.entries(item.raw).filter(
      ([key, value]) =>
        key !== 'university_id' &&
        value !== null &&
        value !== undefined &&
        value !== ''
    );
  }, [item]);

  const otherFields = useMemo(() => {
    if (!item) return [];

    return Object.entries(item).filter(
      ([key, value]) =>
        !EXCLUDED_DETAIL_KEYS.has(key) &&
        value !== null &&
        value !== undefined &&
        value !== '' &&
        typeof value !== 'object'
    );
  }, [item]);

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.detailsSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.detailsHeader}>
            <View style={styles.detailsHeaderText}>
              <Text style={styles.detailsTitle}>{getUniName(item)}</Text>
              <Text style={styles.detailsCountry}>📍 {getCountry(item)}</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailsActionRow}>
            <TouchableOpacity
              style={[
                styles.detailActionBtn,
                compared && styles.detailActionActive,
              ]}
              activeOpacity={0.86}
              onPress={onCompare}
              disabled={compared}
            >
              <Text style={styles.detailActionText}>
                {compared ? 'Added to Compare' : '+ Compare'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.detailActionBtn,
                saved && styles.detailSaveActive,
              ]}
              activeOpacity={0.86}
              onPress={onSave}
            >
              <Text style={styles.detailActionText}>
                {saved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {importantFields.length > 0 ? (
              <View style={styles.detailBlock}>
                <Text style={styles.sectionTitle}>Main Information</Text>

                {importantFields.map(([key, value]) => (
                  <DetailRow
                    key={key}
                    label={key}
                    value={formatValue(key, value)}
                  />
                ))}
              </View>
            ) : null}

            {rawFields.length > 0 ? (
              <View style={styles.detailBlock}>
                <Text style={styles.sectionTitle}>All Available Details</Text>

                {rawFields.map(([key, value]) => (
                  <DetailRow
                    key={key}
                    label={formatKey(key)}
                    value={formatValue(key, value)}
                  />
                ))}
              </View>
            ) : null}

            {rawFields.length === 0 && otherFields.length > 0 ? (
              <View style={styles.detailBlock}>
                <Text style={styles.sectionTitle}>Other Information</Text>

                {otherFields.map(([key, value]) => (
                  <DetailRow
                    key={key}
                    label={formatKey(key)}
                    value={formatValue(key, value)}
                  />
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}