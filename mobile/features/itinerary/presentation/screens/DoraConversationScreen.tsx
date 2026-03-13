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
import { TripDetailsFormCard } from '../components/TripDetailsFormCard';
import { TripSummaryCard } from '../components/TripSummaryCard';
import { useItineraryDependencies } from '../../di/useItineraryDependencies';
import type { DoraMessage as DoraMsg, DoraPersona } from '../../domain/entities/DoraMessage';
import type {
  TripFormData,
  FormSuggestions,
  ChatMessageType,
} from '../../domain/entities/ChatSession';

const ACCENT_COLOR = '#44FFFF';
const BETA_BANNER_BG = '#E0F7F4';
const BETA_BANNER_TEXT = '#0D6E6E';

interface DoraConversationScreenProps {
  userName?: string | null;
  userId?: string | null;
  persona?: DoraPersona | null;
  isOnboarding?: boolean;
  mode?: 'agent' | 'import';
  onFinish?: () => void;
  hideHeader?: boolean;
  onItineraryCreated?: (itineraryId: string) => void;
  onSwitchToItinerary?: () => void;
  onItineraryModified?: () => void;
}

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  messageType: ChatMessageType;
  metadata?: Record<string, unknown> | null;
}

const SUGGESTIONS = [
  'Tokyo trip with sushi focus',
  'Plan me vacation for 2 people in Caribbeans',
];

