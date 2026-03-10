export type ChatMessageType =
  | 'text'
  | 'trip_form'
  | 'trip_summary'
  | 'itinerary_result'
  | 'error';

export type BudgetLevel = 'budget-friendly' | 'mid-range' | 'premium' | 'luxury';

export interface TripFormData {
  title: string;
  destination: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  startDate: string;
  endDate: string;
  budget: BudgetLevel;
}

export interface FormSuggestions {
  title?: string;
  destination?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageType: ChatMessageType;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  itineraryId?: string | null;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DoraAction =
  | 'show_trip_form'
  | 'itinerary_generated'
  | 'itinerary_modified';

export interface DoraResponse {
  reply: string;
  isComplete: boolean;
  action?: DoraAction | null;
  formSuggestions?: FormSuggestions | null;
  itineraryId?: string | null;
  generatedItinerary?: unknown;
  modification?: unknown;
  success?: boolean;
}
