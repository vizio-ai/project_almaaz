export interface SendMessageRequestDto {
  messages: { role: 'user' | 'assistant'; content: string }[];
  persona?: {
    pace?: string | null;
    interests?: string[];
    journaling?: string | null;
    companionship?: string | null;
  } | null;
  isOnboarding?: boolean;
}

export interface DoraReplyDto {
  reply: string;
  isComplete: boolean;
}
