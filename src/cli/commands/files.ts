import * as path from 'node:path';
import { DeviceStore } from '../../device-manager/store.js';
import { CapabilityManager } from '../../capabilities/manager.js';
import { SshClient } from '../../transport/ssh.js';
import { bold, green, yellow, dim, gray, red, symbols, cyan } from '../../shared/ansi.js';
import type { DeviceRecord } from '../../protocol/types.js';

export async function filesCommand(
  action: 'list' | 'pull' | 'push',
  args: { remotePath?: string; localPath?: string; deviceId?: string } = {}
): Promise<void> {
  const devices = DeviceStore.listDevices();
  let device: DeviceRecord | undefined;

  if (args.deviceId) {
    device = DeviceStore.getDevice(args.deviceId);
  } else if (devices.length > 0) {
    device = devices[0];
  }

  if (!device) {
    console.error(red('No device found. Pair one first: android-sync devices pair <ip>'));
    process.exit(1);
  }

  if (action === 'list') {
    const targetDir = args.remotePath || '/sdcard';
    const ssh = new SshClient(device);
    const res = await ssh.exec(`ls -la '${targetDir}' 2>/dev/null`, 10000);

    if (res.code === 0) {
      console.log(`\n${bold(`Files on ${device.name}: ${targetDir}`)}\n`);
      console.log(res.stdout);
    } else {
      console.error(red(`Failed to list directory: ${res.stderr}`));
    }
  } else if (action === 'pull') {
    if (!args.remotePath) {
      console.error(red('Missing remote path to pull. Usage: android-sync files pull <remotePath> [localPath]'));
      process.exit(1);
    }
    const localTarget = args.localPath || path.basename(args.remotePath);
    try {
      await CapabilityManager.pullFile(device, args.remotePath, localTarget);
      console.log(`${green(symbols.check)} Pulled ${args.remotePath} -> ${localTarget}`);
    } catch (err) {
      console.error(red(`Failed to pull file: ${(err as Error).message}`));
    }
  } else if (action === 'push') {
    if (!args.localPath) {
      console.error(red('Missing local path to push. Usage: android-sync files push <localPath> [remotePath]'));
      process.exit(1);
    }
    const remoteTarget = args.remotePath || `/sdcard/Download/${path.basename(args.localPath)}`;
    try {
      await CapabilityManager.pushFile(device, args.localPath, remoteTarget);
      console.log(`${green(symbols.check)} Pushed ${args.localPath} -> ${remoteTarget}`);
    } catch (err) {
      console.error(red(`Failed to push file: ${(err as Error).message}`));
    }
  }
}
