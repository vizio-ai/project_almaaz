import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@shared/ui-kit';
import type { ChatSession } from '../../domain/entities/ChatSession';

interface ChatHistoryModalProps {
  visible: boolean;
  userId: string | null | undefined;
  activeSessionId?: string | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession?: (sessionId: string) => void;
  onClearAll?: (sessionIds: string[]) => void;
  onClose: () => void;
  fetchSessions: (userId: string) => Promise<ChatSession[]>;
}

function groupByDate(sessions: ChatSession[]): { title: string; data: ChatSession[] }[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const today: ChatSession[] = [];
  const lastWeek: ChatSession[] = [];
  const earlier: ChatSession[] = [];

  for (const s of sessions) {
    const dateStr = s.updatedAt?.split('T')[0] ?? s.createdAt.split('T')[0];
    if (dateStr === todayStr) {
      today.push(s);
    } else if (new Date(dateStr) >= weekAgo) {
      lastWeek.push(s);
    } else {
      earlier.push(s);
    }
  }

  const groups: { title: string; data: ChatSession[] }[] = [];
  if (today.length > 0) groups.push({ title: 'Today', data: today });
  if (lastWeek.length > 0) groups.push({ title: 'Last 7 Days', data: lastWeek });
  if (earlier.length > 0) groups.push({ title: 'Earlier', data: earlier });
  return groups;
}

export function ChatHistoryModal({
  visible,
  userId,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAll,
  onClose,
  fetchSessions,
}: ChatHistoryModalProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await fetchSessions(userId);
      setSessions(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [userId, fetchSessions]);

  useEffect(() => {
    if (visible) {
      loadSessions();
      setMenuSessionId(null);
    }
  }, [visible, loadSessions]);

  const groups = useMemo(() => groupByDate(sessions), [sessions]);

  const handleDelete = (sessionId: string) => {
    onDeleteSession?.(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setMenuSessionId(null);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Conversations',
      'Are you sure you want to delete all chat history? Your saved itineraries will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            const ids = sessions.map((s) => s.id);
            onClearAll?.(ids);
            setSessions([]);
          },
        },
      ],
    );
  };

  const renderSession = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const title = session.title || 'Untitled conversation';

    return (
      <View key={session.id}>
        <TouchableOpacity
          style={[styles.sessionItem, isActive && styles.sessionItemActive]}
          onPress={() => onSelectSession(session)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={isActive ? '#FFFFFF' : '#666666'}
          />
          <AppText
            style={[styles.sessionTitle, isActive && styles.sessionTitleActive]}
            numberOfLines={1}
          >
            {title}
          </AppText>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() =>
              setMenuSessionId(menuSessionId === session.id ? null : session.id)
            }
            hitSlop={8}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={16}
              color={isActive ? '#FFFFFF' : '#999999'}
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {menuSessionId === session.id && (
          <View style={styles.contextMenu}>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => handleDelete(session.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <AppText style={styles.contextMenuDeleteText}>Delete</AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const flatData = useMemo(() => {
    const items: { type: 'header' | 'session'; key: string; title?: string; session?: ChatSession }[] = [];
    for (const group of groups) {
      items.push({ type: 'header', key: `h-${group.title}`, title: group.title });
      for (const s of group.data) {
        items.push({ type: 'session', key: s.id, session: s });
      }
    }
    return items;
  }, [groups]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={8}>
            <Ionicons name="close" size={24} color="#18181B" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Chat History</AppText>
          {sessions.length > 0 ? (
            <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7} hitSlop={8}>
              <AppText style={styles.clearAllBtn}>Clear All</AppText>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#18181B" />
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={48} color="#CCCCCC" />
            <AppText style={styles.emptyText}>No conversations yet</AppText>
          </View>
        ) : (
          <FlatList
            data={flatData}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <AppText style={styles.sectionHeader}>{item.title}</AppText>
                );
              }
              return item.session ? renderSession(item.session) : null;
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  clearAllBtn: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F4F4F5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 6,
  },
  sessionItemActive: {
    backgroundColor: '#18181B',
  },
  sessionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#18181B',
  },
  sessionTitleActive: {
    color: '#FFFFFF',
  },
  menuBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 8,
    marginBottom: 6,
    marginLeft: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contextMenuDeleteText: {
    fontSize: 14,
    color: '#EF4444',
  },
});
