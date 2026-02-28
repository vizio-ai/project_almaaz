import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AppLogo } from '@shared/ui-kit';
import { FollowUser } from '../../domain/entities/FollowUser';
import { AppHeader, useThemeColor } from '@shared/ui-kit';
import { useFollowList } from '../hooks/useFollowList';
import { useFollow } from '../hooks/useFollow';
import { useFollowDependencies } from '../../di/useFollowDependencies';

type Tab = 'following' | 'followers';

interface FollowConnectionsScreenProps {
  userId: string;
  currentUserId: string;
  initialTab: Tab;
  onBack: () => void;
  onUserPress?: (userId: string) => void;
}

interface UserActionButtonProps {
  currentUserId: string;
  targetUserId: string;
  mode: Tab;
}

function UserActionButton({ currentUserId, targetUserId, mode }: UserActionButtonProps) {
  const { unfollowUserUseCase } = useFollowDependencies();
  const { isFollowing, isLoading: followLoading, toggleFollow } = useFollow(currentUserId, targetUserId);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removed, setRemoved] = useState(false);

  const handleRemove = useCallback(async () => {
    setRemoveLoading(true);
    const result = await unfollowUserUseCase.execute({
      followerId: targetUserId,
      followingId: currentUserId,
    });
    if (result.success) setRemoved(true);
    setRemoveLoading(false);
  }, [targetUserId, currentUserId, unfollowUserUseCase]);

  if (mode === 'followers') {
    if (removed) return null;
    return (
      <TouchableOpacity
        onPress={handleRemove}
        disabled={removeLoading}
        activeOpacity={0.7}
        style={styles.actionBtn}
      >
        <AppText style={styles.actionBtnText}>Remove</AppText>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={toggleFollow}
      disabled={followLoading}
      activeOpacity={0.7}
      style={styles.actionBtn}
    >
      <AppText style={styles.actionBtnText}>
        {isFollowing ? 'Unfollow' : 'Follow'}
      </AppText>
    </TouchableOpacity>
  );
}

export function FollowConnectionsScreen({
  userId,
  currentUserId,
  initialTab,
  onBack,
  onUserPress,
}: FollowConnectionsScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const { users: followers, isLoading: followersLoading } = useFollowList(userId, 'followers');
  const { users: following, isLoading: followingLoading } = useFollowList(userId, 'following');

  const currentUsers = activeTab === 'followers' ? followers : following;
  const isLoading = activeTab === 'followers' ? followersLoading : followingLoading;

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return currentUsers;
    const q = searchQuery.toLowerCase();
    return currentUsers.filter(u => {
      const name = [u.name, u.surname].filter(Boolean).join(' ').toLowerCase();
      return name.includes(q);
    });
  }, [currentUsers, searchQuery]);

  const countLabel =
    activeTab === 'followers'
      ? `${followers.length} Followers`
      : `${following.length} Following`;

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      {/* Header */}
      <AppHeader
        variant="dark"
        left={
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabWrap}>
        <View style={styles.tabRow}>
          {(['following', 'followers'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <AppText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'following' ? 'Following' : 'Followers'}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#71717A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Count */}
      <View style={styles.countWrap}>
        <AppText style={styles.countText}>{countLabel}</AppText>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0A0A0A" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: FollowUser }) => (
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
              <AppText style={styles.name} numberOfLines={1}>
                {[item.name, item.surname].filter(Boolean).join(' ') || 'Traveler'}
              </AppText>
              <UserActionButton currentUserId={currentUserId} targetUserId={item.id} mode={activeTab} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { marginRight: 12 },
  tabWrap: {
    alignItems: 'center',
    paddingTop: 16,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 186,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    gap: 4,
  },
  tab: {
    width: 88,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#0A0A0A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0A0A0A',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  searchWrap: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  searchBar: {
    height: 36,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0A0A0A',
    padding: 0,
  },
  countWrap: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  countText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40 },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#171717',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E4E4E7',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181B',
  },
});
