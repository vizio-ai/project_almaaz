import { Result, ok, fail, networkError } from '@shared/kernel';
import {
  ChatRepository,
  SendChatMessageParams,
} from '../../domain/repositories/ChatRepository';
import {
  ChatSession,
  ChatMessage,
  DoraResponse,
  DoraAction,
} from '../../domain/entities/ChatSession';
import { ChatRemoteDataSource } from '../datasources/ChatRemoteDataSource';
import type { SupabaseClient } from '@supabase/supabase-js';

export class ChatRepositoryImpl implements ChatRepository {
  constructor(
    private readonly remoteDataSource: ChatRemoteDataSource,
    private readonly supabase: SupabaseClient,
  ) {}

  async sendMessage(params: SendChatMessageParams): Promise<Result<DoraResponse>> {
    try {
      const dto = await this.remoteDataSource.sendMessage({
        messages: params.messages,
        persona: params.persona,
        isOnboarding: params.isOnboarding,
        sessionId: params.sessionId,
        userId: params.userId,
        tripDetails: params.tripDetails,
        itineraryId: params.itineraryId,
        tripContext: params.tripContext,
      });

      return ok({
        reply: dto.reply,
        isComplete: dto.isComplete,
        action: (dto.action as DoraAction) ?? null,
        formSuggestions: dto.formSuggestions ?? null,
        itineraryId: dto.itineraryId ?? null,
        generatedItinerary: dto.generatedItinerary,
        modification: dto.modification,
        success: dto.success,
      });
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async createSession(
    userId: string,
    title?: string,
  ): Promise<Result<ChatSession>> {
    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .insert({ user_id: userId, title: title || null })
        .select('*')
        .single();

      if (error || !data) {
        return fail(networkError(error ?? new Error('Failed to create session')));
      }

      return ok(this.mapSession(data));
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async getSession(sessionId: string): Promise<Result<ChatSession>> {
    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        return fail(networkError(error ?? new Error('Session not found')));
      }

      return ok(this.mapSession(data));
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async getUserSessions(userId: string): Promise<Result<ChatSession[]>> {
    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        return fail(networkError(error));
      }

      return ok((data || []).map((row: Record<string, unknown>) => this.mapSession(row)));
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async saveMessage(
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'createdAt'>,
  ): Promise<Result<ChatMessage>> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: message.role,
          content: message.content,
          message_type: message.messageType,
          metadata: message.metadata || null,
        })
        .select('*')
        .single();

      if (error || !data) {
        return fail(networkError(error ?? new Error('Failed to save message')));
      }

      return ok(this.mapMessage(data));
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async getMessages(sessionId: string): Promise<Result<ChatMessage[]>> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        return fail(networkError(error));
      }

      return ok((data || []).map((row: Record<string, unknown>) => this.mapMessage(row)));
    } catch (error) {
      return fail(networkError(error));
    }
  }

  private mapSession(row: Record<string, unknown>): ChatSession {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      itineraryId: (row.itinerary_id as string) || null,
      title: (row.title as string) || null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapMessage(row: Record<string, unknown>): ChatMessage {
    return {
      id: row.id as string,
      sessionId: row.session_id as string,
      role: row.role as ChatMessage['role'],
      content: row.content as string,
      messageType: row.message_type as ChatMessage['messageType'],
      metadata: (row.metadata as Record<string, unknown>) || null,
      createdAt: row.created_at as string,
    };
  }
}
