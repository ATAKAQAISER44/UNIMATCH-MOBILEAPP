
// src/components/rankings/my-ranking/MyRankingScreen.js

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bottomPadding } from '../../../utils/safeArea';

import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import RankingsHero from '../RankingsHero';
import RankingTabs from '../RankingTabs';

import { authTheme } from '../../../styles/authTheme';
import { rankingsStyles as styles } from '../../../styles/rankingsStyles';
import { myRankingStyles as myStyles } from '../../../styles/myRankingStyles';

import { MY_PAGE_SIZE } from '../../../constants/myRankingConstants';

import { formatScore, getLabelByKey } from '../../../utils/myRankingUtils';

import { getUniversityKey } from '../../../utils/rankingsUtils';

export default function MyRankingScreen({
  config,
  activeTab,
  handleTabPress,
  summaryCards,
  compareList,

  importanceSelected,
  rankingImportanceNumber,
  attributeImportance,
  handleImportanceChange,

  isRankingOnly,
  isAttributeOnly,
  isMixed,
  showRankingSection,
  showAttributeSection,

  visibleRankingItems,
  availableRankingItems,
  visibleAttributeItems,
  availableAttributeItems,

  rankingWeights,
  attributeWeights,
  rankingWeightsOpen,
  attributeWeightsOpen,
  setRankingWeightsOpen,
  setAttributeWeightsOpen,

  selectedRankingToAdd,
  selectedAttributeToAdd,
  setChoiceModal,
  setSelectedRankingToAdd,
  setSelectedAttributeToAdd,

  updateRankingWeight,
  updateAttributeWeight,
  handleAddRankingMetric,
  handleRemoveRankingMetric,
  handleAddAttribute,
  handleRemoveAttribute,

  openInfo,

  fetchMyRanking,
  resetMyRanking,
  openSaveRankingModal,
  loadSavedRankings,
  setSavedRankingsModal,
  exportMyRankingCsv,

  myRankingLoading,
  myRankingError,
  myResults,
  paginatedMyResults,
  savedRankings,
  savedRankingMessage,
  exporting,

  myPage,
  setMyPage,
  myTotalPages,
  openBreakdownKey,
  setOpenBreakdownKey,

  isCompared,
  isSaved,
  setSelectedUni,
  handleToggleCompare,
  handleToggleSave,
}) {
  const insets = useSafeAreaInsets();
  const toggleBreakdown = useCallback(
    (cardKey) => {
      setOpenBreakdownKey((previous) => (previous === cardKey ? null : cardKey));
    },
    [setOpenBreakdownKey]
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.listContent,
        bottomPadding(insets, 120),
      ]}
    >
      <RankingsHero config={config} />

      <RankingTabs activeTab={activeTab} onTabPress={handleTabPress} />



      <View style={myStyles.controlCard}>
        <SectionTitle
          title="What matters more?"
          icon="options-outline"
        />

        <View style={myStyles.importanceGrid}>
          <View style={myStyles.importanceBox}>
            <Text style={myStyles.importanceLabel}>University Attributes</Text>
            <Text style={myStyles.importanceValue}>
              {importanceSelected ? `${attributeImportance}%` : '—'}
            </Text>
          </View>

          <View style={myStyles.importanceBox}>
            <Text style={myStyles.importanceLabel}>Ranking Metrics</Text>
            <Text style={myStyles.importanceValue}>
              {importanceSelected ? `${rankingImportanceNumber}%` : '—'}
            </Text>
          </View>
        </View>

        <View style={myStyles.sliderRow}>
          <Text style={myStyles.sliderSideText}>0%</Text>

          <Slider
            style={myStyles.weightSlider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={rankingImportanceNumber}
            minimumTrackTintColor={authTheme.colors.brandTeal}
            maximumTrackTintColor="#CBD5E1"
            thumbTintColor={authTheme.colors.brandTeal}
            onValueChange={(value) => handleImportanceChange(Math.round(value))}
          />

          <Text style={myStyles.sliderSideText}>100%</Text>
        </View>

        <Text style={myStyles.hintText}>
          Left = attributes only · Right = rankings only
        </Text>
      </View>

      {!importanceSelected && <InfoNotice tone="warning" text="Move the slider to start." />}

      {showRankingSection && (
        <CollapsibleWeightCard
          title="Ranking metrics"
          icon="podium-outline"
          count={visibleRankingItems.length}
          open={rankingWeightsOpen}
          onToggle={() => setRankingWeightsOpen((previous) => !previous)}
          onInfoPress={() => openInfo('ranking')}
          emptyText="Add at least one metric."
          items={visibleRankingItems}
          weights={rankingWeights}
          onChange={updateRankingWeight}
          onRemove={handleRemoveRankingMetric}
          addControl={
            <AddControl
              label="Add ranking metric"
              value={
                selectedRankingToAdd
                  ? getLabelByKey(availableRankingItems, selectedRankingToAdd)
                  : 'Choose metric'
              }
              disabled={availableRankingItems.length === 0}
              onChoose={() =>
                setChoiceModal({
                  title: 'Add Ranking Metric',
                  items: availableRankingItems,
                  onSelect: setSelectedRankingToAdd,
                })
              }
              onAdd={handleAddRankingMetric}
              canAdd={!!selectedRankingToAdd}
            />
          }
        />
      )}

      {showAttributeSection && (
        <CollapsibleWeightCard
          title="University attributes"
          icon="school-outline"
          count={visibleAttributeItems.length}
          open={attributeWeightsOpen}
          onToggle={() => setAttributeWeightsOpen((previous) => !previous)}
          onInfoPress={() => openInfo('attributes')}
          emptyText="Add at least one attribute."
          items={visibleAttributeItems}
          weights={attributeWeights}
          onChange={updateAttributeWeight}
          onRemove={handleRemoveAttribute}
          addControl={
            <AddControl
              label="Add university attribute"
              value={
                selectedAttributeToAdd
                  ? getLabelByKey(
                      availableAttributeItems,
                      selectedAttributeToAdd
                    )
                  : 'Choose attribute'
              }
              disabled={availableAttributeItems.length === 0}
              onChoose={() =>
                setChoiceModal({
                  title: 'Add University Attribute',
                  items: availableAttributeItems,
                  onSelect: setSelectedAttributeToAdd,
                })
              }
              onAdd={handleAddAttribute}
              canAdd={!!selectedAttributeToAdd}
            />
          }
        />
      )}

      <View style={myStyles.actionCard}>
        <TouchableOpacity
          activeOpacity={0.88}
          disabled={!importanceSelected || myRankingLoading}
          onPress={fetchMyRanking}
          style={[
            myStyles.primaryAction,
            (!importanceSelected || myRankingLoading) &&
              myStyles.disabledAction,
          ]}
        >
          <LinearGradient
            colors={authTheme.gradients.button}
            style={myStyles.actionGradient}
          >
            {myRankingLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="calculator-outline" size={17} color="#FFFFFF" />
                <Text style={myStyles.primaryActionText}>Compute My Ranking</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={myStyles.actionGrid}>
          <SmallActionButton
            label="Reset"
            icon="refresh-outline"
            onPress={resetMyRanking}
          />

          <SmallActionButton
            label="Save Ranking"
            icon="bookmark-outline"
            disabled={!myResults.length}
            onPress={openSaveRankingModal}
          />

          <SmallActionButton
            label={`Saved (${savedRankings.length})`}
            icon="folder-open-outline"
            onPress={() => {
              loadSavedRankings();
              setSavedRankingsModal(true);
            }}
          />

          <SmallActionButton
            label="Export"
            icon="download-outline"
            disabled={!myResults.length || exporting}
            onPress={() =>
              exportMyRankingCsv(myResults, 'my-ranking-complete-results')
            }
          />
        </View>

        {savedRankingMessage ? (
          <Text style={myStyles.successMessage}>{savedRankingMessage}</Text>
        ) : null}
      </View>

      {myRankingError ? (
        <View style={myStyles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
          <Text style={myStyles.errorText}>{myRankingError}</Text>
        </View>
      ) : null}

      <View style={myStyles.resultsHeaderCard}>
        <View>
          <Text style={myStyles.resultsTitle}>My Ranking</Text>
          {myResults.length ? (
            <Text style={myStyles.resultsSub}>{myResults.length} universities</Text>
          ) : null}
        </View>

        {myResults.length ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              exportMyRankingCsv(paginatedMyResults, 'my-ranking-current-page')
            }
            style={myStyles.exportPageBtn}
          >
            <Ionicons
              name="share-outline"
              size={15}
              color={authTheme.colors.brandTeal}
            />
            <Text style={myStyles.exportPageText}>Page CSV</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!myRankingLoading && importanceSelected && !myResults.length ? (
        <View style={myStyles.emptyMyBox}>
          <Ionicons
            name="analytics-outline"
            size={26}
            color={authTheme.colors.brandTeal}
          />

          <Text style={myStyles.emptyMyTitle}>Tap Compute My Ranking</Text>
        </View>
      ) : null}

      {paginatedMyResults.map((item, index) => {
        const cardKey = `${getUniversityKey(item)}-${item?.my_rank || index}`;

        return (
          <MyRankingResultCard
            key={cardKey}
            item={item}
            cardKey={cardKey}
            open={openBreakdownKey === cardKey}
            compared={isCompared(item)}
            saved={isSaved(item)}
            // PERF: stable handlers so memoized cards skip re-rendering while
            // weight sliders are dragged (each drag step re-renders this
            // screen).
            onToggleOpen={toggleBreakdown}
            onDetails={setSelectedUni}
            onCompare={handleToggleCompare}
            onSave={handleToggleSave}
          />
        );
      })}

      {myResults.length > MY_PAGE_SIZE ? (
        <View style={myStyles.myPagination}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={myPage <= 1}
            style={[myStyles.myPageBtn, myPage <= 1 && myStyles.myPageDisabled]}
            onPress={() => {
              setMyPage((previous) => Math.max(previous - 1, 1));
              setOpenBreakdownKey(null);
            }}
          >
            <Text style={myStyles.myPageBtnText}>Previous</Text>
          </TouchableOpacity>

          <Text style={myStyles.myPageText}>
            Page {myPage} / {myTotalPages}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={myPage >= myTotalPages}
            style={[
              myStyles.myPageBtn,
              myPage >= myTotalPages && myStyles.myPageDisabled,
            ]}
            onPress={() => {
              setMyPage((previous) => Math.min(previous + 1, myTotalPages));
              setOpenBreakdownKey(null);
            }}
          >
            <Text style={myStyles.myPageBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

function SectionTitle({ title, subtitle, icon }) {
  return (
    <View style={myStyles.sectionTitleRow}>
      <View style={myStyles.sectionIcon}>
        <Ionicons name={icon} size={17} color={authTheme.colors.brandTeal} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={myStyles.sectionTitle}>{title}</Text>

        {subtitle ? (
          <Text style={myStyles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

function InfoNotice({ text, tone = 'info' }) {
  const warning = tone === 'warning';

  return (
    <View style={[myStyles.noticeBox, warning && myStyles.warningNotice]}>
      <Ionicons
        name={warning ? 'information-circle-outline' : 'checkmark-circle-outline'}
        size={18}
        color={warning ? '#B45309' : authTheme.colors.brandTeal}
      />

      <Text style={[myStyles.noticeText, warning && myStyles.warningText]}>
        {text}
      </Text>
    </View>
  );
}

function InfoMiniButton({ onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={myStyles.infoMiniButton}
    >
      <Ionicons
        name="information-circle-outline"
        size={15}
        color={authTheme.colors.brandTeal}
      />
    </TouchableOpacity>
  );
}

function CollapsibleWeightCard({
  title,
  subtitle,
  icon,
  count,
  open,
  onToggle,
  onInfoPress,
  emptyText,
  items,
  weights,
  onChange,
  onRemove,
  addControl,
}) {
  return (
    <View style={myStyles.controlCard}>
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={onToggle}
        style={myStyles.collapsibleHeader}
      >
        <View style={myStyles.sectionTitleRowCompact}>
          <View style={myStyles.sectionIcon}>
            <Ionicons name={icon} size={17} color={authTheme.colors.brandTeal} />
          </View>

          <View style={myStyles.collapsibleTitleBlock}>
            <View style={myStyles.titleWithInfoRow}>
              <Text style={myStyles.sectionTitle}>{title}</Text>

              {onInfoPress ? <InfoMiniButton onPress={onInfoPress} /> : null}
            </View>

            {subtitle ? (
              <Text style={myStyles.sectionSubtitle}>{subtitle}</Text>
            ) : null}
          </View>
        </View>

        <View style={myStyles.hideShowBtn}>
          <Text style={myStyles.hideShowText}>{open ? 'Hide' : 'Show'}</Text>
          <Ionicons
            name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={16}
            color={authTheme.colors.brandTeal}
          />
        </View>
      </TouchableOpacity>

      {count === 0 ? (
        <View style={myStyles.inlineErrorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
          <Text style={myStyles.inlineErrorText}>{emptyText}</Text>
        </View>
      ) : null}

      {open ? (
        <View style={myStyles.collapsibleBody}>
          <WeightSection
            items={items}
            weights={weights}
            onChange={onChange}
            onRemove={onRemove}
          />

          {addControl}
        </View>
      ) : null}
    </View>
  );
}

function WeightSection({ items, weights, onChange, onRemove }) {
  return (
    <View>
      {(items || []).map((item) => {
        const currentValue = Number(weights?.[item.key] || 0);

        return (
          <View key={item.key} style={myStyles.weightCard}>
            <View style={myStyles.weightHeader}>
              <View style={{ flex: 1 }}>
                <Text style={myStyles.weightTitle}>{item.label}</Text>

                {item.helper ? (
                  <Text style={myStyles.weightHelper}>{item.helper}</Text>
                ) : null}

                {item.weight ? (
                  <Text style={myStyles.weightHelper}>
                    Official default: {item.weight}
                  </Text>
                ) : null}
              </View>

              <View style={myStyles.weightValueBox}>
                <Text style={myStyles.weightValue}>{currentValue}%</Text>
              </View>

              {onRemove ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => onRemove(item.key)}
                  style={myStyles.removeBtn}
                >
                  <Ionicons name="trash-outline" size={15} color="#DC2626" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={myStyles.sliderRow}>
              <Text style={myStyles.sliderSideText}>0%</Text>

              <Slider
                style={myStyles.weightSlider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={currentValue}
                minimumTrackTintColor={authTheme.colors.brandTeal}
                maximumTrackTintColor="#CBD5E1"
                thumbTintColor={authTheme.colors.brandTeal}
                onValueChange={(value) => onChange(item.key, Math.round(value))}
              />

              <Text style={myStyles.sliderSideText}>100%</Text>
            </View>

            <Text style={myStyles.sliderHintText}>
              Swipe the bar to adjust this weight. Current value: {currentValue}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function AddControl({ label, value, disabled, onChoose, onAdd, canAdd }) {
  return (
    <View style={myStyles.addBox}>
      <Text style={myStyles.addLabel}>{label}</Text>

      <View style={myStyles.addRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={disabled}
          onPress={onChoose}
          style={[myStyles.selectBtn, disabled && myStyles.disabledSelect]}
        >
          <Text
            numberOfLines={1}
            style={[myStyles.selectText, disabled && myStyles.disabledText]}
          >
            {disabled ? 'No more options' : value}
          </Text>

          <Ionicons
            name="chevron-down-outline"
            size={16}
            color={authTheme.colors.brandTeal}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!canAdd}
          onPress={onAdd}
          style={[myStyles.addBtn, !canAdd && myStyles.addBtnDisabled]}
        >
          <Text style={myStyles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SmallActionButton({ label, icon, onPress, disabled }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[myStyles.smallAction, disabled && myStyles.smallActionDisabled]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={disabled ? authTheme.colors.gray500 : authTheme.colors.brandTeal}
      />

      <Text
        style={[
          myStyles.smallActionText,
          disabled && myStyles.smallActionTextDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// PERF: memo() + handlers that receive the item/key, so cards only
// re-render when their own data or compare/save/open state changes.
const MyRankingResultCard = memo(function MyRankingResultCard({
  item,
  cardKey,
  open,
  compared,
  saved,
  onToggleOpen,
  onDetails,
  onCompare,
  onSave,
}) {
  const explanations = Array.isArray(item?.explanation) ? item.explanation : [];

  const handleDetails = () => onDetails?.(item);
  const handleCompare = () => onCompare?.(item);
  const handleSave = () => onSave?.(item);
  const handleToggleOpen = () => onToggleOpen?.(cardKey);

  return (
    <View style={myStyles.resultCard}>
      <View style={myStyles.resultTopRow}>
        <View style={myStyles.rankBadge}>
          <Text style={myStyles.rankBadgeLabel}>Rank</Text>

          <Text style={myStyles.rankBadgeValue}>
            #{item?.my_rank || item?.current_rank || '—'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleDetails}
          style={myStyles.resultTitleBox}
        >
          <Text numberOfLines={2} style={myStyles.resultName}>
            {item?.name || item?.university_name || 'University'}
          </Text>

          <Text style={myStyles.resultCountry}>{item?.country || '—'}</Text>
        </TouchableOpacity>
      </View>

      <View style={myStyles.scorePills}>
        <ScorePill
          label="Official"
          value={item?.official_rank ? `#${item.official_rank}` : 'N/A'}
        />

        <ScorePill label="Final" value={formatScore(item?.final_score)} />
        <ScorePill label="Ranking" value={formatScore(item?.ranking_score)} />

        <ScorePill
          label="Attribute"
          value={formatScore(item?.attribute_score)}
        />
      </View>

      {explanations.length ? (
        <View style={myStyles.explanationBox}>
          {explanations.slice(0, 4).map((reason, index) => (
            <View
              key={`${cardKey}-reason-${index}`}
              style={myStyles.reasonChip}
            >
              <Ionicons
                name="checkmark-circle"
                size={13}
                color={authTheme.colors.brandTeal}
              />

              <Text style={myStyles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={myStyles.cardActions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCompare}
          style={[myStyles.iconActionBtn, compared && myStyles.compareIconActive]}
        >
          <Ionicons
            name={compared ? 'checkmark-outline' : 'add-outline'}
            size={18}
            color={compared ? '#FFFFFF' : authTheme.colors.brandTeal}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          style={[myStyles.iconActionBtn, saved && myStyles.saveIconActive]}
        >
          <Ionicons
            name={saved ? 'star' : 'star-outline'}
            size={18}
            color={saved ? '#FFFFFF' : '#F59E0B'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleOpen}
          style={myStyles.breakdownBtn}
        >
          <Ionicons
            name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={14}
            color={authTheme.colors.brandTeal}
          />

          <Text style={myStyles.breakdownBtnText}>
            {open ? 'Hide' : 'Breakdown'}
          </Text>
        </TouchableOpacity>
      </View>

      {open ? (
        <View style={myStyles.breakdownWrap}>
          <BreakdownList
            title="Ranking Metric Breakdown"
            rows={item?.breakdown?.ranking || []}
          />

          <BreakdownList
            title="Attribute Breakdown"
            rows={item?.breakdown?.attributes || []}
          />
        </View>
      ) : null}
    </View>
  );
});

function ScorePill({ label, value }) {
  return (
    <View style={myStyles.scorePill}>
      <Text style={myStyles.scorePillLabel}>{label}</Text>
      <Text style={myStyles.scorePillValue}>{value}</Text>
    </View>
  );
}

function BreakdownList({ title, rows }) {
  return (
    <View style={myStyles.breakdownCard}>
      <Text style={myStyles.breakdownTitle}>{title}</Text>

      {!rows?.length ? (
        <Text style={myStyles.noBreakdownText}>No breakdown available.</Text>
      ) : (
        rows.map((row) => (
          <View key={row.key || row.label} style={myStyles.breakdownRow}>
            <View style={{ flex: 1 }}>
              <Text style={myStyles.breakdownLabel}>{row.label}</Text>

              <Text style={myStyles.breakdownMeta}>
                score {formatScore(row.score)} × weight{' '}
                {formatScore(row.weight)}
              </Text>
            </View>

            <Text style={myStyles.breakdownContribution}>
              {formatScore(row.contribution)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}