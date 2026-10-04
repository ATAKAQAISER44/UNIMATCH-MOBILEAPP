
// src/components/rankings/my-ranking/MyRankingModals.js

import React from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput } from '../../AppText';

import { Ionicons } from '@expo/vector-icons';

import { authTheme } from '../../../styles/authTheme';
import { myRankingStyles as myStyles } from '../../../styles/myRankingStyles';
import { formatSavedDate } from '../../../utils/myRankingUtils';

export function ChoiceModal({ visible, title, items, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={myStyles.modalOverlay}>
        <View style={myStyles.choiceCard}>
          <View style={myStyles.modalHeader}>
            <Text style={myStyles.modalTitle}>{title}</Text>

            <TouchableOpacity onPress={onClose} style={myStyles.closeBtn}>
              <Ionicons name="close-outline" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {(items || []).map((item) => (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.85}
                onPress={() => onSelect(item.key)}
                style={myStyles.choiceItem}
              >
                <View style={{ flex: 1 }}>
                  <Text style={myStyles.choiceLabel}>{item.label}</Text>

                  {item.helper || item.weight ? (
                    <Text style={myStyles.choiceHelper}>
                      {item.helper || `Official default: ${item.weight}`}
                    </Text>
                  ) : null}
                </View>

                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={authTheme.colors.brandTeal}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function SaveRankingNameModal({
  visible,
  value,
  onChange,
  datasetKey,
  onClose,
  onSave,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={myStyles.modalOverlay}>
        <View style={myStyles.saveNameCard}>
          <View style={myStyles.modalHeader}>
            <View>
              <Text style={myStyles.modalMiniLabel}>Save My Ranking</Text>
              <Text style={myStyles.modalTitle}>Name this ranking</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={myStyles.closeBtn}>
              <Ionicons name="close-outline" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <Text style={myStyles.modalHelper}>
            This will be saved under {String(datasetKey || '').toUpperCase()} My
            Ranking only.
          </Text>

          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="Example: Affordable MS shortlist"
            placeholderTextColor={authTheme.colors.gray500}
            style={myStyles.nameInput}
          />

          <View style={myStyles.modalActionRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={myStyles.modalCancelBtn}
            >
              <Text style={myStyles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onSave}
              style={myStyles.modalSaveBtn}
            >
              <Text style={myStyles.modalSaveText}>Save Ranking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function SavedRankingsModal({
  visible,
  savedRankings,
  datasetKey,
  onClose,
  onApply,
  onDelete,
}) {
  const datasetLabel = String(datasetKey || '').toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={myStyles.modalOverlay}>
        <View style={myStyles.savedModalCard}>
          <View style={myStyles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={myStyles.modalTitle}>Saved My Rankings</Text>
              <Text style={myStyles.modalHelper}>
                Showing saved rankings for {datasetLabel} only.
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={myStyles.closeBtn}>
              <Ionicons name="close-outline" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!savedRankings?.length ? (
              <View style={myStyles.noSavedBox}>
                <Ionicons
                  name="folder-open-outline"
                  size={24}
                  color={authTheme.colors.brandTeal}
                />

                <Text style={myStyles.noSavedTitle}>No saved rankings yet</Text>

                <Text style={myStyles.noSavedText}>
                  Compute your ranking first, then tap Save Ranking.
                </Text>
              </View>
            ) : (
              savedRankings.map((item) => (
                <View key={item.id} style={myStyles.savedRankingCard}>
                  <View style={myStyles.savedRankingTop}>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={myStyles.savedRankingName}>
                        {item.rankingName || 'Untitled My Ranking'}
                      </Text>

                      <Text style={myStyles.savedRankingMeta}>
                        {item.attributeImportance}% Attributes +{' '}
                        {item.rankingImportance}% Ranking
                      </Text>

                      <Text style={myStyles.savedRankingDate}>
                        {formatSavedDate(item.savedAt)} ·{' '}
                        {item.totalResults || 0} results
                      </Text>
                    </View>

                    <View style={myStyles.datasetPill}>
                      <Text style={myStyles.datasetPillText}>
                        {String(item.datasetKey || item.dataset || datasetLabel)
                          .toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {item.resultsPreview?.length ? (
                    <Text numberOfLines={2} style={myStyles.previewText}>
                      Preview:{' '}
                      {item.resultsPreview
                        .slice(0, 3)
                        .map((row) => row.name)
                        .join(', ')}
                      {item.resultsPreview.length > 3 ? '...' : ''}
                    </Text>
                  ) : null}

                  <View style={myStyles.savedRankingActions}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => onApply(item)}
                      style={myStyles.applyBtn}
                    >
                      <Text style={myStyles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => onDelete(item.id)}
                      style={myStyles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                      <Text style={myStyles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function InfoHelpModal({ visible, info, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={myStyles.modalOverlay}>
        <View style={myStyles.infoModalCard}>
          <View style={myStyles.modalHeader}>
            <View style={myStyles.infoTitleRow}>
              <View style={myStyles.infoModalIcon}>
                <Ionicons
                  name={info?.icon || 'information-circle-outline'}
                  size={20}
                  color={authTheme.colors.brandTeal}
                />
              </View>

              <Text style={myStyles.modalTitle}>
                {info?.title || 'Information'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={myStyles.closeBtn}>
              <Ionicons name="close-outline" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <Text style={myStyles.infoBodyText}>{info?.body}</Text>

          <View style={myStyles.infoPointsBox}>
            {(info?.points || []).map((point, index) => (
              <View key={`${point}-${index}`} style={myStyles.infoPointRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={authTheme.colors.brandTeal}
                />

                <Text style={myStyles.infoPointText}>{point}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={myStyles.infoGotItBtn}
          >
            <Text style={myStyles.infoGotItText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}