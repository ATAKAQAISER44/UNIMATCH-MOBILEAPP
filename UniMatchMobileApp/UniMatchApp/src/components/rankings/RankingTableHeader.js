
// src/components/rankings/RankingTableHeader.js

import React, { memo } from 'react';
import { View, Text } from 'react-native';

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
        <View style={styles.tableCheckBox}>
          <Text style={styles.tableCheck}>✓</Text>
        </View>

        <Text style={styles.tableTitle}>{title}</Text>
      </View>

      <Text style={styles.tableMeta}>
        Page <Text style={styles.metaStrong}>{page}</Text> of{' '}
        <Text style={styles.metaStrong}>{totalPages}</Text>
        {'  |  '}
        Total results: <Text style={styles.metaStrong}>{totalResults}</Text>
      </Text>
    </View>
  );
});

export default RankingTableHeader;