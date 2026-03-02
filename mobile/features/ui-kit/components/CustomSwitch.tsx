import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';

const TRACK_WIDTH = 36;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 16;
const PADDING = 2;
const THUMB_TRAVEL = TRACK_WIDTH - PADDING * 2 - THUMB_SIZE;

export interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  trackColorOff?: string;
  trackColorOn?: string;
  thumbColor?: string;
}

export function CustomSwitch({
  value,
  onValueChange,
  trackColorOff = '#E4E4E7',
  trackColorOn = '#18181B',
  thumbColor = '#FFFFFF',
}: CustomSwitchProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  const thumbLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [PADDING, PADDING + THUMB_TRAVEL],
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? trackColorOn : trackColorOff,
            width: TRACK_WIDTH,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: thumbColor,
              transform: [{ translateX: thumbLeft }],
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
    paddingHorizontal: PADDING,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
