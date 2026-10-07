import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { PathManager } from '../dist/shared/config.js';
import { DeviceStore, ConfigStore } from '../dist/device-manager/store.js';
import type { DeviceRecord } from '../dist/protocol/types.js';

describe('Device and Config Store', () => {
  const testDir = path.join(os.tmpdir(), `android-sync-test-${Date.now()}`);

  before(() => {
    PathManager.setBaseDir(testDir);
    PathManager.initialize();
  });

  it('saves and retrieves devices correctly', () => {
    const dev: DeviceRecord = {
      id: 'pixel-9-pro',
      name: 'Pixel 9 Pro',
      host: '192.168.1.50',
      port: 8022,
      capabilities: ['notifications', 'device'],
      pairedAt: new Date().toISOString(),
      status: 'disconnected',
    };

    DeviceStore.saveDevice(dev);

    const list = DeviceStore.listDevices();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, 'pixel-9-pro');

    const found = DeviceStore.getDevice('pixel-9-pro');
    assert.ok(found);
    assert.strictEqual(found.name, 'Pixel 9 Pro');

    DeviceStore.updateDeviceStatus('pixel-9-pro', 'connected');
    const updated = DeviceStore.getDevice('pixel-9-pro');
    assert.strictEqual(updated?.status, 'connected');

    const removed = DeviceStore.removeDevice('pixel-9-pro');
    assert.strictEqual(removed, true);
    assert.strictEqual(DeviceStore.listDevices().length, 0);
  });

  it('reads and updates configuration', () => {
    const config = ConfigStore.getConfig();
    assert.strictEqual(config.notificationsEnabled, true);

    ConfigStore.updateConfig({ notificationsEnabled: false, logLevel: 'debug' });
    const updated = ConfigStore.getConfig();
    assert.strictEqual(updated.notificationsEnabled, false);
    assert.strictEqual(updated.logLevel, 'debug');
  });
});
