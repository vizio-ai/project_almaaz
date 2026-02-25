export interface DoraMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DoraPersona {
  pace?: string | null;
  interests?: string[];
  journaling?: string | null;
  companionship?: string | null;
}

export interface DoraReply {
  reply: string;
  isComplete: boolean;
}
