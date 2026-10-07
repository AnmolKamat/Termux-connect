import { DeviceStore, ConfigStore } from '../../device-manager/store.js';
import { runCommand } from '../../shared/exec.js';
import { bold, green, dim, gray, red, symbols } from '../../shared/ansi.js';
import { PathManager } from '../../shared/config.js';
export async function statusCommand(options = {}) {
    const devices = DeviceStore.listDevices();
    const config = ConfigStore.getConfig();
    // Check launchd service status on macOS
    let serviceRunning = false;
    let servicePid;
    if (process.platform === 'darwin') {
        const res = await runCommand('launchctl', ['list']);
        const match = res.stdout.match(/(\d+|-)\s+\S+\s+com\.android-sync\.agent/);
        if (match) {
            serviceRunning = true;
            if (match[1] !== '-') {
                servicePid = parseInt(match[1], 10);
            }
        }
    }
    const payload = {
        devicesCount: devices.length,
        devices: devices.map((d) => ({
            id: d.id,
            name: d.name,
            host: d.host,
            port: d.port,
            status: d.status || 'disconnected',
            lastSeen: d.lastSeen,
        })),
        service: {
            platform: process.platform,
            running: serviceRunning,
            pid: servicePid,
        },
        config: {
            autoConnect: config.autoConnect,
            notificationsEnabled: config.notificationsEnabled,
            soundEnabled: config.soundEnabled,
        },
        paths: {
            configDir: PathManager.getBaseDir(),
        },
    };
    if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
    }
    console.log(`\n${bold('Android Bridge Status')}\n`);
    console.log(`  Background Service: ${serviceRunning ? green('Active (Running)') : gray('Inactive (Manual)')}`);
    if (servicePid) {
        console.log(`  Process ID:         ${dim(String(servicePid))}`);
    }
    console.log(`  Notifications:      ${config.notificationsEnabled ? green('Enabled') : red('Disabled')}`);
    console.log(`  Sound:              ${config.soundEnabled ? green('Enabled') : gray('Disabled')}`);
    console.log(`  Config Dir:         ${dim(PathManager.getBaseDir())}`);
    console.log(`\n${bold('Devices')} (${devices.length})`);
    if (devices.length === 0) {
        console.log(dim('  No paired devices.\n'));
    }
    else {
        for (const d of devices) {
            const isConn = d.status === 'connected';
            const dot = isConn ? green(symbols.connected) : gray(symbols.disconnected);
            console.log(`  ${dot} ${bold(d.name)} (${d.host}:${d.port}) - ${isConn ? green('Connected') : gray('Disconnected')}`);
        }
        console.log('');
    }
}
//# sourceMappingURL=status.js.map