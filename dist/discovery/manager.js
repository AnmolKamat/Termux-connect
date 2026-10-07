import { EventEmitter } from 'node:events';
import { UdpScanner } from './udp.js';
import { MdnsScanner } from './mdns.js';
import { DeviceStore } from '../device-manager/store.js';
import { Logger } from '../shared/logger.js';
export class DiscoveryManager extends EventEmitter {
    udpScanner = new UdpScanner();
    mdnsScanner = new MdnsScanner();
    /**
     * Performs a discovery scan across UDP and mDNS concurrently.
     */
    async discover(timeoutMs = 4000) {
        Logger.info(`Scanning local network for Android devices (${timeoutMs / 1000}s)...`);
        const pairedDevices = DeviceStore.listDevices();
        const map = new Map();
        const enrich = (dev) => {
            const paired = pairedDevices.find((p) => p.host === dev.host || p.id === dev.id || p.name.toLowerCase() === dev.name.toLowerCase());
            return {
                ...dev,
                isPaired: !!paired,
                pairedId: paired?.id,
            };
        };
        this.udpScanner.on('device', (dev) => {
            const enriched = enrich(dev);
            const key = `${enriched.host}:${enriched.port}`;
            if (!map.has(key)) {
                map.set(key, enriched);
                this.emit('device', enriched);
            }
        });
        this.mdnsScanner.on('device', (dev) => {
            const enriched = enrich(dev);
            const key = `${enriched.host}:${enriched.port}`;
            if (!map.has(key)) {
                map.set(key, enriched);
                this.emit('device', enriched);
            }
        });
        // Run both scans concurrently
        const [udpResults, mdnsResults] = await Promise.all([
            this.udpScanner.scan(timeoutMs),
            this.mdnsScanner.scan(timeoutMs),
        ]);
        for (const d of [...udpResults, ...mdnsResults]) {
            const key = `${d.host}:${d.port}`;
            if (!map.has(key)) {
                map.set(key, enrich(d));
            }
        }
        const all = Array.from(map.values());
        Logger.info(`Discovery complete. Found ${all.length} device(s).`);
        return all;
    }
    stop() {
        this.udpScanner.stop();
        this.mdnsScanner.stop();
    }
}
//# sourceMappingURL=manager.js.map