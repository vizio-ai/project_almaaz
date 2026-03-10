import { UseCase, Result } from '@shared/kernel';
import { ChatRepository } from '../repositories/ChatRepository';
import { ChatSession } from '../entities/ChatSession';

interface CreateChatSessionParams {
  userId: string;
  title?: string;
}

export class CreateChatSessionUseCase
  implements UseCase<CreateChatSessionParams, ChatSession>
{
  constructor(private readonly repository: ChatRepository) {}

  execute(params: CreateChatSessionParams): Promise<Result<ChatSession>> {
    return this.repository.createSession(params.userId, params.title);
  }
}
