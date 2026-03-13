import React, { useState, useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { DoraConversationScreen, useItineraryDependencies } from '@shared/itinerary';
import { ManualItineraryScreen, type ManualItineraryScreenRef } from '@shared/manual-itinerary';
import { AppHeader, AppText } from '@shared/ui-kit';
import { ChatHistoryModal } from '../../features/itinerary/presentation/components/ChatHistoryModal';
import ChatHistorySvg from '../../assets/images/chat_history.svg';
import type { ChatSession } from '../../features/itinerary/domain/entities/ChatSession';

const HEADER_ICON_COLOR = '#FFFFFF';

type ViewMode = 'chat' | 'ai-itinerary';

export default function CreateScreen() {
  const { session } = useSession();
  const { profile } = useProfile(session?.user.id);
  const router = useRouter();
  const { fromOnboarding, mode } = useLocalSearchParams<{ fromOnboarding?: string; mode?: string }>();
  const { getUserSessionsUseCase, chatRepository } = useItineraryDependencies();
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [aiItineraryId, setAiItineraryId] = useState<string | null>(null);
  const [aiItineraryKey, setAiItineraryKey] = useState(0);
  const [chatKey, setChatKey] = useState(0);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const aiItineraryRef = useRef<ManualItineraryScreenRef>(null);

  const handleHistoryPress = () => {
    setHistoryVisible(true);
  };

  const fetchSessions = useCallback(
    async (userId: string): Promise<ChatSession[]> => {
      const result = await getUserSessionsUseCase.execute(userId);
      return result.success ? result.data : [];
    },
    [getUserSessionsUseCase],
  );

  const handleDeleteSession = useCallback((sessionId: string) => {
    chatRepository.deleteSession(sessionId);
  }, [chatRepository]);

  const handleClearAll = useCallback((sessionIds: string[]) => {
    sessionIds.forEach((id) => chatRepository.deleteSession(id));
  }, [chatRepository]);

  const handleSelectSession = useCallback(
    (chatSession: ChatSession) => {
      setHistoryVisible(false);
      setSelectedSession(chatSession);
      if (chatSession.itineraryId) {
        setAiItineraryId(chatSession.itineraryId);
        setAiItineraryKey((k) => k + 1);
      }
      setChatKey((k) => k + 1);
      setViewMode('chat');
    },
    [],
  );

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
    setViewMode('ai-itinerary');
  }, []);

  const handleItineraryModified = useCallback(() => {
    setAiItineraryKey((k) => k + 1);
  }, []);

  const renderHeader = () => {
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
            {aiItineraryId && (
              <TouchableOpacity
                onPress={handleSwitchToItinerary}
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
              onSaveSuccess={() => {
                setAiItineraryId(null);
                setAiItineraryKey((k) => k + 1);
                setChatKey((k) => k + 1);
                setViewMode('chat');
                router.navigate('/(tabs)/my-trips');
              }}
            />
          )}
        </View>

        {/* AI Chat */}
        <View style={{ flex: 1, display: viewMode === 'chat' ? 'flex' : 'none' }}>
          <DoraConversationScreen
            key={chatKey}
            userName={profile?.name}
            userId={session?.user.id}
            persona={profile?.persona}
            isOnboarding={fromOnboarding === 'true'}
            mode={mode === 'import' ? 'import' : 'agent'}
            onFinish={() => router.navigate('/(tabs)')}
            hideHeader
            onItineraryCreated={handleItineraryCreated}
            onSwitchToItinerary={handleSwitchToItinerary}
            onItineraryModified={handleItineraryModified}
            initialSessionId={selectedSession?.id}
            initialItineraryId={selectedSession?.itineraryId}
          />
        </View>
      </View>

      <ChatHistoryModal
        visible={historyVisible}
        userId={session?.user.id}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
        onClose={() => setHistoryVisible(false)}
        fetchSessions={fetchSessions}
      />
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
});
