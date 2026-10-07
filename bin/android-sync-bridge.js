#!/usr/bin/env node

import { AndroidBridgeServer } from '../dist/android/server.js';
import { AndroidSystem } from '../dist/android/system.js';
import { DEFAULT_SSH_PORT } from '../dist/protocol/constants.js';

const args = process.argv.slice(2);

async function main() {
  const isStream = args.includes('--stream') || args.includes('-s');
  const isDaemon = args.includes('--daemon') || args.includes('-d');
  const isStatus = args.includes('--status');
  const portIdx = args.findIndex((a) => a === '--port' || a === '-p');
  const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : DEFAULT_SSH_PORT;

  if (isStream) {
    const server = new AndroidBridgeServer();
    await server.startStream();
    return;
  }

  if (isStatus) {
    const info = await AndroidSystem.getDeviceInfo();
    const battery = await AndroidSystem.getBattery();
    console.log('\n--- Android Bridge Status ---');
    console.log(`Device:       ${info.name} (${info.model})`);
    console.log(`Manufacturer: ${info.manufacturer}`);
    console.log(`Android:      ${info.androidVersion}`);
    console.log(`Battery:      ${battery.level}% (${battery.plugged ? 'Plugged' : 'Unplugged'}, ${battery.status})`);
    console.log(`SSH Port:     ${port}`);
    console.log('-----------------------------\n');
    return;
  }

  if (isDaemon || args.length === 0) {
    const server = new AndroidBridgeServer();
    await server.startDaemon(port);

    process.on('SIGINT', () => {
      server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      server.stop();
      process.exit(0);
    });
    return;
  }

  console.log(`
android-sync-bridge — Android side bridge agent

Usage:
  android-sync-bridge --daemon         Start background discovery beacon
  android-sync-bridge --stream         Run streaming RPC protocol over stdio (invoked by SSH)
  android-sync-bridge --status         Display local device status and specs
  android-sync-bridge --port <port>    Specify custom SSH port (default 8022)
`);
}

main().catch((err) => {
  console.error('Fatal bridge error:', err);
  process.exit(1);
});
