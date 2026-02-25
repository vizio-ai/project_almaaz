import { SendMessageRequestDto, DoraReplyDto } from '../dto/DoraDto';

export interface DoraRemoteDataSource {
  sendMessage(request: SendMessageRequestDto): Promise<DoraReplyDto>;
}
