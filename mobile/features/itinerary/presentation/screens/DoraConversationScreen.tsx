import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, AppText } from '@shared/ui-kit';
import { DoraMessage, TypingIndicator } from '../components/DoraMessage';
import { DoraInput } from '../components/DoraInput';
import { DoraSuggestionCard } from '../components/DoraSuggestionCard';
import { ImportTripPlanCard } from '../components/ImportTripPlanCard';
import { useItineraryDependencies } from '../../di/useItineraryDependencies';
import type { DoraMessage as DoraMsg, DoraPersona } from '../../domain/entities/DoraMessage';

const ACCENT_COLOR = '#44FFFF';

interface DoraConversationScreenProps {
  userName?: string | null;
  persona?: DoraPersona | null;
  isOnboarding?: boolean;
  onFinish?: () => void;
  /** When true, do not render the header (parent provides it, e.g. Create tab). */
  hideHeader?: boolean;
}

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Tokyo trip with sushi focus',
  'Plan me vacation for 2 people in Caribbeans',
];

export function DoraConversationScreen({
  userName,
  persona,
  isOnboarding,
  onFinish,
  hideHeader,
}: DoraConversationScreenProps) {
  const { sendDoraMessageUseCase } = useItineraryDependencies();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const userInitials = userName?.[0]?.toUpperCase() ?? '?';

  const sendToAI = useCallback(async (history: UiMessage[]) => {
    setIsTyping(true);
    try {
      const apiMessages: DoraMsg[] = history.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const result = await sendDoraMessageUseCase.execute({ messages: apiMessages, persona, isOnboarding });
      if (!result.success) throw new Error(result.error?.message);

      const aiMsg: UiMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.data.reply,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (result.data.isComplete && isOnboarding) {
        setTimeout(() => setShowModal(true), 600);
      }
    } catch {
      const errMsg: UiMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm having a moment — could you try again?",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [persona, isOnboarding]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    const userMsg: UiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    sendToAI(next);
  };

  const handleSuggestionPress = (text: string) => {
    handleSend(text);
  };

  const handleImportPress = () => {
    // TODO: open import flow / paste modal
  };

  const renderItem = ({ item }: { item: UiMessage }) => (
    <DoraMessage role={item.role} content={item.content} userInitials={userInitials} />
  );

  const showInitialView = messages.length === 0 && !isTyping;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {!hideHeader && (
        <AppHeader
          variant="dark"
          right={
            <View style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            </View>
          }
        />
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.flex}>
          {showInitialView ? (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.initialContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Greeting */}
              <AppText style={styles.greetingText}>
                I'm{' '}
                <AppText style={styles.greetingAccent}>dora</AppText>
                , your personal{'\n'}travel agent.
              </AppText>

              {/* Initial Dora message */}
              <View style={styles.initialMessageRow}>
                <Image
                  source={require('../../../../assets/images/avatar.png')}
                  style={styles.doraAvatar}
                />
                <AppText style={styles.initialMessageText}>
                  Where are you dreaming of going next? Just tell me a place or a vibe.
                </AppText>
              </View>

              {/* Import trip plan card */}
              <ImportTripPlanCard onPress={handleImportPress} />

              {/* Suggestion cards */}
              <View style={styles.suggestionsRow}>
                {SUGGESTIONS.map((s) => (
                  <DoraSuggestionCard key={s} text={s} onPress={handleSuggestionPress} />
                ))}
              </View>
            </ScrollView>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              style={styles.flex}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            />
          )}
        </View>
        <DoraInput onSend={handleSend} disabled={isTyping} />
      </KeyboardAvoidingView>

      {/* Completion Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#18181B" />
            </TouchableOpacity>
            <AppText style={styles.modalTitle}>
              Now let's start planning your first trip.
            </AppText>
            <AppText style={styles.modalBody}>
              {`We've analyzed your travel DNA! Now that we know you, let's turn that vibe into your first real adventure.`}
            </AppText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnOutline}
                onPress={onFinish}
                activeOpacity={0.8}
              >
                <AppText style={styles.modalBtnOutlineText}>Go to Homepage</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnFilled}
                onPress={onFinish}
                activeOpacity={0.8}
              >
                <AppText style={styles.modalBtnFilledText}>Let's start!</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Initial view
  initialContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 20,
    flexGrow: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#18181B',
    lineHeight: 25,
    textAlign: 'center',
  },
  greetingAccent: {
    color: ACCENT_COLOR,
    fontWeight: '500',
  },
  initialMessageRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 28,
  },
  doraAvatar: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    flexShrink: 0,
  },
  initialMessageText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#18181B',
    flex: 1,
    paddingTop: 4,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  // Chat list
  listContent: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalClose: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 12,
    lineHeight: 28,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666666',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnOutline: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnOutlineText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181B',
  },
  modalBtnFilled: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnFilledText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
