
// src/components/rankings/RankingTableHeader.js

import React, { memo } from 'react';
import {
  View,
} from 'react-native';
import { Text } from '../AppText';

import { rankingsStyles as styles } from '../../styles/rankingsStyles';

const RankingTableHeader = memo(function RankingTableHeader({
  title,
  page,
  totalPages,
  totalResults,
}) {
  return (
    <View style={styles.tableIntro}>
      <View style={styles.tableTitleRow}>
        <Text style={styles.tableTitle}>{title}</Text>
      </View>

      <Text style={styles.tableMeta}>
        <Text style={styles.metaStrong}>{totalResults}</Text> universities
        {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}
      </Text>
    </View>
  );
});

export default RankingTableHeader;