/**
 * Persona options from onboarding questions.
 * value = backend/DB value, label = display text.
 */
export const PACE_OPTIONS = [
  { value: 'planned_fast', label: 'Planned and Fast' },
  { value: 'balanced', label: 'Relaxed and Flexible' },
  { value: 'spontaneous', label: 'Spontaneous' },
] as const;

export const INTEREST_OPTIONS = [
  { value: 'culture', label: 'Culture' },
  { value: 'food', label: 'Food' },
  { value: 'photo_spots', label: 'Photo Spots' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'nature', label: 'Nature' },
] as const;

export const JOURNALING_OPTIONS = [
  { value: 'storyteller', label: 'Storyteller' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'photographer', label: 'Photographer' },
] as const;

export const COMPANIONSHIP_OPTIONS = [
  { value: 'solo', label: 'Solo' },
  { value: 'friends', label: 'Friends' },
  { value: 'family', label: 'Family' },
  { value: 'partner', label: 'Partner' },
] as const;

export function getPaceLabel(value: string | null): string {
  if (!value) return '';
  return PACE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getInterestLabels(values: string[]): string {
  if (!values?.length) return '';
  return values
    .map((v) => INTEREST_OPTIONS.find((o) => o.value === v)?.label ?? v)
    .join(', ');
}

export function getJournalingLabel(value: string | null): string {
  if (!value) return '';
  return JOURNALING_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getCompanionshipLabel(value: string | null): string {
  if (!value) return '';
  return COMPANIONSHIP_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
