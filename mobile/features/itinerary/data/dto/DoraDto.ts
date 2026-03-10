export interface SendMessageRequestDto {
  messages: { role: 'user' | 'assistant'; content: string }[];
  persona?: {
    pace?: string | null;
    interests?: string[];
    journaling?: string | null;
    companionship?: string | null;
  } | null;
  isOnboarding?: boolean;
  sessionId?: string;
  userId?: string;
  tripDetails?: {
    title: string;
    destination: string;
    destinationLat?: number | null;
    destinationLng?: number | null;
    startDate: string;
    endDate: string;
    budget: string;
  };
  itineraryId?: string;
  tripContext?: string;
}

export interface DoraReplyDto {
  reply: string;
  isComplete: boolean;
  action?: string | null;
  formSuggestions?: { title?: string; destination?: string } | null;
  itineraryId?: string | null;
  generatedItinerary?: unknown;
  modification?: unknown;
  success?: boolean;
}
