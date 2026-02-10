/**
 * Tiger Bot Scout - Gateway Router Tests
 * Tests for the Virtual Fleet Router (Gateway)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock BullMQ before importing FleetRouter
const addJobMock = vi.fn().mockImplementation((name, data) => {
  return Promise.resolve({ id: `${name}-${data.hash || data.stripeId || 'job'}` });
});

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: addJobMock,
    close: vi.fn().mockResolvedValue(undefined),
    getJobCounts: vi.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
  })),
}));

// Mock ioredis - must use factory function to avoid hoisting issues
vi.mock('ioredis', () => {
  const mockRedis = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    quit: vi.fn().mockResolvedValue(undefined),
    status: 'ready',
  }));
  return {
    default: mockRedis,
    Redis: mockRedis,
  };
});

import { FleetRouter } from '../src/gateway/router.js';

describe('Virtual Fleet Router (Gateway)', () => {
  let router: FleetRouter;

  beforeEach(() => {
    vi.clearAllMocks();
    router = new FleetRouter();
  });

  it('should accept a webhook and queue it without processing logic', async () => {
    const tokenHash = 'a1b2c3d4';
    const updatePayload = {
      update_id: 123456,
      message: {
        message_id: 1,
        chat: { id: 99999 },
        text: '/start',
      },
    };

    const jobId = await router.handleWebhook(tokenHash, updatePayload);

    expect(jobId).toBeDefined();
    expect(addJobMock).toHaveBeenCalledWith(
      'telegram-update',
      {
        hash: tokenHash,
        update: updatePayload,
      },
      expect.any(Object)
    );
  });

  it('should not crash on malformed body', async () => {
    const tokenHash = 'a1b2c3d4';
    const emptyPayload = {};

    await expect(router.handleWebhook(tokenHash, emptyPayload))
      .resolves.toBeDefined();
  });

  it('should generate unique job IDs based on update_id', async () => {
    const tokenHash = 'a1b2c3d4';

    await router.handleWebhook(tokenHash, { update_id: 100 });
    await router.handleWebhook(tokenHash, { update_id: 101 });

    expect(addJobMock).toHaveBeenCalledTimes(2);
  });

  it('should handle null update gracefully', async () => {
    const tokenHash = 'a1b2c3d4';

    await expect(router.handleWebhook(tokenHash, null))
      .rejects.toThrow('Invalid update payload');
  });

  it('should handle undefined update gracefully', async () => {
    const tokenHash = 'a1b2c3d4';

    await expect(router.handleWebhook(tokenHash, undefined))
      .rejects.toThrow('Invalid update payload');
  });

  it('should queue Stripe checkout with correct data', async () => {
    const session = {
      customer: 'cus_123456',
      customer_email: 'user@example.com',
      customer_details: { name: 'Test User' },
    };

    const jobId = await router.handleStripeCheckout(session);

    expect(jobId).toBeDefined();
    expect(addJobMock).toHaveBeenCalledWith(
      'provision-bot',
      {
        stripeId: 'cus_123456',
        email: 'user@example.com',
        name: 'Test User',
      },
      expect.any(Object)
    );
  });

  it('should return skipped for null Stripe session', async () => {
    const jobId = await router.handleStripeCheckout(null);
    expect(jobId).toBe('skipped-null-session');
  });

  it('should handle Stripe session with minimal data', async () => {
    const session = {
      customer: 'cus_minimal',
    };

    const jobId = await router.handleStripeCheckout(session);

    expect(jobId).toBeDefined();
    expect(addJobMock).toHaveBeenCalledWith(
      'provision-bot',
      {
        stripeId: 'cus_minimal',
        email: '',
        name: 'Customer',
      },
      expect.any(Object)
    );
  });
});

describe('FleetRouter - Edge Cases', () => {
  let router: FleetRouter;

  beforeEach(() => {
    vi.clearAllMocks();
    router = new FleetRouter();
  });

  it('should handle special characters in token hash', async () => {
    const tokenHash = 'abc-123_xyz';
    const update = { update_id: 1 };

    await expect(router.handleWebhook(tokenHash, update))
      .resolves.toBeDefined();
  });

  it('should handle very long token hash', async () => {
    const tokenHash = 'a'.repeat(256);
    const update = { update_id: 1 };

    await expect(router.handleWebhook(tokenHash, update))
      .resolves.toBeDefined();
  });

  it('should handle update with nested objects', async () => {
    const tokenHash = 'test123';
    const update = {
      update_id: 1,
      message: {
        message_id: 1,
        from: {
          id: 12345,
          is_bot: false,
          first_name: 'Test',
          last_name: 'User',
        },
        chat: {
          id: 67890,
          type: 'private',
        },
        text: 'Hello bot!',
        entities: [{ type: 'bot_command', offset: 0, length: 6 }],
      },
    };

    await router.handleWebhook(tokenHash, update);

    expect(addJobMock).toHaveBeenCalledWith(
      'telegram-update',
      {
        hash: tokenHash,
        update,
      },
      expect.any(Object)
    );
  });

  it('should handle callback_query updates', async () => {
    const tokenHash = 'test123';
    const update = {
      update_id: 2,
      callback_query: {
        id: 'query123',
        from: { id: 12345, is_bot: false, first_name: 'Test' },
        data: 'button_click',
      },
    };

    await router.handleWebhook(tokenHash, update);

    expect(addJobMock).toHaveBeenCalledWith(
      'telegram-update',
      {
        hash: tokenHash,
        update,
      },
      expect.any(Object)
    );
  });
});
