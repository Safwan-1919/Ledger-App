import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, layout } from '@/theme/tokens';

function Bone({ style }: { style?: ViewStyle }) {
  const translateX = useSharedValue(-200);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(400, { duration: 900, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[boneBase, style]}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, anim]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

const boneBase: ViewStyle = {
  backgroundColor: '#e5e5e5',
  overflow: 'hidden',
};

export function SkeletonCard() {
  return (
    <View style={skeletonCard}>
      <Bone style={{ height: 10, width: 60, marginBottom: spacing.sm }} />
      <Bone style={{ height: 22, width: 140, marginBottom: spacing.md }} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Bone style={{ height: 36, flex: 1 }} />
        <Bone style={{ height: 36, flex: 1 }} />
      </View>
    </View>
  );
}

const skeletonCard: ViewStyle = {
  borderWidth: layout.borderWidth,
  borderColor: colors.line,
  backgroundColor: colors.white,
  padding: spacing.lg,
};

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={skeletonRow}>
          <Bone style={{ width: 40, height: 40 }} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Bone style={{ height: 14, width: '70%' }} />
            <Bone style={{ height: 10, width: '40%' }} />
          </View>
          <Bone style={{ height: 14, width: 60 }} />
        </View>
      ))}
    </View>
  );
}

const skeletonRow: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.md,
  borderWidth: layout.borderWidth,
  borderColor: colors.line,
  padding: spacing.md,
  backgroundColor: colors.white,
};
