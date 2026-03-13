import { Result } from '@shared/kernel';
import {
  ChatSession,
  ChatMessage,
  DoraResponse,
  TripFormData,
} from '../entities/ChatSession';
import { DoraMessage, DoraPersona } from '../entities/DoraMessage';

export interface SendChatMessageParams {
  messages: DoraMessage[];
  persona?: DoraPersona | null;
  isOnboarding?: boolean;
  sessionId?: string;
  userId?: string;
  tripDetails?: TripFormData;
  itineraryId?: string;
  tripContext?: string;
}

export interface ChatRepository {
  sendMessage(params: SendChatMessageParams): Promise<Result<DoraResponse>>;
  createSession(userId: string, title?: string): Promise<Result<ChatSession>>;
  getSession(sessionId: string): Promise<Result<ChatSession>>;
  getUserSessions(userId: string): Promise<Result<ChatSession[]>>;
  saveMessage(
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'createdAt'>,
  ): Promise<Result<ChatMessage>>;
  getMessages(sessionId: string): Promise<Result<ChatMessage[]>>;
  deleteSession(sessionId: string): Promise<Result<void>>;
}
