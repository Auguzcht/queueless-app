import { useEffect } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(800);

  useEffect(() => {
    if (visible) {
      // Backdrop fades in immediately
      backdropOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
      // Card slides up with a slight delay
      translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(800, { duration: 250 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View style={backdropStyle} className="absolute inset-0">
          <Pressable className="flex-1 bg-black/40" onPress={onClose} />
        </Animated.View>
        <Animated.View style={sheetStyle} className="bg-white rounded-t-3xl px-6 pt-2 pb-10">
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
