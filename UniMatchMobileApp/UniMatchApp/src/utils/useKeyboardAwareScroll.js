// src/utils/useKeyboardAwareScroll.js
//
// Keeps the focused text field visible above the keyboard in a ScrollView.
// The app is edge-to-edge, so on Android the window is not resized when the
// keyboard opens (and on iOS it never is). This adds the keyboard's height as
// extra space under the content and scrolls the focused field into view.
//
//   const keyboard = useKeyboardAwareScroll(optionalOuterRef);
//   <ScrollView
//     ref={keyboard.ref}
//     onScroll={keyboard.onScroll}
//     scrollEventThrottle={32}
//     contentContainerStyle={[styles.content, keyboard.extraSpace(24)]}
//   />

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, TextInput } from 'react-native';

const GAP_ABOVE_KEYBOARD = 16;

export default function useKeyboardAwareScroll(outerRef) {
  const scroll = useRef(null);
  const scrollY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const ref = useCallback(
    (node) => {
      scroll.current = node;
      if (typeof outerRef === 'function') outerRef(node);
      else if (outerRef) outerRef.current = node;
    },
    [outerRef]
  );

  const onScroll = useCallback((event) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const revealFocusedInput = (height) => {
      const input = TextInput.State.currentlyFocusedInput?.();
      if (!input?.measureInWindow || !scroll.current) return;
      input.measureInWindow((x, y, width, inputHeight) => {
        const visibleBottom = Dimensions.get('window').height - height - GAP_ABOVE_KEYBOARD;
        const overlap = y + inputHeight - visibleBottom;
        if (overlap > 0) scroll.current?.scrollTo({ y: scrollY.current + overlap, animated: true });
      });
    };

    const show = Keyboard.addListener(showEvent, (event) => {
      const height = event?.endCoordinates?.height || 0;
      setKeyboardHeight(height);
      // Wait for the extra space to be laid out before scrolling.
      setTimeout(() => revealFocusedInput(height), Platform.OS === 'ios' ? 50 : 80);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Bottom padding to use while the keyboard is open (null when closed).
  const extraSpace = useCallback(
    (base = 24) => (keyboardHeight > 0 ? { paddingBottom: keyboardHeight + base } : null),
    [keyboardHeight]
  );

  return { ref, onScroll, keyboardHeight, extraSpace };
}
