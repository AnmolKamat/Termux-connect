import { DeviceStore } from '../../device-manager/store.js';
import { SshClient } from '../../transport/ssh.js';
import { runCommand } from '../../shared/exec.js';
import { bold, green, yellow, dim, gray, red, symbols, cyan } from '../../shared/ansi.js';
import type { DeviceRecord } from '../../protocol/types.js';

export async function clipboardCommand(
  args: { get?: boolean; set?: string; sync?: boolean; deviceId?: string }
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

  const ssh = new SshClient(device);

  if (args.set) {
    const escaped = args.set.replace(/'/g, "'\\''");
    const res = await ssh.exec(`termux-clipboard-set '${escaped}'`);
    if (res.code === 0) {
      console.log(`${green(symbols.check)} Copied text to ${device.name}'s clipboard`);
    } else {
      console.error(red(`Failed to set clipboard: ${res.stderr}`));
    }
    return;
  }

  if (args.get || (!args.set && !args.sync)) {
    const res = await ssh.exec('termux-clipboard-get');
    if (res.code === 0) {
      const text = res.stdout;
      console.log(text);
      // Also copy to Mac clipboard using pbcopy if on macOS
      if (process.platform === 'darwin') {
        await runCommand('pbcopy', [], { input: text } as any);
      }
    } else {
      console.error(red(`Failed to get clipboard: ${res.stderr}`));
    }
  }
}
