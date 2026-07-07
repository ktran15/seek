/**
 * Attempt state machine (spec §7.4, LOCKED):
 *
 *   unrevealed -> revealed -> in_progress -> submitted (terminal)
 *
 * - `revealed` consumes nothing; the user may leave and return freely.
 * - Crash/app-quit mid-capture does NOT burn the attempt: on return the
 *   in_progress row is reset and the user may begin again (BEGIN is legal
 *   from in_progress). Founder-accepted tradeoff — do not tighten.
 * - `submitted` is terminal; the DB unique constraint + RLS enforce it
 *   server-side, this reducer enforces it in the UI.
 */

export type AttemptState = 'unrevealed' | 'revealed' | 'in_progress' | 'submitted';

export type AttemptEvent = 'REVEAL' | 'BEGIN' | 'SUBMIT';

const TRANSITIONS: Record<AttemptState, Partial<Record<AttemptEvent, AttemptState>>> = {
  unrevealed: { REVEAL: 'revealed' },
  revealed: { REVEAL: 'revealed', BEGIN: 'in_progress' },
  // BEGIN from in_progress = crash-safe restart of the same attempt.
  in_progress: { REVEAL: 'in_progress', BEGIN: 'in_progress', SUBMIT: 'submitted' },
  submitted: {},
};

/** Next state, or null if the event is illegal in the current state. */
export function transition(
  state: AttemptState,
  event: AttemptEvent,
): AttemptState | null {
  return TRANSITIONS[state][event] ?? null;
}

export function canBegin(state: AttemptState): boolean {
  return transition(state, 'BEGIN') !== null;
}

export function canSubmit(state: AttemptState): boolean {
  return transition(state, 'SUBMIT') !== null;
}

interface SubmissionLike {
  state: 'in_progress' | 'submitted';
}

/**
 * Derive the machine state from the persisted submission row (if any) plus
 * the client-side revealed flag. The DB knows nothing of `revealed` —
 * reveal intentionally consumes nothing (spec §7.3).
 */
export function deriveAttemptState(
  submission: SubmissionLike | null | undefined,
  revealed: boolean,
): AttemptState {
  if (submission?.state === 'submitted') return 'submitted';
  if (submission?.state === 'in_progress') return 'in_progress';
  return revealed ? 'revealed' : 'unrevealed';
}
