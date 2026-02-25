import { Result } from '@shared/kernel';
import { DoraMessage, DoraPersona, DoraReply } from '../entities/DoraMessage';

export interface DoraRepository {
  sendMessage(params: {
    messages: DoraMessage[];
    persona?: DoraPersona | null;
    isOnboarding?: boolean;
  }): Promise<Result<DoraReply>>;
}
