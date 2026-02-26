import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, colors, spacing, typography, radii } from '@shared/ui-kit';
import { FollowUser } from '../../domain/entities/FollowUser';

interface FollowListScreenProps {
  title: string;
  users: FollowUser[];
  isLoading: boolean;
  onBack: () => void;
  onUserPress?: (userId: string) => void;
}

export function FollowListScreen({
  title,
  users,
  isLoading,
  onBack,
  onUserPress,
}: FollowListScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.light.mainText} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>{title}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.light.mainText} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <AppText style={styles.emptyText}>No users yet.</AppText>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={onUserPress ? 0.7 : 1}
              onPress={() => onUserPress?.(item.id)}
            >
              <View style={styles.avatar}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <AppText style={styles.avatarInitials}>
                    {(item.name?.[0] ?? '').toUpperCase()}
                    {(item.surname?.[0] ?? '').toUpperCase()}
                  </AppText>
                )}
              </View>
              <AppText style={styles.name}>
                {[item.name, item.surname].filter(Boolean).join(' ') || 'Traveler'}
              </AppText>
              {onUserPress && (
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.light.subText}
                />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.borderMuted,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...typography.lg,
    fontWeight: typography.weights.semibold,
    color: colors.light.mainText,
  },
  headerSpacer: { width: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...typography.sm, color: colors.light.subText },
  list: { paddingHorizontal: spacing['2xl'] },
  separator: { height: 1, backgroundColor: colors.light.borderMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.light.mainText,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarInitials: {
    ...typography.sm,
    fontWeight: typography.weights.bold,
    color: colors.light.background,
  },
  name: {
    flex: 1,
    ...typography.sm,
    fontWeight: typography.weights.medium,
    color: colors.light.mainText,
  },
});
