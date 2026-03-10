import { DoraRemoteDataSource } from '../data/datasources/DoraRemoteDataSource';
import { ChatRemoteDataSource } from '../data/datasources/ChatRemoteDataSource';
import { SendDoraMessageUseCase } from '../domain/usecases/SendDoraMessageUseCase';
import { SendChatMessageUseCase } from '../domain/usecases/SendChatMessageUseCase';
import { CreateChatSessionUseCase } from '../domain/usecases/CreateChatSessionUseCase';
import { GetChatSessionUseCase } from '../domain/usecases/GetChatSessionUseCase';
import { GetUserSessionsUseCase } from '../domain/usecases/GetUserSessionsUseCase';
import { ChatRepository } from '../domain/repositories/ChatRepository';

export interface ItineraryExternalDependencies {
  doraRemoteDataSource: DoraRemoteDataSource;
  chatRemoteDataSource: ChatRemoteDataSource;
  supabaseClient: import('@supabase/supabase-js').SupabaseClient;
}

export interface ItineraryDependencies {
  sendDoraMessageUseCase: SendDoraMessageUseCase;
  sendChatMessageUseCase: SendChatMessageUseCase;
  createChatSessionUseCase: CreateChatSessionUseCase;
  getChatSessionUseCase: GetChatSessionUseCase;
  getUserSessionsUseCase: GetUserSessionsUseCase;
  chatRepository: ChatRepository;
}
