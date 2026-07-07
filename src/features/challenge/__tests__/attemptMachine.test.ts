import { canBegin, canSubmit, deriveAttemptState, transition } from '../attemptMachine';

describe('attempt state machine (spec §7.4)', () => {
  it('follows the happy path unrevealed → revealed → in_progress → submitted', () => {
    expect(transition('unrevealed', 'REVEAL')).toBe('revealed');
    expect(transition('revealed', 'BEGIN')).toBe('in_progress');
    expect(transition('in_progress', 'SUBMIT')).toBe('submitted');
  });

  it('reveal consumes nothing and is repeatable', () => {
    expect(transition('revealed', 'REVEAL')).toBe('revealed');
  });

  it('cannot begin or submit before reveal', () => {
    expect(transition('unrevealed', 'BEGIN')).toBeNull();
    expect(transition('unrevealed', 'SUBMIT')).toBeNull();
  });

  it('cannot submit from revealed (capture must have started)', () => {
    expect(transition('revealed', 'SUBMIT')).toBeNull();
  });

  it('crash recovery: BEGIN from in_progress restarts without burning', () => {
    expect(transition('in_progress', 'BEGIN')).toBe('in_progress');
    expect(canBegin('in_progress')).toBe(true);
  });

  it('submitted is terminal — every event is illegal', () => {
    expect(transition('submitted', 'REVEAL')).toBeNull();
    expect(transition('submitted', 'BEGIN')).toBeNull();
    expect(transition('submitted', 'SUBMIT')).toBeNull();
    expect(canBegin('submitted')).toBe(false);
    expect(canSubmit('submitted')).toBe(false);
  });

  it('derives state from the persisted row + revealed flag', () => {
    expect(deriveAttemptState(null, false)).toBe('unrevealed');
    expect(deriveAttemptState(null, true)).toBe('revealed');
    expect(deriveAttemptState({ state: 'in_progress' }, false)).toBe('in_progress');
    expect(deriveAttemptState({ state: 'submitted' }, true)).toBe('submitted');
  });
});
