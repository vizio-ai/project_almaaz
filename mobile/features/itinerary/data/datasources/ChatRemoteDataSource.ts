import { SendMessageRequestDto, DoraReplyDto } from '../dto/DoraDto';

export interface ChatRemoteDataSource {
  sendMessage(request: SendMessageRequestDto): Promise<DoraReplyDto>;
}
