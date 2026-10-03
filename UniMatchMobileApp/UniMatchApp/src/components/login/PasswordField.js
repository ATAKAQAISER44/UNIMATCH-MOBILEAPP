
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

import { COLORS } from '../../constants';
import { loginStyles as styles } from '../../styles/loginStyles';

export default function PasswordField({
  value,
  onChangeText,
  showPassword,
  onTogglePassword,
}) {
  return (
    <View style={styles.passwordSection}>
      <Text style={styles.passwordLabel}>Password</Text>

      <View style={styles.passwordInputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Enter your password"
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.passwordInput}
        />

        <TouchableOpacity
          onPress={onTogglePassword}
          style={styles.showBtn}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.showBtnText}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}