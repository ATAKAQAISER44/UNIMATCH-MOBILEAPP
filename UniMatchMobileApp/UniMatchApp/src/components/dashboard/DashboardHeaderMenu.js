// src/components/dashboard/DashboardHeaderMenu.js
//
// The student screens' menu (Dashboard, Rankings, Smart Match). It now opens
// the shared role side menu (components/app/AppMenu): Dashboard, Search
// Universities, Compare Universities, Saved Universities, My Shortlist,
// Profile and Logout - the same items as the web sidebar.
// The old onDashboard / onProfile / onLogout props are no longer needed;
// AppMenu navigates and logs out itself.

import React, { memo } from 'react';

import AppMenu from '../app/AppMenu';

const DashboardHeaderMenu = memo(function DashboardHeaderMenu({ visible, onClose, activeKey = 'dashboard' }) {
  return <AppMenu visible={visible} onClose={onClose} activeKey={activeKey} />;
});

export default DashboardHeaderMenu;
