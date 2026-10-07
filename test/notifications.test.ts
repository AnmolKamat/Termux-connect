import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { NotificationFilter } from '../dist/notifications/filter.js';
import { ConfigStore } from '../dist/device-manager/store.js';
import type { DeviceRecord, NotificationPayload } from '../dist/protocol/types.js';

describe('Notification Filtering', () => {
  const sampleNotification: NotificationPayload = {
    event: 'notification.created',
    deviceId: 'test-device',
    package: 'com.whatsapp',
    app: 'WhatsApp',
    title: 'John',
    body: 'Hello',
    timestamp: Date.now(),
    notificationId: 'notif-1',
  };

  it('allows notification when whitelist matches', () => {
    ConfigStore.updateConfig({ notificationsEnabled: true });

    const device: DeviceRecord = {
      id: 'test-device',
      name: 'Phone',
      host: '127.0.0.1',
      port: 8022,
      capabilities: ['notifications'],
      pairedAt: new Date().toISOString(),
      notificationFilter: {
        enabled: true,
        whitelist: ['whatsapp'],
      },
    };

    assert.strictEqual(NotificationFilter.shouldDisplay(sampleNotification, device), true);
  });

  it('blocks notification when blacklisted', () => {
    ConfigStore.updateConfig({ notificationsEnabled: true });

    const device: DeviceRecord = {
      id: 'test-device',
      name: 'Phone',
      host: '127.0.0.1',
      port: 8022,
      capabilities: ['notifications'],
      pairedAt: new Date().toISOString(),
      notificationFilter: {
        enabled: true,
        blacklist: ['whatsapp'],
      },
    };

    assert.strictEqual(NotificationFilter.shouldDisplay(sampleNotification, device), false);
  });

  it('blocks notification when globally disabled', () => {
    ConfigStore.updateConfig({ notificationsEnabled: false });
    assert.strictEqual(NotificationFilter.shouldDisplay(sampleNotification), false);
    ConfigStore.updateConfig({ notificationsEnabled: true });
  });
});
