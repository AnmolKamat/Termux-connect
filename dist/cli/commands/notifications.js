import { DeviceStore } from '../../device-manager/store.js';
import { ConnectionManager } from '../../transport/connection.js';
import { NotificationRenderer } from '../../notifications/renderer.js';
import { SshClient } from '../../transport/ssh.js';
import { bold, green, dim, gray, red, symbols } from '../../shared/ansi.js';
export async function notificationsCommand(deviceId, options = {}) {
    const devices = DeviceStore.listDevices();
    let device;
    if (deviceId) {
        device = DeviceStore.getDevice(deviceId);
    }
    else if (devices.length > 0) {
        device = devices[0];
    }
    if (!device) {
        console.error(red('No device found. Pair one first: android-sync devices pair <ip>'));
        process.exit(1);
    }
    // If list flag or default without watch: fetch current active notifications list
    if (!options.watch) {
        const ssh = new SshClient(device);
        const res = await ssh.exec('termux-notification-list 2>/dev/null', 5000);
        if (res.code !== 0 || !res.stdout.trim()) {
            console.log(dim(`No active notifications found on ${device.name}.`));
            return;
        }
        try {
            const items = JSON.parse(res.stdout);
            if (options.json) {
                console.log(JSON.stringify(items, null, 2));
                return;
            }
            console.log(`\n${bold(`Active Notifications on ${device.name}`)} (${items.length})\n`);
            for (const item of items) {
                if (item.packageName === 'com.termux')
                    continue;
                console.log(`  ${symbols.bell} ${bold(item.title || item.packageName)}`);
                console.log(`     ${item.content || '(no content)'}`);
                console.log(`     ${dim(item.packageName)} • ${dim(item.when || '')}\n`);
            }
            return;
        }
        catch {
            console.log(dim('Unable to parse active notifications.'));
            return;
        }
    }
    // Watch mode: start stream and display notifications live
    console.log(`\n${bold('Watching Android Notifications')} (${device.name})...`);
    console.log(dim('Notifications will appear here and in macOS Notification Center. Press Ctrl+C to stop.\n'));
    const conn = new ConnectionManager(device);
    conn.on('notification', async (notif) => {
        if (notif.event === 'notification.created') {
            console.log(`\n${green('● [NEW]')} ${bold(notif.app || notif.package)} — ${bold(notif.title)}`);
            console.log(`  ${notif.body}`);
            console.log(`  ${dim(new Date(notif.timestamp).toLocaleTimeString())}`);
            await NotificationRenderer.render(notif, device);
        }
        else if (notif.event === 'notification.removed') {
            console.log(`${gray('○ [CLEARED]')} Notification dismissed: ${dim(notif.notificationId)}`);
        }
    });
    process.on('SIGINT', () => {
        conn.disconnect();
        process.exit(0);
    });
    await conn.connect();
}
//# sourceMappingURL=notifications.js.map