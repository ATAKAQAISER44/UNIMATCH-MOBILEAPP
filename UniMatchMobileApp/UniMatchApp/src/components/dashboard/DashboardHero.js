
// src/components/dashboard/DashboardHero.js

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

import { dashboardStyles as styles } from '../../styles/dashboardStyles';

const LOGO = require('../../../assets/images/icon.png');

const MiniProfileCard = memo(function MiniProfileCard({
  icon,
  label,
  value,
  highlighted = false,
  actionText,
  onPress,
}) {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[styles.miniCard, highlighted && styles.miniCardHighlighted]}
      activeOpacity={0.86}
      onPress={onPress}
    >
      <View
        style={[
          styles.miniIconBox,
          highlighted && styles.miniIconBoxHighlighted,
        ]}
      >
        <Text style={styles.miniIcon}>{icon}</Text>
      </View>

      <View style={styles.miniTextBlock}>
        <Text style={styles.miniLabel}>{label}</Text>

        <Text
          style={[styles.miniValue, highlighted && styles.miniValueHighlighted]}
          numberOfLines={2}
        >
          {value || '—'}
        </Text>

        {!!actionText && <Text style={styles.miniAction}>{actionText}</Text>}
      </View>

      {!!onPress && (
        <View style={styles.arrowPill}>
          <Text style={styles.arrowPillText}>→</Text>
        </View>
      )}
    </CardComponent>
  );
});

const DashboardHero = memo(function DashboardHero({
  profile,
  intendedLevel,
  mainPriority,
  recommendedSystem,
  recommendationJustification,
  onOpenRecommended,
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroHeaderRow}>
        <View style={styles.heroLogoWrap}>
          <Image source={LOGO} style={styles.heroLogo} resizeMode="contain" />
        </View>

      </View>

      <Text style={styles.welcomeTitle}>
        Welcome back
        {profile?.full_name ? (
          <Text style={styles.welcomeName}>, {profile.full_name}</Text>
        ) : null}
      </Text>


      <View style={styles.profileGrid}>
        <MiniProfileCard
          icon="🎓"
          label="Intended Level"
          value={intendedLevel}
        />

        <MiniProfileCard icon="🎯" label="Main Priority" value={mainPriority} />

        <MiniProfileCard
          icon="⭐"
          label="Recommended for you"
          value={recommendedSystem}
          highlighted
          onPress={onOpenRecommended}
        />
      </View>

      {!!recommendationJustification && (
        <View style={styles.justificationBox}>
          <Text style={styles.justificationTitle}>
            Why {recommendedSystem}?
          </Text>

          <Text style={styles.justificationText}>
            {recommendationJustification}
          </Text>
        </View>
      )}
    </View>
  );
});

export default DashboardHero;