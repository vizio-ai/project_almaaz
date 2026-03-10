import { DoraRepositoryImpl } from '../data/repositories/DoraRepositoryImpl';
import { ChatRepositoryImpl } from '../data/repositories/ChatRepositoryImpl';
import { SendDoraMessageUseCase } from '../domain/usecases/SendDoraMessageUseCase';
import { SendChatMessageUseCase } from '../domain/usecases/SendChatMessageUseCase';
import { CreateChatSessionUseCase } from '../domain/usecases/CreateChatSessionUseCase';
import { GetChatSessionUseCase } from '../domain/usecases/GetChatSessionUseCase';
import { GetUserSessionsUseCase } from '../domain/usecases/GetUserSessionsUseCase';
import { ItineraryExternalDependencies, ItineraryDependencies } from './ItineraryDependencies';

export function createItineraryDependencies(
  external: ItineraryExternalDependencies,
): ItineraryDependencies {
  const doraRepository = new DoraRepositoryImpl(external.doraRemoteDataSource);
  const chatRepository = new ChatRepositoryImpl(
    external.chatRemoteDataSource,
    external.supabaseClient,
  );

  return {
    sendDoraMessageUseCase: new SendDoraMessageUseCase(doraRepository),
    sendChatMessageUseCase: new SendChatMessageUseCase(chatRepository),
    createChatSessionUseCase: new CreateChatSessionUseCase(chatRepository),
    getChatSessionUseCase: new GetChatSessionUseCase(chatRepository),
    getUserSessionsUseCase: new GetUserSessionsUseCase(chatRepository),
    chatRepository,
  };
}
