import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, AppText } from '@shared/ui-kit';
import { DoraMessage, TypingIndicator } from '../components/DoraMessage';
import { DoraInput } from '../components/DoraInput';
import { useItineraryDependencies } from '../../di/useItineraryDependencies';
import type { DoraMessage as DoraMsg, DoraPersona } from '../../domain/entities/DoraMessage';

interface DoraConversationScreenProps {
  userName?: string | null;
  persona?: DoraPersona | null;
  isOnboarding?: boolean;
  onFinish?: () => void;
}

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function DoraConversationScreen({
  userName,
  persona,
  isOnboarding,
  onFinish,
}: DoraConversationScreenProps) {
  const { sendDoraMessageUseCase } = useItineraryDependencies();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const hasInitialized = useRef(false);

  const displayName = userName || 'there';
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

  // Auto-trigger first AI message
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    sendToAI([]);
  }, [sendToAI]);

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

  const renderItem = ({ item }: { item: UiMessage }) => (
    <DoraMessage role={item.role} content={item.content} userInitials={userInitials} />
  );

  const showGreeting = messages.length === 0 && !isTyping;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <AppHeader
        variant="dark"
        right={
          <View style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          </View>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.flex}>
          {showGreeting ? (
            <View style={styles.greetingWrap}>
              <AppText style={styles.greetingText}>
                Hello {displayName}!{'\n'}I'm dora, your personal{'\n'}travel agent.
              </AppText>
              {isTyping && <TypingIndicator />}
            </View>
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
  greetingWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#18181B',
    lineHeight: 38,
    textAlign: 'center',
  },
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
