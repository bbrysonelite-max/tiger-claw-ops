/**
 * Tiger Bot Scout - Gateway Router Tests
 * Tests for the Virtual Fleet Router (Gateway)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock BullMQ before importing FleetRouter
const addJobMock = vi.fn();
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: addJobMock,
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock ioredis
vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      quit: vi.fn().mockResolvedValue(undefined),
      status: 'ready',
    })),
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
      update_id: 999,
      message: { text: 'Hello Bot', chat: { id: 123 } }
    };

    await router.handleWebhook(tokenHash, updatePayload);

    expect(addJobMock).toHaveBeenCalledWith(
      'inbound_webhook',
      { hash: tokenHash, update: updatePayload },
      expect.any(Object)
    );
  });

  it('should not crash on malformed body', async () => {
    const tokenHash = 'valid_hash';
    const emptyPayload = {};

    await expect(router.handleWebhook(tokenHash, emptyPayload))
      .resolves.not.toThrow();
  });

  it('should generate unique job IDs based on update_id', async () => {
    const tokenHash = 'test_hash';
    
    await router.handleWebhook(tokenHash, { update_id: 100 });
    await router.handleWebhook(tokenHash, { update_id: 101 });

    expect(addJobMock).toHaveBeenCalledTimes(2);
    
    // Verify different job IDs were used
    const firstCall = addJobMock.mock.calls[0];
    const secondCall = addJobMock.mock.calls[1];
    
    expect(firstCall[2].jobId).toBe('test_hash-100');
    expect(secondCall[2].jobId).toBe('test_hash-101');
  });

  it('should handle null update gracefully', async () => {
    const tokenHash = 'null_test';

    await expect(router.handleWebhook(tokenHash, null))
      .resolves.not.toThrow();

    expect(addJobMock).toHaveBeenCalledWith(
      'inbound_webhook',
      { hash: tokenHash, update: {} },
      expect.any(Object)
    );
  });

  it('should handle undefined update gracefully', async () => {
    const tokenHash = 'undefined_test';

    await expect(router.handleWebhook(tokenHash, undefined))
      .resolves.not.toThrow();
  });

  it('should queue Stripe checkout with correct data', async () => {
    const session = {
      id: 'cs_test_123',
      customer: 'cus_abc',
      customer_email: 'test@example.com',
      customer_details: {
        name: 'John Doe',
        email: 'test@example.com',
      },
    };

    const jobId = await router.handleStripeCheckout(session);

    expect(jobId).toBe('provision-cs_test_123');
    expect(addJobMock).toHaveBeenCalledWith(
      'provision_bot',
      {
        stripeId: 'cus_abc',
        email: 'test@example.com',
        name: 'John Doe',
      },
      expect.any(Object)
    );
  });

  it('should return null for null Stripe session', async () => {
    const jobId = await router.handleStripeCheckout(null);
    expect(jobId).toBeNull();
  });

  it('should handle Stripe session with minimal data', async () => {
    const session = {
      id: 'cs_minimal',
    };

    const jobId = await router.handleStripeCheckout(session);

    expect(jobId).toBe('provision-cs_minimal');
    expect(addJobMock).toHaveBeenCalledWith(
      'provision_bot',
      {
        stripeId: 'cs_minimal',
        email: '',
        name: 'New Customer',
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
    const tokenHash = 'hash-with_special.chars';
    const update = { update_id: 1 };

    await expect(router.handleWebhook(tokenHash, update))
      .resolves.not.toThrow();
  });

  it('should handle very long token hash', async () => {
    const tokenHash = 'a'.repeat(256);
    const update = { update_id: 1 };

    await expect(router.handleWebhook(tokenHash, update))
      .resolves.not.toThrow();
  });

  it('should handle update with nested objects', async () => {
    const tokenHash = 'nested_test';
    const update = {
      update_id: 500,
      message: {
        message_id: 1,
        chat: { id: 123, type: 'private' },
        from: { id: 456, first_name: 'Test', is_bot: false },
        text: 'Hello',
        entities: [{ type: 'bot_command', offset: 0, length: 6 }],
      },
    };

    await router.handleWebhook(tokenHash, update);

    expect(addJobMock).toHaveBeenCalledWith(
      'inbound_webhook',
      { hash: tokenHash, update },
      expect.any(Object)
    );
  });

  it('should handle callback_query updates', async () => {
    const tokenHash = 'callback_test';
    const update = {
      update_id: 600,
      callback_query: {
        id: 'callback123',
        from: { id: 789, first_name: 'User', is_bot: false },
        data: 'action_button',
      },
    };

    await router.handleWebhook(tokenHash, update);

    expect(addJobMock).toHaveBeenCalledWith(
      'inbound_webhook',
      { hash: tokenHash, update },
      expect.any(Object)
    );
  });
});
