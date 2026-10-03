import { StorageService } from './storage.service.js';

const { send, signedUrl } = vi.hoisted(() => ({ send: vi.fn(), signedUrl: vi.fn() }));
vi.mock('@aws-sdk/client-s3', async importOriginal => {
  const sdk = await importOriginal<typeof import('@aws-sdk/client-s3')>();
  return { ...sdk, S3Client: class { send = send; } };
});
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: signedUrl }));

describe('private Neon storage', () => {
  let storage: StorageService;
  beforeEach(() => {
    vi.stubEnv('S3_BUCKET', 'logistics');
    vi.stubEnv('AWS_ENDPOINT_URL_S3', 'https://storage.example.com');
    vi.stubEnv('AWS_REGION', 'us-east-2');
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'test');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'test');
    send.mockReset();
    signedUrl.mockReset();
    signedUrl.mockResolvedValue('https://storage.example.com/signed');
    storage = new StorageService();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('never signs another account or traversal key', async () => {
    for (const key of ['uploads/other-user/file.txt', 'uploads/user-1-other/file.txt', 'uploads/user-1/../other/file.txt', 'uploads/user-1/\\other.txt']) {
      await expect(storage.download('user-1', key)).rejects.toThrow('You cannot access this file');
    }
    expect(signedUrl).not.toHaveBeenCalled();
  });
  it('limits signed downloads to five minutes in the configured bucket', async () => {
    await expect(storage.download('user-1', 'uploads/user-1/document.txt')).resolves.toEqual({ url: 'https://storage.example.com/signed' });
    const [, command, options] = signedUrl.mock.calls[0]!;
    expect(command.input).toMatchObject({ Bucket: 'logistics', Key: 'uploads/user-1/document.txt' });
    expect(options).toEqual({ expiresIn: 300 });
  });
  it('scopes listing to the authenticated account and passes pagination', async () => {
    send.mockResolvedValue({ Contents: [], NextContinuationToken: 'next' });
    await expect(storage.list('user-1', 'cursor')).resolves.toEqual({ files: [], cursor: 'next' });
    expect(send.mock.calls[0]![0].input).toMatchObject({ Bucket: 'logistics', Prefix: 'uploads/user-1/', ContinuationToken: 'cursor', MaxKeys: 100 });
  });
});
