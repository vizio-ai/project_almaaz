import { useState, useRef, useCallback } from 'react';
import { generateItinerarySummaries } from '../../../../infrastructure/manual-itinerary';

const DEBOUNCE_MS = 5_000;

/**
 * Debounced auto-summary hook.
 * After any mutation (activity add/edit/remove, day update), call `triggerSummary()`
 * which waits for DEBOUNCE_MS of inactivity before calling the edge function.
 *
 * For create flow, call `triggerSummaryImmediate(itineraryId)` once after save.
 */
export function useAutoSummary(
  itineraryId: string | null,
  onComplete?: () => void,
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(
    async (id: string) => {
      setIsGenerating(true);
      try {
        await generateItinerarySummaries(id);
        onComplete?.();
      } finally {
        setIsGenerating(false);
      }
    },
    [onComplete],
  );

  /** Debounced trigger — waits for inactivity before generating. */
  const triggerSummary = useCallback(() => {
    if (!itineraryId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      run(itineraryId);
    }, DEBOUNCE_MS);
  }, [itineraryId, run]);

  /** Immediate trigger — for create flow, after save. */
  const triggerSummaryImmediate = useCallback(
    (id: string) => {
      run(id);
    },
    [run],
  );

  return { isGenerating, triggerSummary, triggerSummaryImmediate };
}
