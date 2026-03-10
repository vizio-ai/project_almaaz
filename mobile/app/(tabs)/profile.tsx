import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Share } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@shared/auth';
import { useProfile, ProfileScreen as ProfileScreenComponent, EditProfileScreen } from '@shared/profile';
import { useSession } from '@shared/auth';

export default function ProfileTab() {
  const { session, setSession } = useSession();
  const { logout } = useAuth();
  const router = useRouter();
  const { profile, isLoading, error, clearError, refresh, updateProfile, uploadAvatar } = useProfile(session?.user.id);

  const [isEditing, setIsEditing] = useState(false);
  // Skip the first focus event — useProfile already fetches on mount internally
  const isInitialFocus = useRef(true);

  // Refresh profile counts whenever this screen regains focus
  // (e.g. returning from followers/following screens)
  useFocusEffect(
    useCallback(() => {
      if (isInitialFocus.current) {
        isInitialFocus.current = false;
        return;
      }
      if (!isEditing) refresh();
    }, [isEditing, refresh]),
  );

  useEffect(() => {
    if (isEditing) refresh();
  }, [isEditing, refresh]);

  const handleLogout = async () => {
    await logout();
    setSession(null);
    router.replace('/auth');
  };

  const handleShareProfile = async () => {
    if (!profile) return;
    const displayName = [profile.name, profile.surname].filter(Boolean).join(' ') || 'Traveler';
    try {
      await Share.share({
        message: `Check out ${displayName}'s profile on dora!`,
        title: 'Share Profile',
      });
    } catch {
      // User cancelled or share failed
    }
  };

  if (isEditing && profile) {
    return (
      <EditProfileScreen
        profile={profile}
        isLoading={isLoading}
        error={error}
        onClearError={clearError}
        onSave={updateProfile}
        onUploadAvatar={uploadAvatar}
        onBack={() => setIsEditing(false)}
        onPhoneChanged={refresh}
      />
    );
  }

  return (
    <ProfileScreenComponent
      profile={profile}
      isLoading={isLoading}
      isOwnProfile={true}
      onRefresh={refresh}
      onEditPress={() => setIsEditing(true)}
      onSharePress={handleShareProfile}
      onLogout={handleLogout}
      onAdminDashboardPress={profile?.role === 'admin' ? () => router.push('/admin/dashboard') : undefined}
      onFollowersPress={() => router.push('/profile/followers')}
      onFollowingPress={() => router.push('/profile/following')}
    />
  );
}
