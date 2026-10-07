import { DeviceStore } from '../../device-manager/store.js';
import { DiscoveryManager } from '../../discovery/manager.js';
import { PairingManager } from '../../device-manager/pairing.js';
import { UI } from '../ui.js';
import { bold, green, yellow, dim, gray, red, symbols, cyan } from '../../shared/ansi.js';
import { Logger } from '../../shared/logger.js';

export async function listDevicesCommand(options: { json?: boolean } = {}): Promise<void> {
  const devices = DeviceStore.listDevices();

  if (options.json) {
    console.log(JSON.stringify(devices, null, 2));
    return;
  }

  if (devices.length === 0) {
    console.log(dim('\nNo devices paired yet. Run: android-sync devices discover\n'));
    return;
  }

  console.log(`\n${bold('Paired Devices')} (${devices.length})\n`);

  for (const dev of devices) {
    const isConn = dev.status === 'connected';
    const statusDot = isConn ? green(symbols.connected) : gray(symbols.disconnected);
    const statusText = isConn ? green('Connected') : gray('Disconnected');

    console.log(`  ${symbols.phone} ${bold(dev.name)} ${dim(`(${dev.id})`)}`);
    console.log(`     Address:      ${dev.host}:${dev.port}`);
    console.log(`     Status:       ${statusDot} ${statusText}`);
    console.log(`     Capabilities: ${dim(dev.capabilities.join(', '))}`);
    console.log(`     Paired:       ${dim(new Date(dev.pairedAt).toLocaleDateString())}`);
    console.log('');
  }
}

export async function discoverDevicesCommand(options: { json?: boolean; timeout?: number } = {}): Promise<void> {
  const manager = new DiscoveryManager();
  const timeoutMs = (options.timeout || 4) * 1000;

  let discovered = [];
  if (!options.json) {
    discovered = await UI.withSpinner('Scanning local network for Android devices...', () =>
      manager.discover(timeoutMs)
    );
  } else {
    discovered = await manager.discover(timeoutMs);
  }

  if (options.json) {
    console.log(JSON.stringify(discovered, null, 2));
    return;
  }

  if (discovered.length === 0) {
    console.log(yellow('\nNo Android devices found on the local network.'));
    console.log(dim('Tips:'));
    console.log(dim(' 1. Ensure phone is on the same Wi-Fi network.'));
    console.log(dim(' 2. Ensure Termux is running with SSH server: sshd'));
    console.log(dim(' 3. Run "android-sync-bridge --daemon" on Android.\n'));
    return;
  }

  console.log(`\n${bold('Discovered Devices')} (${discovered.length})\n`);

  for (const dev of discovered) {
    const pairedTag = dev.isPaired ? green('[Paired]') : yellow('[Available to pair]');
    console.log(`  ${symbols.phone} ${bold(dev.name)} ${pairedTag}`);
    console.log(`     Address: ${dev.host}:${dev.port}`);
    console.log(`     Method:  ${dev.source.toUpperCase()}`);
    console.log('');
  }
}

export async function pairDeviceCommand(
  host: string,
  options: { port?: number; name?: string; user?: string } = {}
): Promise<void> {
  if (!host) {
    host = await UI.prompt('Enter Android IP address');
  }

  let user: string | undefined = options.user;
  if (host.includes('@')) {
    const parts = host.split('@');
    user = parts[0];
    host = parts[1];
  }

  if (!user && process.stdin.isTTY) {
    user = await UI.prompt('Enter Termux username (run "whoami" in Termux)', 'u0_a440');
  }

  const port = options.port || 8022;

  console.log(dim(`\nPairing with Android device at ${user ? `${user}@` : ''}${host}:${port}...`));
  console.log(dim(`Note: If prompted for password, enter your Termux password (run 'passwd' on your phone to set/change it).\n`));

  try {
    const device = await PairingManager.pairDevice({
      host,
      port,
      user,
      name: options.name,
      onFingerprintPrompt: async (fingerprint, targetHost) => {
        console.log(`\n${bold('SSH Host Fingerprint:')} ${cyan(fingerprint)}`);
        return UI.confirm(`Accept device at ${targetHost}:${port}?`, true);
      },
      onManualKeyPrompt: async (pubKey, targetHost, targetPort) => {
        console.log(`\n${yellow('Manual SSH Key Setup:')}`);
        console.log(`Please run this on Termux to allow key authentication:`);
        console.log(cyan(`echo "${pubKey}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`));
        return UI.confirm('Have you added the key on Android?', true);
      },
    });

    console.log(`\n${green(symbols.check)} ${bold(`Successfully paired with ${device.name}`)}`);
    console.log(`Run ${cyan(`android-sync connect ${device.id}`)} to start sync.\n`);
  } catch (err) {
    console.error(`\n${red(symbols.cross)} Pairing failed: ${(err as Error).message}\n`);
    process.exit(1);
  }
}

export async function removeDeviceCommand(id: string): Promise<void> {
  const removed = DeviceStore.removeDevice(id);
  if (removed) {
    console.log(green(`${symbols.check} Removed device ${id}`));
  } else {
    console.log(red(`Device not found: ${id}`));
  }
}
