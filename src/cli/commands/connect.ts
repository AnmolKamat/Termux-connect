import { DeviceStore, ConfigStore } from '../../device-manager/store.js';
import { ConnectionManager } from '../../transport/connection.js';
import { NotificationRenderer } from '../../notifications/renderer.js';
import { bold, green, yellow, dim, gray, red, symbols, cyan } from '../../shared/ansi.js';
import { Logger } from '../../shared/logger.js';
import type { DeviceRecord } from '../../protocol/types.js';

export async function connectCommand(deviceId?: string): Promise<ConnectionManager> {
  let device: DeviceRecord | undefined;

  if (deviceId) {
    device = DeviceStore.getDevice(deviceId);
    if (!device) {
      console.error(red(`Device not found: ${deviceId}`));
      process.exit(1);
    }
  } else {
    const config = ConfigStore.getConfig();
    if (config.defaultDeviceId) {
      device = DeviceStore.getDevice(config.defaultDeviceId);
    }

    if (!device) {
      const devices = DeviceStore.listDevices();
      if (devices.length === 0) {
        console.error(red('No paired devices found. Run: android-sync devices pair <ip>'));
        process.exit(1);
      }
      device = devices[0];
    }
  }

  console.log(`\n${bold('Android Bridge Session')}`);
  console.log(`Device:  ${symbols.phone} ${bold(device.name)} (${device.host}:${device.port})`);
  console.log(`Status:  ${yellow('Connecting...')}\n`);

  const conn = new ConnectionManager(device);

  conn.on('stateChange', (state) => {
    if (state === 'connected') {
      console.log(`${green(symbols.connected)} ${green('Connected')} to ${device!.name}`);
      console.log(`${dim('Syncing notifications in real-time. Press Ctrl+C to disconnect.')}\n`);
    } else if (state === 'reconnecting') {
      console.log(`${yellow(symbols.disconnected)} Connection lost. ${yellow('Reconnecting with exponential backoff...')}`);
    } else if (state === 'disconnected') {
      console.log(`${gray(symbols.disconnected)} Disconnected.`);
    }
  });

  conn.on('notification', async (notif) => {
    await NotificationRenderer.render(notif, device);
  });

  conn.on('error', (err) => {
    Logger.error(`Connection error: ${err.message}`);
  });

  process.on('SIGINT', () => {
    console.log(`\n${dim('Disconnecting...')}`);
    conn.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    conn.disconnect();
    process.exit(0);
  });

  await conn.connect();
  return conn;
}
