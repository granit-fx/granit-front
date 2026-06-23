import {
  fromBase64Url,
  handleLoginError,
  redirectTo,
  redirectToReturnUrl,
  serializeCredential,
  toBase64Url,
} from '../login-helpers';

// `@granit/api-client` is heavy; only `isAxiosError` is needed here. Stub it as a
// plain duck-type check on the `isAxiosError` marker so error branches resolve.
vi.mock('@granit/api-client', () => ({
  isAxiosError: (err: unknown): boolean =>
    typeof err === 'object' &&
    err !== null &&
    (err as { isAxiosError?: boolean }).isAxiosError === true,
}));

describe('login-helpers base64url', () => {
  it('should round-trip a buffer through base64url encode/decode', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    const encoded = toBase64Url(bytes.buffer);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
    const decoded = fromBase64Url(encoded);
    expect([...decoded]).toEqual([...bytes]);
  });

  it('should decode a base64url string that requires padding', () => {
    // "fw" decodes to a single byte (0x7f) and needs '==' padding restored.
    const decoded = fromBase64Url('fw');
    expect([...decoded]).toEqual([0x7f]);
  });

  it('should restore the -/_ to +// substitutions on decode', () => {
    // 0xFB,0xFF -> standard base64 "+/8" contains both '+' and '/' which the
    // url-safe variant encodes as '-' and '_'.
    const encoded = toBase64Url(new Uint8Array([0xfb, 0xff]).buffer);
    expect(encoded).toBe('-_8');
    expect([...fromBase64Url(encoded)]).toEqual([0xfb, 0xff]);
  });
});

describe('serializeCredential', () => {
  function makeBuffer(bytes: readonly number[]): ArrayBuffer {
    return new Uint8Array(bytes).buffer;
  }

  it('should serialize a credential with a user handle', () => {
    const credential = {
      id: 'cred-id',
      type: 'public-key',
      rawId: makeBuffer([1, 2, 3]),
      response: {
        authenticatorData: makeBuffer([4, 5]),
        clientDataJSON: makeBuffer([6, 7]),
        signature: makeBuffer([8, 9]),
        userHandle: makeBuffer([10, 11]),
      },
    } as unknown as PublicKeyCredential;

    const json = JSON.parse(serializeCredential(credential));
    expect(json.id).toBe('cred-id');
    expect(json.type).toBe('public-key');
    expect(json.rawId).toBe(toBase64Url(makeBuffer([1, 2, 3])));
    expect(json.response.userHandle).toBe(toBase64Url(makeBuffer([10, 11])));
  });

  it('should serialize a credential without a user handle as null', () => {
    const credential = {
      id: 'cred-id',
      type: 'public-key',
      rawId: makeBuffer([1]),
      response: {
        authenticatorData: makeBuffer([2]),
        clientDataJSON: makeBuffer([3]),
        signature: makeBuffer([4]),
        userHandle: null,
      },
    } as unknown as PublicKeyCredential;

    const json = JSON.parse(serializeCredential(credential));
    expect(json.response.userHandle).toBeNull();
  });
});

describe('redirectTo / redirectToReturnUrl', () => {
  const hrefSpy = vi.fn();

  beforeEach(() => {
    hrefSpy.mockClear();
    Object.defineProperty(globalThis, 'location', {
      value: { search: '', href: '' },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis.location, 'href', { set: hrefSpy, get: () => '' });
  });

  it('should set location.href on redirectTo', () => {
    redirectTo('/somewhere');
    expect(hrefSpy).toHaveBeenCalledWith('/somewhere');
  });

  it('should redirect to a safe returnUrl from the query string', () => {
    Object.defineProperty(globalThis, 'location', {
      value: { search: '?returnUrl=/connect/authorize', href: '' },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis.location, 'href', { set: hrefSpy, get: () => '' });
    redirectToReturnUrl();
    expect(hrefSpy).toHaveBeenCalledWith('/connect/authorize');
  });

  it('should fall back to / for an unsafe returnUrl', () => {
    Object.defineProperty(globalThis, 'location', {
      value: { search: '?returnUrl=https://evil.tld', href: '' },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis.location, 'href', { set: hrefSpy, get: () => '' });
    redirectToReturnUrl();
    expect(hrefSpy).toHaveBeenCalledWith('/');
  });
});

describe('handleLoginError', () => {
  it('should surface InvalidCredentials for a 401 axios error', () => {
    const setError = vi.fn();
    const t = (key: string) => key;
    handleLoginError({ isAxiosError: true, response: { status: 401 } }, setError, t);
    expect(setError).toHaveBeenCalledWith('Auth.HeadlessLogin.InvalidCredentials');
  });

  it('should surface UnexpectedError for a non-401 axios error', () => {
    const setError = vi.fn();
    const t = (key: string) => key;
    handleLoginError({ isAxiosError: true, response: { status: 500 } }, setError, t);
    expect(setError).toHaveBeenCalledWith('Auth.HeadlessLogin.UnexpectedError');
  });

  it('should surface UnexpectedError for an axios error with no response', () => {
    const setError = vi.fn();
    const t = (key: string) => key;
    handleLoginError({ isAxiosError: true }, setError, t);
    expect(setError).toHaveBeenCalledWith('Auth.HeadlessLogin.UnexpectedError');
  });

  it('should surface UnexpectedError for a non-axios error', () => {
    const setError = vi.fn();
    const t = (key: string) => key;
    handleLoginError(new Error('boom'), setError, t);
    expect(setError).toHaveBeenCalledWith('Auth.HeadlessLogin.UnexpectedError');
  });
});
