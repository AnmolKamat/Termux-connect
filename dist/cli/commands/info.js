import { DeviceStore } from '../../device-manager/store.js';
import { SshClient } from '../../transport/ssh.js';
import { UI } from '../ui.js';
import { red, symbols } from '../../shared/ansi.js';
export async function infoCommand(deviceId, options = {}) {
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
    const ssh = new SshClient(device);
    const queryInfo = async () => {
        // Run termux-battery-status and getprop
        const [batteryRes, modelRes, releaseRes, storageRes] = await Promise.all([
            ssh.exec('termux-battery-status 2>/dev/null || echo "{}"', 6000),
            ssh.exec('getprop ro.product.model 2>/dev/null || uname -n', 6000),
            ssh.exec('getprop ro.build.version.release 2>/dev/null || echo "14+"', 6000),
            ssh.exec('df -h /sdcard 2>/dev/null | tail -n 1', 6000),
        ]);
        let battery = { percentage: 'Unknown', plugged: 'No', health: 'GOOD' };
        try {
            const parsed = JSON.parse(batteryRes.stdout);
            if (parsed.percentage !== undefined) {
                battery.percentage = `${parsed.percentage}%`;
                battery.plugged = parsed.plugged ? 'Yes' : 'No';
                battery.health = parsed.health || 'GOOD';
            }
        }
        catch {
            // Ignore
        }
        let storage = 'Unknown';
        if (storageRes.stdout.trim()) {
            const parts = storageRes.stdout.trim().split(/\s+/);
            if (parts.length >= 4) {
                storage = `${parts[2]} used / ${parts[1]} total (${parts[3]} free)`;
            }
        }
        return {
            name: device.name,
            model: modelRes.stdout.trim() || device.model || 'Android Device',
            androidVersion: releaseRes.stdout.trim() || '14+',
            host: `${device.host}:${device.port}`,
            battery: battery.percentage,
            charging: battery.plugged,
            batteryHealth: battery.health,
            storage,
            capabilities: device.capabilities.join(', '),
            pairedDate: new Date(device.pairedAt).toLocaleDateString(),
        };
    };
    try {
        let data;
        if (options.json) {
            data = await queryInfo();
            console.log(JSON.stringify(data, null, 2));
        }
        else {
            data = await UI.withSpinner(`Fetching device info for ${device.name}...`, queryInfo);
            console.log('');
            UI.renderTable(`📱 ${device.name}`, {
                Model: data.model,
                'Android Version': data.androidVersion,
                Address: data.host,
                Battery: `${symbols.battery} ${data.battery}`,
                Charging: data.charging,
                Health: data.batteryHealth,
                Storage: data.storage,
                Capabilities: data.capabilities,
                Paired: data.pairedDate,
            });
            console.log('');
        }
    }
    catch (err) {
        console.error(red(`Failed to query device: ${err.message}`));
    }
}
//# sourceMappingURL=info.js.map