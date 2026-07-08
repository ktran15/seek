import {
  chunkMessages,
  EXPO_PUSH_ENDPOINT,
  pushContentFor,
  sendExpoPush,
  toExpoPushMessages,
  type ExpoPushMessage,
  type PushKind,
} from '../push';

describe('pushContentFor — §13 copy + tap routes', () => {
  it('every kind produces non-empty copy and a leading-slash route', () => {
    const kinds: PushKind[] = [
      'h2h_result',
      'vote_result',
      'vote_countdown',
      'weekly_result',
      'daily_challenge',
      'evening_reminder',
      'invite_nudge',
    ];
    for (const kind of kinds) {
      const content = pushContentFor(kind);
      expect({ kind, ok: content.title.length > 0 }).toEqual({ kind, ok: true });
      expect(content.body.length).toBeGreaterThan(0);
      expect(content.url.startsWith('/')).toBe(true);
    }
  });

  it('h2h win/loss and mascot branches read the M5 payload shape', () => {
    const win = pushContentFor('h2h_result', { won: true, vs_mascot: false });
    const loss = pushContentFor('h2h_result', { won: false, vs_mascot: false });
    const mascotWin = pushContentFor('h2h_result', { won: true, vs_mascot: true });
    const mascotLoss = pushContentFor('h2h_result', { won: false, vs_mascot: true });
    expect(win.title).not.toBe(loss.title);
    expect(mascotWin.title).toContain('mascot');
    expect(mascotLoss.title).toContain('mascot');
    expect(win.url).toBe('/notifications');
  });

  it('vote results honor placement, including the unplaced branch', () => {
    expect(pushContentFor('vote_result', { placement: 1 }).title).toContain('Best dish');
    expect(pushContentFor('vote_result', { placement: 2 }).title).toContain('2nd');
    expect(pushContentFor('vote_result', { placement: 3 }).title).toContain('3rd');
    const unplaced = pushContentFor('vote_result', { placement: null });
    expect(unplaced.title).toContain('votes are in');
  });

  it('weekly results split solo / champion / ranked, embedding coins', () => {
    const solo = pushContentFor('weekly_result', { solo: true, coins: 75 });
    expect(solo.title).toContain('75');
    const champ = pushContentFor('weekly_result', {
      solo: false,
      gold_crate: true,
      coins: 300,
      rank: 1,
    });
    expect(champ.body).toContain('300');
    expect(champ.body).toContain('GOLD');
    const ranked = pushContentFor('weekly_result', {
      solo: false,
      gold_crate: false,
      coins: 150,
      rank: 2,
    });
    expect(ranked.body).toContain('2nd');
    expect(ranked.body).toContain('150');
  });

  it('the countdown routes to the vote screen and the dailies to the challenge', () => {
    expect(pushContentFor('vote_countdown').url).toBe('/vote');
    expect(pushContentFor('daily_challenge').url).toBe('/challenge');
    expect(pushContentFor('evening_reminder').url).toBe('/challenge');
    expect(pushContentFor('invite_nudge').url).toBe('/add-friends');
  });

  it('a malformed payload degrades to a generic branch instead of throwing', () => {
    expect(() => pushContentFor('weekly_result', {})).not.toThrow();
    expect(() => pushContentFor('vote_result', { placement: 'gold' })).not.toThrow();
  });
});

describe('toExpoPushMessages', () => {
  it('fans content out to every device token with the route in data', () => {
    const messages = toExpoPushMessages(
      ['ExponentPushToken[aaa]', 'ExponentPushToken[bbb]'],
      { title: 'T', body: 'B', url: '/vote' },
    );
    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({
      to: 'ExponentPushToken[aaa]',
      title: 'T',
      body: 'B',
      sound: 'default',
      data: { url: '/vote' },
    });
  });

  it('no tokens → no messages', () => {
    expect(toExpoPushMessages([], { title: 'T', body: 'B', url: '/' })).toEqual([]);
  });
});

describe('chunkMessages', () => {
  it('splits at the Expo 100-message cap by default', () => {
    const chunks = chunkMessages(Array.from({ length: 250 }, (_, i) => i));
    expect(chunks.map((c) => c.length)).toEqual([100, 100, 50]);
  });

  it('rejects a nonsense size', () => {
    expect(() => chunkMessages([1], 0)).toThrow();
  });
});

describe('sendExpoPush', () => {
  const message = (n: number): ExpoPushMessage => ({
    to: `ExponentPushToken[${n}]`,
    title: 'T',
    body: 'B',
    sound: 'default',
    data: { url: '/' },
  });

  it('POSTs chunks to the Expo endpoint and counts ok tickets', async () => {
    const calls: Array<{ url: string; bodyLength: number }> = [];
    const fetchImpl = async (url: string, init: { body: string }) => {
      const batch = JSON.parse(init.body) as unknown[];
      calls.push({ url, bodyLength: batch.length });
      return {
        ok: true,
        json: async () => ({ data: batch.map(() => ({ status: 'ok' })) }),
      };
    };
    const result = await sendExpoPush(
      Array.from({ length: 150 }, (_, i) => message(i)),
      fetchImpl,
    );
    expect(result).toEqual({ sent: 150, failed: 0 });
    expect(calls.map((c) => c.bodyLength)).toEqual([100, 50]);
    expect(calls.every((c) => c.url === EXPO_PUSH_ENDPOINT)).toBe(true);
  });

  it('counts error tickets as failed', async () => {
    const fetchImpl = async (_url: string, init: { body: string }) => {
      const batch = JSON.parse(init.body) as unknown[];
      return {
        ok: true,
        json: async () => ({
          data: batch.map((_, i) =>
            i === 0 ? { status: 'error' } : { status: 'ok' },
          ),
        }),
      };
    };
    const result = await sendExpoPush([message(1), message(2)], fetchImpl);
    expect(result).toEqual({ sent: 1, failed: 1 });
  });

  it('never throws — a network outage marks the chunk failed', async () => {
    const fetchImpl = async () => {
      throw new Error('offline');
    };
    const result = await sendExpoPush([message(1), message(2)], fetchImpl);
    expect(result).toEqual({ sent: 0, failed: 2 });
  });

  it('a non-2xx response marks the chunk failed', async () => {
    const fetchImpl = async () => ({
      ok: false,
      json: async () => ({}),
    });
    const result = await sendExpoPush([message(1)], fetchImpl);
    expect(result).toEqual({ sent: 0, failed: 1 });
  });

  it('sends nothing for an empty message list', async () => {
    let called = false;
    const fetchImpl = async () => {
      called = true;
      return { ok: true, json: async () => ({ data: [] }) };
    };
    const result = await sendExpoPush([], fetchImpl);
    expect(result).toEqual({ sent: 0, failed: 0 });
    expect(called).toBe(false);
  });
});
