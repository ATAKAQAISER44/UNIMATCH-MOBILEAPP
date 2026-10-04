// src/utils/safeArea.js
//
// Padding helpers that keep content clear of notches, status bars, the
// home indicator and side navigation bars (Android tablets / landscape).

// Top bars run under the status bar; their content starts below it.
export function topBarPadding(insets, horizontal = 12) {
  return {
    paddingTop: insets.top + 10,
    paddingLeft: horizontal + insets.left,
    paddingRight: horizontal + insets.right,
  };
}

// Scrolling content ends above the home indicator / navigation bar.
export function bottomPadding(insets, base = 24) {
  return { paddingBottom: base + insets.bottom };
}
