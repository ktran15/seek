import { planLocalNotifications, type LocalPlanInput } from '../localPlan';

/**
 * Fixed calendar for every case: beta starts Monday 2026-07-06 local,
 * 7 days, reminder at 19:00, nudge day 2 / threshold 3 (the real TUNE
 * defaults). Times below are LOCAL (the planner runs on the device clock).
 */
function input(overrides: Partial<LocalPlanInput> = {}): LocalPlanInput {
  return {
    now: new Date(2026, 6, 5, 12, 0), // July 5th noon — day before the beta
    startDate: '2026-07-06',
    lengthDays: 7,
    eveningHour: 19,
    submittedDays: new Set<number>(),
    friendCount: 0,
    nudge: { betaDay: 2, friendThreshold: 3 },
    ...overrides,
  };
}

function ids(plans: ReturnType<typeof planLocalNotifications>): string[] {
  return plans.map((p) => p.id);
}

describe('planLocalNotifications — daily challenge live (local-day boundary)', () => {
  it('before the beta, plans all 7 dailies at their local midnights', () => {
    const plans = planLocalNotifications(input()).filter(
      (p) => p.kind === 'daily_challenge',
    );
    expect(plans).toHaveLength(7);
    expect(plans[0]?.fireDate).toEqual(new Date(2026, 6, 6, 0, 0, 0));
    expect(plans[6]?.fireDate).toEqual(new Date(2026, 6, 12, 0, 0, 0));
  });

  it('mid-beta, only future day boundaries remain', () => {
    // Day 3 afternoon: days 4–7 still ahead.
    const plans = planLocalNotifications(
      input({ now: new Date(2026, 6, 8, 15, 0) }),
    ).filter((p) => p.kind === 'daily_challenge');
    expect(ids(plans)).toEqual([
      'daily-challenge-day-4',
      'daily-challenge-day-5',
      'daily-challenge-day-6',
      'daily-challenge-day-7',
    ]);
  });

  it('after the beta, nothing is planned at all', () => {
    expect(
      planLocalNotifications(input({ now: new Date(2026, 6, 13, 12, 0), friendCount: 5 })),
    ).toEqual([]);
  });
});

describe('planLocalNotifications — evening reminder (TUNE hour)', () => {
  it('fires at the TUNE hour on each unsubmitted day', () => {
    const plans = planLocalNotifications(
      input({ now: new Date(2026, 6, 6, 8, 0) }), // day 1 morning
    ).filter((p) => p.kind === 'evening_reminder');
    expect(plans[0]?.id).toBe('evening-reminder-day-1');
    expect(plans[0]?.fireDate).toEqual(new Date(2026, 6, 6, 19, 0, 0));
    expect(plans).toHaveLength(7);
  });

  it("completing today drops today's reminder but keeps future days", () => {
    const plans = planLocalNotifications(
      input({ now: new Date(2026, 6, 6, 8, 0), submittedDays: new Set([1]) }),
    ).filter((p) => p.kind === 'evening_reminder');
    expect(ids(plans)).not.toContain('evening-reminder-day-1');
    expect(ids(plans)).toContain('evening-reminder-day-2');
  });

  it('past the TUNE hour, today’s reminder is missed — never fired late', () => {
    const plans = planLocalNotifications(
      input({ now: new Date(2026, 6, 6, 20, 30) }), // 20:30 > 19:00
    ).filter((p) => p.kind === 'evening_reminder');
    expect(ids(plans)).not.toContain('evening-reminder-day-1');
    expect(ids(plans)).toContain('evening-reminder-day-2');
  });
});

describe('planLocalNotifications — invite nudge (one max, spec §7.8)', () => {
  it('plans the nudge at midday of the TUNE day while under the threshold', () => {
    const plans = planLocalNotifications(input({ friendCount: 2 }));
    const nudge = plans.find((p) => p.kind === 'invite_nudge');
    expect(nudge?.fireDate).toEqual(new Date(2026, 6, 7, 12, 0, 0)); // day 2
  });

  it('at or over the threshold there is no nudge', () => {
    const plans = planLocalNotifications(input({ friendCount: 3 }));
    expect(plans.find((p) => p.kind === 'invite_nudge')).toBeUndefined();
  });

  it('once the nudge time has passed it can never come back', () => {
    const plans = planLocalNotifications(
      input({ now: new Date(2026, 6, 7, 12, 0, 1), friendCount: 0 }),
    );
    expect(plans.find((p) => p.kind === 'invite_nudge')).toBeUndefined();
  });
});

describe('planLocalNotifications — plan shape', () => {
  it('is sorted by fire date with unique stable ids', () => {
    const plans = planLocalNotifications(input({ friendCount: 0 }));
    const times = plans.map((p) => p.fireDate.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(new Set(ids(plans)).size).toBe(plans.length);
  });
});
