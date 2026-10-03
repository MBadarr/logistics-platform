import { createServer, type Server } from 'node:http';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { AuthService } from './auth.service.js';
import type { DatabaseService } from '../database/database.service.js';

describe('Neon authentication', () => {
  let server: Server;
  let origin: string;
  let keys: Awaited<ReturnType<typeof generateKeyPair>>;
  let service: AuthService;
  const account = { id: 'user-1', name: 'Alex', email: 'alex@example.com', banned: false };
  const execute = vi.fn();
  beforeAll(async () => {
    keys = await generateKeyPair('EdDSA');
    const publicKey = await exportJWK(keys.publicKey);
    server = createServer((request, response) => {
      if (request.url !== '/neondb/auth/.well-known/jwks.json') { response.writeHead(404).end(); return; }
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ keys: [{ ...publicKey, kid: 'test', alg: 'EdDSA' }] }));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing server address');
    origin = 'http://127.0.0.1:' + address.port;
    vi.stubEnv('NEON_AUTH_BASE_URL', origin + '/neondb/auth');
    vi.stubEnv('NEON_AUTH_JWKS_URL', '');
    vi.stubEnv('NEON_AUTH_AUDIENCE', '');
    service = new AuthService({ db: { execute } } as unknown as DatabaseService);
  });
  beforeEach(() => { execute.mockReset(); execute.mockResolvedValue({ rows: [account] }); });
  afterAll(async () => {
    vi.unstubAllEnvs();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });
  async function token(issuer = origin, audience = origin, subject = account.id, expiration = '15m') {
    return new SignJWT({}).setProtectedHeader({ alg: 'EdDSA', kid: 'test' })
      .setSubject(subject).setIssuer(issuer).setAudience(audience)
      .setIssuedAt().setExpirationTime(expiration).sign(keys.privateKey);
  }
  it('accepts a signed JWT with the Neon origin and reads the managed account', async () => {
    await expect(service.currentUser(await token())).resolves.toEqual({ id: account.id, name: account.name, email: account.email });
    expect(execute).toHaveBeenCalledOnce();
  });
  it('rejects missing and forged tokens without querying the database', async () => {
    await expect(service.currentUser()).rejects.toThrow('Please sign in');
    await expect(service.currentUser('forged')).rejects.toThrow('expired');
    expect(execute).not.toHaveBeenCalled();
  });
  it('rejects the full URL as issuer, wrong audience, expiry, and anonymous subjects', async () => {
    for (const value of [await token(origin + '/neondb/auth'), await token(origin, 'other'), await token(origin, origin, account.id, '-1m'), await token(origin, origin, 'anonymous')]) {
      await expect(service.currentUser(value)).rejects.toThrow('expired');
    }
    expect(execute).not.toHaveBeenCalled();
  });
  it('rejects missing and banned accounts even with a valid signature', async () => {
    execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ ...account, banned: true }] });
    await expect(service.currentUser(await token())).rejects.toThrow('Please sign in');
    await expect(service.currentUser(await token())).rejects.toThrow('Please sign in');
  });
});
