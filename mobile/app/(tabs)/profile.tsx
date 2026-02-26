import React, { useState, useEffect } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@shared/auth';
import { useProfile, ProfileScreen as ProfileScreenComponent, EditProfileScreen } from '@shared/profile';
import { useSession } from '@shared/auth';

export default function ProfileTab() {
  const { session, setSession } = useSession();
  const { logout } = useAuth();
  const router = useRouter();
  const { profile, isLoading, error, clearError, refresh, updateProfile, uploadAvatar } = useProfile(session?.user.id);

  const [isEditing, setIsEditing] = useState(false);

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
