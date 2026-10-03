
// src/components/dashboard/DashboardHeaderMenu.js

import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { dashboardStyles as styles } from '../../styles/dashboardStyles';
import { authTheme } from '../../styles/authTheme';

const DashboardHeaderMenu = memo(function DashboardHeaderMenu({
  visible,
  onClose,
  onDashboard,
  onProfile,
  onLogout,
}) {
  const handleDashboardPress = () => {
    onClose?.();
    onDashboard?.();
  };

  const handleProfilePress = () => {
    onClose?.();
    onProfile?.();
  };

  const handleLogoutPress = () => {
    onClose?.();
    onLogout?.();
  };

  const menuItems = useMemo(
    () => [
      {
        label: 'Dashboard',
        icon: 'home-outline',
        color: authTheme.colors.brandTeal,
        iconBoxStyle: null,
        textStyle: styles.menuText,
        itemStyle: null,
        onPress: handleDashboardPress,
      },
      {
        label: 'Profile',
        icon: 'person-circle-outline',
        color: authTheme.colors.brandGreen || authTheme.colors.brandTeal,
        iconBoxStyle: styles.profileMenuIconBox,
        textStyle: styles.menuText,
        itemStyle: null,
        onPress: handleProfilePress,
      },
      {
        label: 'Logout',
        icon: 'log-out-outline',
        color: '#DC2626',
        iconBoxStyle: styles.logoutIconBox,
        textStyle: styles.logoutText,
        itemStyle: styles.logoutItem,
        onPress: handleLogoutPress,
      },
    ],
    [onDashboard, onProfile, onLogout, onClose]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <Pressable
          style={styles.menuCard}
          onPress={(event) => event.stopPropagation()}
        >
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              {index === menuItems.length - 1 && (
                <View style={styles.menuDivider} />
              )}

              <TouchableOpacity
                style={[styles.menuItem, item.itemStyle]}
                activeOpacity={0.85}
                onPress={item.onPress}
              >
                <View style={[styles.menuIconBox, item.iconBoxStyle]}>
                  <Ionicons name={item.icon} size={17} color={item.color} />
                </View>

                <Text style={item.textStyle}>{item.label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
});

export default DashboardHeaderMenu;