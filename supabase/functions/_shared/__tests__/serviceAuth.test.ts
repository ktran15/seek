import { bearerToken, isServiceToken, serviceKeySet } from '../serviceAuth';

// Fixture-only placeholders (not real credentials) shaped like Supabase key formats
// so isServiceToken's prefix/format handling is actually exercised.
const SB_SECRET = 'sb_secret_test_fixture_not_a_real_key';
const LEGACY_JWT = 'eyJhbGciOiJIUzI1NiJ9.test-fixture-not-real.sig';

describe('bearerToken', () => {
  it('extracts the token from a Bearer header', () => {
    expect(bearerToken(`Bearer ${SB_SECRET}`)).toBe(SB_SECRET);
  });

  it('tolerates casing, extra and trailing whitespace', () => {
    expect(bearerToken(`bearer   ${SB_SECRET}  `)).toBe(SB_SECRET);
    expect(bearerToken(`  Bearer ${SB_SECRET}\n`)).toBe(SB_SECRET);
  });

  it('falls back to the raw header when no Bearer prefix', () => {
    expect(bearerToken(SB_SECRET)).toBe(SB_SECRET);
  });

  it('is empty for missing/blank headers', () => {
    expect(bearerToken(null)).toBe('');
    expect(bearerToken('')).toBe('');
    expect(bearerToken('Bearer ')).toBe('');
  });
});

describe('serviceKeySet', () => {
  it('collects the service-role key and every SUPABASE_SECRET_KEYS value', () => {
    const keys = serviceKeySet({
      serviceRoleKey: LEGACY_JWT,
      secretKeysJson: JSON.stringify({ default: SB_SECRET, backup: 'sb_secret_other' }),
    });
    expect(keys.has(LEGACY_JWT)).toBe(true);
    expect(keys.has(SB_SECRET)).toBe(true);
    expect(keys.has('sb_secret_other')).toBe(true);
  });

  it('trims stray whitespace on stored keys', () => {
    const keys = serviceKeySet({ serviceRoleKey: ` ${LEGACY_JWT}\n` });
    expect(keys.has(LEGACY_JWT)).toBe(true);
  });

  it('survives missing or malformed env values', () => {
    expect(serviceKeySet({}).size).toBe(0);
    expect(serviceKeySet({ serviceRoleKey: '', secretKeysJson: 'not-json' }).size).toBe(0);
    expect(
      serviceKeySet({ secretKeysJson: JSON.stringify({ default: 42, blank: ' ' }) }).size,
    ).toBe(0);
  });
});

describe('isServiceToken', () => {
  const keys = serviceKeySet({
    serviceRoleKey: SB_SECRET,
    secretKeysJson: JSON.stringify({ default: SB_SECRET }),
  });

  it('accepts a matching key from either env source', () => {
    expect(isServiceToken(SB_SECRET, keys)).toBe(true);
    expect(
      isServiceToken(LEGACY_JWT, serviceKeySet({ serviceRoleKey: LEGACY_JWT })),
    ).toBe(true);
  });

  it('rejects non-service tokens', () => {
    expect(isServiceToken(LEGACY_JWT, keys)).toBe(false); // stale/rotated-out key
    expect(isServiceToken('anon-or-user-jwt', keys)).toBe(false);
  });

  it('never authorizes an empty token, even against an empty key set', () => {
    expect(isServiceToken('', keys)).toBe(false);
    expect(isServiceToken('', serviceKeySet({}))).toBe(false);
  });
});
