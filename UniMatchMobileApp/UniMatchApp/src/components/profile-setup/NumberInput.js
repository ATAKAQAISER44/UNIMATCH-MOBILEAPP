
// src/components/profile-setup/NumberInput.js

import React from 'react';
import { View, Text, TextInput } from 'react-native';

import { profileSetupStyles as styles } from '../../styles/profileSetupStyles';

export default function NumberInput({ label, value, onChangeText, placeholder = '0' }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.amountInputWrap}>
        <Text style={styles.amountPrefix}>$</Text>

        <TextInput
          style={styles.amountInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8A9AB0"
          keyboardType="numeric"
        />
      </View>
    </View>
  );
}