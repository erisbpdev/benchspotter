import React from 'react';
import {
  Modal,
  View,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';

/**
 * A modal component that properly handles keyboard appearance
 * Prevents content from being hidden behind the keyboard
 */
export default function KeyboardAwareModal({
  visible,
  onClose,
  children,
  style,
  contentStyle,
  animationType = 'slide',
  transparent = true,
  // Set to true if content should scroll
  scrollable = true,
  // Overlay background color
  overlayColor = 'rgba(0,0,0,0.5)',
}) {
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent={transparent}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[{ flex: 1, backgroundColor: overlayColor }, style]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <TouchableWithoutFeedback>
              <View style={[{ flex: 1 }, contentStyle]}>
                {content}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
