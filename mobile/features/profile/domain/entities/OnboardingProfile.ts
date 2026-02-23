import { ID } from '@shared/kernel';

export interface OnboardingProfile {
  userId: ID;
  name: string;
  surname: string;
  email: string | null;
  pace: string | null;
  interests: string[];
  journaling: string | null;
  companionship: string | null;
}
