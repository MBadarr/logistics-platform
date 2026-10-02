import { MailService } from './mail.service.js';

const { send, create } = vi.hoisted(() => ({ send: vi.fn(), create: vi.fn() }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
    constructor(key: string) {
      create(key);
    }
  },
}));

describe('Resend email delivery', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    vi.stubEnv('RESEND_FROM', 'Logistics <no-reply@example.com>');
    vi.clearAllMocks();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('starts without credentials but refuses sending until configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const mail = new MailService();
    expect(create).not.toHaveBeenCalled();
    await expect(
      mail.sendPasswordReset('alex@example.com', 'https://example.com/reset'),
    ).rejects.toThrow('RESEND_API_KEY is required');
    expect(send).not.toHaveBeenCalled();
  });

  it('sends the reset link using the configured sender', async () => {
    send.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    await new MailService().sendPasswordReset(
      'alex@example.com',
      'https://example.com/reset?token=test',
    );
    expect(create).toHaveBeenCalledWith('re_test_key');
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Logistics <no-reply@example.com>',
        to: 'alex@example.com',
        text: expect.stringContaining('https://example.com/reset?token=test'),
      }),
    );
  });

  it('rejects provider error responses and network failures', async () => {
    const mail = new MailService();
    send.mockResolvedValue({ data: null, error: { message: 'Invalid key' } });
    await expect(
      mail.sendPasswordReset('alex@example.com', 'https://example.com/reset'),
    ).rejects.toThrow('Resend email delivery failed');
    send.mockRejectedValue(new Error('Network unavailable'));
    await expect(
      mail.sendPasswordReset('alex@example.com', 'https://example.com/reset'),
    ).rejects.toThrow('Network unavailable');
  });
});
