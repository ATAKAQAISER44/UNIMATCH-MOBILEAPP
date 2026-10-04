// src/components/AppText.js
//
// Text and TextInput used everywhere in the app instead of the react-native
// ones. They still follow the phone's text-size setting, but stop growing at
// MAX_FONT_SCALE: past that, labels, buttons and cards stop fitting on a
// phone screen. Any screen can still pass its own maxFontSizeMultiplier.

import React, { forwardRef } from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';

export const MAX_FONT_SCALE = 1.35;

export const Text = forwardRef(function Text(props, ref) {
  return <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} ref={ref} />;
});

export const TextInput = forwardRef(function TextInput(props, ref) {
  return <RNTextInput maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} ref={ref} />;
});
