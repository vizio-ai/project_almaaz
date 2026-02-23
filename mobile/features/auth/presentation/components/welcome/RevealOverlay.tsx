import React, { useRef, useEffect } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { useThemeColor } from '@shared/ui-kit';

export function RevealOverlay() {
  const { width, height } = useWindowDimensions();
  const R = Math.ceil(Math.sqrt(width * width + height * height));
  const progress = useRef(new Animated.Value(0)).current;
  const accent = useThemeColor('accent');

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const opacity = progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.circle,
        {
          backgroundColor: accent,
          width: R * 2,
          height: R * 2,
          borderRadius: R,
          right: -R,
          top: -R,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
  },
});