export function DoraConversationScreen({
  userName,
  userId,
  persona,
  isOnboarding,
  mode = 'agent',
  onFinish,
  hideHeader,
  onItineraryCreated,
  onSwitchToItinerary,
  onItineraryModified,
}: DoraConversationScreenProps) {
  const {
    sendDoraMessageUseCase,
    sendChatMessageUseCase,
    createChatSessionUseCase,
    chatRepository,
  } = useItineraryDependencies();

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [tripDetails, setTripDetails] = useState<TripFormData | null>(null);
  const [pendingFormSuggestions, setPendingFormSuggestions] =
    useState<FormSuggestions | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [importActive, setImportActive] = useState(false);
  const [betaDismissed, setBetaDismissed] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<{ focus: () => void }>(null);
  const userInitials = userName?.[0]?.toUpperCase() ?? '?';

  // Create a session on first interaction
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (sessionId) return sessionId;
    if (!userId) return null;
    const result = await createChatSessionUseCase.execute({
      userId,
    });
    if (result.success) {
      setSessionId(result.data.id);
      return result.data.id;
    }
    return null;
  }, [sessionId, userId, createChatSessionUseCase]);

  // Persist a message to the DB (fire-and-forget)
  const persistMessage = useCallback(
    (
      sid: string | null,
      role: 'user' | 'assistant',
      content: string,
      messageType: ChatMessageType,
      metadata?: Record<string, unknown> | null,
    ) => {
      if (!sid) return;
      chatRepository
        .saveMessage(sid, {
          sessionId: sid,
          role,
          content,
          messageType,
          metadata: metadata ?? null,
        })
        .catch(() => {});
    },
    [chatRepository],
  );

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [messages, isTyping]);

  const sendToAI = useCallback(
    async (history: UiMessage[], currentTripDetails?: TripFormData | null) => {
      setIsTyping(true);
      try {
        const currentSession = await ensureSession();

        // Persist the latest user message
        const lastUserMsg = [...history].reverse().find((m) => m.role === 'user');
        if (lastUserMsg && currentSession) {
          persistMessage(
            currentSession,
            'user',
            lastUserMsg.content,
            lastUserMsg.messageType,
            lastUserMsg.metadata,
          );
        }

        // Build API messages (text-only for OpenAI)
        const apiMessages: DoraMsg[] = history
          .filter(
            (m) => m.messageType === 'text' || m.messageType === 'trip_summary',
          )
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        if (isOnboarding) {
          const result = await sendDoraMessageUseCase.execute({
            messages: apiMessages,
            persona,
            isOnboarding: true,
          });
          if (!result.success) throw new Error(result.error?.message);

          const aiMsg: UiMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: result.data.reply,
            messageType: 'text',
          };
          setMessages((prev) => [...prev, aiMsg]);
          persistMessage(currentSession, 'assistant', result.data.reply, 'text');

          if (result.data.isComplete) {
            setTimeout(() => setShowModal(true), 600);
          }
          return;
        }

        const detailsToSend = currentTripDetails ?? tripDetails;
        const result = await sendChatMessageUseCase.execute({
          messages: apiMessages,
          persona,
          sessionId: currentSession ?? undefined,
          userId: userId ?? undefined,
          tripDetails: detailsToSend ?? undefined,
          itineraryId: itineraryId ?? undefined,
        });

        if (!result.success) throw new Error(result.error?.message);

        const { action, formSuggestions, itineraryId: newItineraryId } =
          result.data;

        if (action === 'show_trip_form') {
          if (result.data.reply) {
            const aiTextMsg: UiMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: result.data.reply,
              messageType: 'text',
            };
            setMessages((prev) => [...prev, aiTextMsg]);
            persistMessage(currentSession, 'assistant', result.data.reply, 'text');
          }

          setPendingFormSuggestions(formSuggestions ?? null);
          const formMsg: UiMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            messageType: 'trip_form',
            metadata: { formSuggestions },
          };
          setMessages((prev) => [...prev, formMsg]);
          persistMessage(currentSession, 'assistant', '', 'trip_form', { formSuggestions });
          return;
        }

        if (action === 'itinerary_generated') {
          if (newItineraryId) {
            setItineraryId(newItineraryId);
            onItineraryCreated?.(newItineraryId);
          }

          const aiMsg: UiMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: result.data.reply,
            messageType: 'itinerary_result',
            metadata: {
              itineraryId: newItineraryId,
            },
          };
          setMessages((prev) => [...prev, aiMsg]);
          persistMessage(currentSession, 'assistant', result.data.reply, 'itinerary_result', {
            itineraryId: newItineraryId,
          });
          return;
        }

        if (action === 'itinerary_modified') {
          const aiMsg: UiMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: result.data.reply,
            messageType: 'text',
          };
          setMessages((prev) => [...prev, aiMsg]);
          persistMessage(currentSession, 'assistant', result.data.reply, 'text');
          onItineraryModified?.();
          return;
        }

        const aiMsg: UiMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.data.reply,
          messageType: 'text',
        };
        setMessages((prev) => [...prev, aiMsg]);
        persistMessage(currentSession, 'assistant', result.data.reply, 'text');
      } catch {
        const errMsg: UiMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I'm having a moment — could you try again?",
          messageType: 'error',
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [
      persona,
      isOnboarding,
      tripDetails,
      itineraryId,
      userId,
      ensureSession,
      persistMessage,
      sendDoraMessageUseCase,
      sendChatMessageUseCase,
      onItineraryCreated,
      onItineraryModified,
    ],
  );

  const handleSend = (text: string) => {
    const userMsg: UiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      messageType: 'text',
    };
    const next = [...messages, userMsg];
    setMessages(next);
    sendToAI(next);
  };

  const handleSuggestionPress = (text: string) => {
    handleSend(text);
  };

  const handleImportPress = () => {
    setImportActive(true);
    const aiMsg: UiMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content:
        'Go ahead — paste your trip notes below and I\'ll structure them into a neat itinerary for you.',
      messageType: 'text',
    };
    setMessages([aiMsg]);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleFormSubmit = (data: TripFormData) => {
    setTripDetails(data);
    setFormSubmitted(true);

    const summaryMsg: UiMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `${data.title} — ${data.destination}`,
      messageType: 'trip_summary',
      metadata: { tripDetails: data },
    };

    const updatedMessages = [...messages, summaryMsg];
    setMessages(updatedMessages);
    persistMessage(sessionId, 'assistant', summaryMsg.content, 'trip_summary', { tripDetails: data });

    const contextContent = `I've set my trip details: "${data.title}" to ${data.destination}, from ${data.startDate} to ${data.endDate}, budget: ${data.budget}. Please generate my itinerary!`;
    const contextMessage: UiMessage = {
      id: (Date.now() + 1).toString(),
      role: 'user',
      content: contextContent,
      messageType: 'text',
    };

    const messagesForAI = [...updatedMessages, contextMessage];
    setMessages(messagesForAI);
    persistMessage(sessionId, 'user', contextContent, 'text');
    sendToAI(messagesForAI, data);
  };

  const renderItem = ({ item }: { item: UiMessage }) => {
    if (item.messageType === 'trip_form' && !formSubmitted) {
      return (
        <TripDetailsFormCard
          suggestions={pendingFormSuggestions}
          onSubmit={handleFormSubmit}
          disabled={isTyping}
        />
      );
    }

    if (item.messageType === 'trip_summary') {
      const details = item.metadata?.tripDetails as TripFormData | undefined;
      if (details) {
        return <TripSummaryCard tripDetails={details} />;
      }
    }

    if (item.messageType === 'itinerary_result') {
      return (
        <View style={styles.itineraryResultContainer}>
          <DoraMessage
            role={item.role}
            content={item.content}
            userInitials={userInitials}
          />
          {itineraryId && onSwitchToItinerary && (
            <TouchableOpacity
              style={styles.viewItineraryBtn}
              onPress={onSwitchToItinerary}
              activeOpacity={0.8}
            >
              <Ionicons name="map-outline" size={16} color="#FFFFFF" />
              <AppText style={styles.viewItineraryBtnText}>
                View Your Itinerary
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <DoraMessage
        role={item.role}
        content={item.content}
        userInitials={userInitials}
      />
    );
  };

  const showInitialView = messages.length === 0 && !isTyping;
  const showBetaBanner =
    (mode === 'import' || importActive) && messages.length > 0 && !betaDismissed;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {!hideHeader && (
        <AppHeader
          variant="dark"
          right={
            <View style={styles.headerRight}>
              {itineraryId && onSwitchToItinerary && (
                <TouchableOpacity
                  onPress={onSwitchToItinerary}
                  activeOpacity={0.8}
                  style={styles.headerPrimaryBtn}
                >
                  <Ionicons name="map-outline" size={16} color="#FFFFFF" />
                  <AppText style={styles.headerPrimaryLabel}>
                    Itinerary
                  </AppText>
                </TouchableOpacity>
              )}
              <View style={styles.notifBtn}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            </View>
          }
        />
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.flex}>
          {/* Beta banner for import mode */}
          {showBetaBanner && (
            <TouchableOpacity
              style={styles.betaBanner}
              onPress={() => setBetaDismissed(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle-outline" size={18} color={BETA_BANNER_TEXT} />
              <AppText style={styles.betaBannerText}>
                This feature is in Beta. Parsing may not be completely accurate.
                Manually editing is recommended before saving the trip plan.
              </AppText>
            </TouchableOpacity>
          )}

          {showInitialView ? (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.initialContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <AppText style={styles.greetingText}>
                I'm{' '}
                <AppText style={styles.greetingAccent}>dora</AppText>
                , your personal{'\n'}travel agent.
              </AppText>

              <View style={styles.initialMessageRow}>
                <Image
                  source={require('../../../../assets/images/avatar.png')}
                  style={styles.doraAvatar}
                />
                <AppText style={styles.initialMessageText}>
                  Where are you dreaming of going next? Just tell me a place or
                  a vibe.
                </AppText>
              </View>

              <ImportTripPlanCard onPress={handleImportPress} />

              {mode === 'agent' && (
                <View style={styles.suggestionsRow}>
                  {SUGGESTIONS.map((s) => (
                    <DoraSuggestionCard
                      key={s}
                      text={s}
                      onPress={handleSuggestionPress}
                    />
                  ))}
                </View>
              )}
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
        <DoraInput
          ref={inputRef}
          onSend={handleSend}
          disabled={isTyping}
          placeholder={
            mode === 'import' || importActive
              ? 'Paste in any trip notes here'
              : undefined
          }
          multiline={mode === 'import' || importActive}
        />
      </KeyboardAvoidingView>

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
                <AppText style={styles.modalBtnOutlineText}>
                  Go to Homepage
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnFilled}
                onPress={onFinish}
                activeOpacity={0.8}
              >
                <AppText style={styles.modalBtnFilledText}>
                  Let's start!
                </AppText>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  betaBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: BETA_BANNER_BG,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  betaBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: BETA_BANNER_TEXT,
  },
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
  listContent: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  itineraryResultContainer: {
    gap: 12,
  },
  viewItineraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#18181B',
    borderRadius: 999,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  viewItineraryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
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
