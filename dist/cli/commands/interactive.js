import { DeviceStore, ConfigStore } from '../../device-manager/store.js';
import { DiscoveryManager } from '../../discovery/manager.js';
import { PairingManager } from '../../device-manager/pairing.js';
import { UI } from '../ui.js';
import { connectCommand } from './connect.js';
import { infoCommand } from './info.js';
import { notificationsCommand } from './notifications.js';
import { clipboardCommand } from './clipboard.js';
import { filesCommand } from './files.js';
import { green, yellow, gray, red, symbols, cyan } from '../../shared/ansi.js';
export async function interactiveCommand() {
    while (true) {
        const devices = DeviceStore.listDevices();
        const config = ConfigStore.getConfig();
        const menuItems = [];
        // Devices section
        for (const dev of devices) {
            const isConn = dev.status === 'connected';
            const statusBadge = isConn ? green('● Connected') : gray('○ Disconnected');
            menuItems.push({
                label: `${symbols.phone} ${dev.name}`,
                value: `device:${dev.id}`,
                description: `${dev.host}:${dev.port} • ${dev.capabilities.join(', ')}`,
                badge: statusBadge,
            });
        }
        // Action items
        menuItems.push({
            label: '🔍 Discover & Pair New Device',
            value: 'action:discover',
            description: 'Scan local network for Android phones',
        });
        menuItems.push({
            label: '⚙️ Settings & Notification Controls',
            value: 'action:settings',
            description: `Notifications: ${config.notificationsEnabled ? 'ON' : 'OFF'} • Sound: ${config.soundEnabled ? 'ON' : 'OFF'}`,
        });
        menuItems.push({
            label: '📜 View Logs',
            value: 'action:logs',
            description: 'View recent connection and sync logs',
        });
        menuItems.push({
            label: '🚪 Quit',
            value: 'action:quit',
        });
        const choice = await UI.select('Android Bridge', menuItems);
        if (!choice || choice === 'action:quit') {
            console.log('\nGoodbye!\n');
            break;
        }
        if (choice === 'action:discover') {
            await handleDiscoverAndPair();
        }
        else if (choice === 'action:settings') {
            await handleSettings();
        }
        else if (choice === 'action:logs') {
            const { logsCommand } = await import('./logs.js');
            await logsCommand({ lines: 30 });
            await UI.prompt('\nPress Enter to return');
        }
        else if (choice.startsWith('device:')) {
            const deviceId = choice.slice(7);
            const dev = DeviceStore.getDevice(deviceId);
            if (dev) {
                await handleDeviceActions(dev);
            }
        }
    }
}
async function handleDiscoverAndPair() {
    const manager = new DiscoveryManager();
    const discovered = await UI.withSpinner('Scanning local network...', () => manager.discover(3500));
    if (discovered.length === 0) {
        console.log(yellow('\nNo Android devices found automatically.'));
        const manual = await UI.confirm('Would you like to pair manually by IP?', true);
        if (manual) {
            const ip = await UI.prompt('Enter Android IP address');
            const portStr = await UI.prompt('Enter SSH port', '8022');
            const port = parseInt(portStr, 10) || 8022;
            try {
                await PairingManager.pairDevice({
                    host: ip,
                    port,
                    onFingerprintPrompt: async (fp, host) => {
                        console.log(`\nHost Fingerprint: ${cyan(fp)}`);
                        return UI.confirm(`Accept device at ${host}:${port}?`, true);
                    },
                    onManualKeyPrompt: async (pubKey) => {
                        console.log(`\nPlease add this key to Termux ~/.ssh/authorized_keys:`);
                        console.log(cyan(pubKey));
                        return UI.confirm('Have you added the key on Android?', true);
                    },
                });
                console.log(green('\nDevice paired successfully!'));
            }
            catch (err) {
                console.error(red(`\nPairing failed: ${err.message}`));
            }
            await UI.prompt('\nPress Enter to continue');
        }
        return;
    }
    const items = discovered.map((d) => ({
        label: `${symbols.phone} ${d.name} ${d.isPaired ? green('[Paired]') : yellow('[Pairable]')}`,
        value: d.host,
        description: `${d.host}:${d.port} via ${d.source.toUpperCase()}`,
    }));
    items.push({ label: 'Cancel', value: 'cancel' });
    const selectedHost = await UI.select('Select Device to Pair', items);
    if (selectedHost && selectedHost !== 'cancel') {
        const dev = discovered.find((d) => d.host === selectedHost);
        try {
            await PairingManager.pairDevice({
                host: dev.host,
                port: dev.port,
                name: dev.name,
                onFingerprintPrompt: async (fp, h) => {
                    console.log(`\nHost Fingerprint: ${cyan(fp)}`);
                    return UI.confirm(`Accept device at ${h}?`, true);
                },
            });
            console.log(green('\nDevice paired successfully!'));
        }
        catch (err) {
            console.error(red(`\nPairing failed: ${err.message}`));
        }
        await UI.prompt('\nPress Enter to continue');
    }
}
async function handleDeviceActions(device) {
    while (true) {
        const actionItems = [
            {
                label: '🚀 Connect & Sync Notifications',
                value: 'connect',
                description: 'Start live bi-directional sync session',
            },
            {
                label: '🔔 View Active Notifications',
                value: 'notifications',
                description: 'List current notifications on phone',
            },
            {
                label: '📊 Device Info & Battery',
                value: 'info',
                description: 'Check battery status, hardware, and storage',
            },
            {
                label: '📋 Clipboard',
                value: 'clipboard',
                description: 'Read or send clipboard contents',
            },
            {
                label: '📁 Browse Files',
                value: 'files',
                description: 'Explore /sdcard files and transfer',
            },
            {
                label: '❌ Unpair Device',
                value: 'unpair',
                description: 'Remove this device from paired list',
            },
            {
                label: '⬅️ Back to Main Menu',
                value: 'back',
            },
        ];
        const action = await UI.select(device.name, actionItems);
        if (!action || action === 'back') {
            break;
        }
        if (action === 'connect') {
            await connectCommand(device.id);
            break;
        }
        else if (action === 'notifications') {
            await notificationsCommand(device.id, { watch: false });
            await UI.prompt('\nPress Enter to continue');
        }
        else if (action === 'info') {
            await infoCommand(device.id);
            await UI.prompt('\nPress Enter to continue');
        }
        else if (action === 'clipboard') {
            const clipAction = await UI.select('Clipboard Action', [
                { label: '📥 Get Phone Clipboard (and copy to Mac)', value: 'get' },
                { label: '📤 Send Text to Phone Clipboard', value: 'set' },
                { label: 'Cancel', value: 'cancel' },
            ]);
            if (clipAction === 'get') {
                await clipboardCommand({ get: true, deviceId: device.id });
            }
            else if (clipAction === 'set') {
                const text = await UI.prompt('Enter text to copy to phone');
                if (text) {
                    await clipboardCommand({ set: text, deviceId: device.id });
                }
            }
            await UI.prompt('\nPress Enter to continue');
        }
        else if (action === 'files') {
            await filesCommand('list', { remotePath: '/sdcard', deviceId: device.id });
            await UI.prompt('\nPress Enter to continue');
        }
        else if (action === 'unpair') {
            const confirm = await UI.confirm(`Are you sure you want to unpair ${device.name}?`, false);
            if (confirm) {
                DeviceStore.removeDevice(device.id);
                console.log(green(`\nRemoved device ${device.name}`));
                await UI.prompt('\nPress Enter to continue');
                break;
            }
        }
    }
}
async function handleSettings() {
    while (true) {
        const config = ConfigStore.getConfig();
        const items = [
            {
                label: `Notifications: ${config.notificationsEnabled ? green('Enabled') : red('Disabled')}`,
                value: 'toggle_notifications',
                description: 'Toggle macOS native notification display',
            },
            {
                label: `Sound: ${config.soundEnabled ? green('Enabled') : gray('Disabled')}`,
                value: 'toggle_sound',
                description: 'Play alert sound with notifications',
            },
            {
                label: `Auto-Connect: ${config.autoConnect ? green('Enabled') : gray('Disabled')}`,
                value: 'toggle_autoconnect',
                description: 'Automatically connect on startup',
            },
            {
                label: '⬅️ Back',
                value: 'back',
            },
        ];
        const choice = await UI.select('Settings', items);
        if (!choice || choice === 'back') {
            break;
        }
        if (choice === 'toggle_notifications') {
            ConfigStore.updateConfig({ notificationsEnabled: !config.notificationsEnabled });
        }
        else if (choice === 'toggle_sound') {
            ConfigStore.updateConfig({ soundEnabled: !config.soundEnabled });
        }
        else if (choice === 'toggle_autoconnect') {
            ConfigStore.updateConfig({ autoConnect: !config.autoConnect });
        }
    }
}
//# sourceMappingURL=interactive.js.map