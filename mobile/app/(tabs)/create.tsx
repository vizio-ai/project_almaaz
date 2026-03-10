import React, { useState, useRef, useCallback } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { DoraConversationScreen } from '@shared/itinerary';
import { ManualItineraryScreen, type ManualItineraryScreenRef } from '@shared/manual-itinerary';
import { AppHeader, AppText } from '@shared/ui-kit';
import { BlurView } from 'expo-blur';
import ChatHistorySvg from '../../assets/images/chat_history.svg';

const HEADER_ICON_COLOR = '#FFFFFF';

type ViewMode = 'chat' | 'manual' | 'ai-itinerary';

export default function CreateScreen() {
  const { session } = useSession();
  const { profile } = useProfile(session?.user.id);
  const router = useRouter();
  const { fromOnboarding } = useLocalSearchParams<{ fromOnboarding?: string }>();
  const [showDialog, setShowDialog] = useState(fromOnboarding === 'true');
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [aiItineraryId, setAiItineraryId] = useState<string | null>(null);
  const [aiItineraryKey, setAiItineraryKey] = useState(0);
  const manualScreenRef = useRef<ManualItineraryScreenRef>(null);
  const aiItineraryRef = useRef<ManualItineraryScreenRef>(null);

  const handleHistoryPress = () => {
    // TODO: open past chats
  };

  const handleToggleManualEntry = () => {
    if (viewMode === 'manual') {
      manualScreenRef.current?.requestClose();
    } else {
      setViewMode('manual');
    }
  };

  const handleSwitchToChat = () => {
    setViewMode('chat');
  };

  const handleSwitchToItinerary = useCallback(() => {
    if (aiItineraryId) {
      setViewMode('ai-itinerary');
    }
  }, [aiItineraryId]);

  const handleItineraryCreated = useCallback((itineraryId: string) => {
    setAiItineraryId(itineraryId);
    setAiItineraryKey((k) => k + 1);
  }, []);

  const handleItineraryModified = useCallback(() => {
    setAiItineraryKey((k) => k + 1);
  }, []);

  // Header content based on view mode
  const renderHeader = () => {
    if (viewMode === 'manual') return null; // ManualItineraryScreen has its own header

    if (viewMode === 'ai-itinerary') {
      return (
        <AppHeader
          variant="dark"
          right={
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={handleSwitchToChat}
                activeOpacity={0.8}
                style={styles.headerPrimaryBtn}
              >
                <Ionicons name="sparkles" size={16} color={HEADER_ICON_COLOR} />
                <AppText style={styles.headerPrimaryLabel}>AI Chat</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleHistoryPress}
                activeOpacity={0.8}
                style={styles.headerIconBtn}
              >
                <ChatHistorySvg width={16} height={16} color={HEADER_ICON_COLOR} />
              </TouchableOpacity>
            </View>
          }
        />
      );
    }

    // Chat mode
    return (
      <AppHeader
        variant="dark"
        right={
          <View style={styles.headerRight}>
            {aiItineraryId ? (
              <TouchableOpacity
                onPress={handleSwitchToItinerary}
                activeOpacity={0.8}
                style={styles.headerPrimaryBtn}
              >
                <Ionicons name="map-outline" size={16} color={HEADER_ICON_COLOR} />
                <AppText style={styles.headerPrimaryLabel}>Itinerary</AppText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleToggleManualEntry}
                activeOpacity={0.8}
                style={styles.headerPrimaryBtn}
              >
                <Ionicons name="map-outline" size={16} color={HEADER_ICON_COLOR} />
                <AppText style={styles.headerPrimaryLabel}>Itinerary</AppText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleHistoryPress}
              activeOpacity={0.8}
              style={styles.headerIconBtn}
            >
              <ChatHistorySvg width={16} height={16} color={HEADER_ICON_COLOR} />
            </TouchableOpacity>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.root}>
      {renderHeader()}
      <View style={styles.content}>
        {/* Manual Itinerary (create mode) */}
        <View style={{ flex: 1, display: viewMode === 'manual' ? 'flex' : 'none' }}>
          <ManualItineraryScreen
            ref={manualScreenRef}
            itineraryId={null}
            userId={session?.user.id ?? ''}
            currentUserName={profile?.name}
            currentUserAvatarUrl={profile?.avatarUrl}
            showHeader={false}
            onBack={() => setViewMode('chat')}
          />
        </View>

        {/* AI-generated Itinerary (view/edit mode) */}
        <View style={{ flex: 1, display: viewMode === 'ai-itinerary' ? 'flex' : 'none' }}>
          {aiItineraryId && (
            <ManualItineraryScreen
              key={`ai-${aiItineraryKey}`}
              ref={aiItineraryRef}
              itineraryId={aiItineraryId}
              userId={session?.user.id ?? ''}
              currentUserName={profile?.name}
              currentUserAvatarUrl={profile?.avatarUrl}
              showHeader={false}
              onBack={handleSwitchToChat}
            />
          )}
        </View>

        {/* AI Chat */}
        <View style={{ flex: 1, display: viewMode === 'chat' ? 'flex' : 'none' }}>
          <DoraConversationScreen
            userName={profile?.name}
            userId={session?.user.id}
            persona={profile?.persona}
            isOnboarding={fromOnboarding === 'true'}
            onFinish={() => router.navigate('/(tabs)')}
            hideHeader
            onItineraryCreated={handleItineraryCreated}
            onSwitchToItinerary={handleSwitchToItinerary}
            onItineraryModified={handleItineraryModified}
          />
        </View>
      </View>

      <Modal visible={showDialog} transparent animationType="fade">
        <BlurView intensity={20} tint="dark" style={styles.scrim}>
          <View style={styles.dialog}>
            <AppText style={styles.title}>I want to...</AppText>
            <View style={styles.options}>
              <TouchableOpacity onPress={() => setShowDialog(false)}>
                <AppText style={styles.option}>... plan a trip</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowDialog(false);
                  router.navigate('/(tabs)/my-trips');
                }}
              >
                <AppText style={styles.option}>... log my past trip</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowDialog(false);
                  router.navigate('/(tabs)/discover');
                }}
              >
                <AppText style={styles.option}>... explore ideas</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowDialog(false);
                  router.navigate('/(tabs)');
                }}
              >
                <AppText style={styles.option}>... decide this later</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  headerPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerPrimaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 16,
  },
  options: {
    gap: 10,
  },
  option: {
    fontSize: 14,
    fontWeight: '400',
    color: '#18181B',
    textDecorationLine: 'underline',
  },
});
