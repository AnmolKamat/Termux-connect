import * as dgram from 'node:dgram';
import { EventEmitter } from 'node:events';
import { DEFAULT_UDP_PORT, DEFAULT_SSH_PORT } from '../protocol/constants.js';
import { Logger } from '../shared/logger.js';
/**
 * UDP Scanner that broadcasts discovery requests on the local network
 * and collects responses from Android devices running android-sync-bridge.
 */
export class UdpScanner extends EventEmitter {
    socket = null;
    isScanning = false;
    foundDevices = new Map();
    async scan(timeoutMs = 3000) {
        this.foundDevices.clear();
        this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        return new Promise((resolve) => {
            if (!this.socket) {
                return resolve([]);
            }
            this.isScanning = true;
            this.socket.on('error', (err) => {
                Logger.debug(`UDP scan error: ${err.message}`);
            });
            this.socket.on('message', (msg, rinfo) => {
                try {
                    const text = msg.toString('utf-8');
                    const data = JSON.parse(text);
                    const beacon = data.device || data;
                    if (beacon.id || beacon.name) {
                        const dev = {
                            id: beacon.id || `android-${rinfo.address}`,
                            name: beacon.name || beacon.model || 'Android Device',
                            model: beacon.model || 'Android',
                            host: rinfo.address,
                            port: beacon.port || DEFAULT_SSH_PORT,
                            user: beacon.user,
                            capabilities: beacon.capabilities || ['notifications', 'device'],
                            source: 'udp',
                        };
                        const key = `${dev.host}:${dev.port}`;
                        if (!this.foundDevices.has(key)) {
                            this.foundDevices.set(key, dev);
                            this.emit('device', dev);
                        }
                    }
                }
                catch {
                    // Ignore invalid UDP packet
                }
            });
            this.socket.bind(0, () => {
                if (!this.socket)
                    return;
                try {
                    this.socket.setBroadcast(true);
                    const probe = JSON.stringify({ type: 'discover', timestamp: Date.now() });
                    const buffer = Buffer.from(probe);
                    // Broadcast probe multiple times within the timeout window
                    this.socket.send(buffer, 0, buffer.length, DEFAULT_UDP_PORT, '255.255.255.255');
                    const interval = setInterval(() => {
                        if (this.socket && this.isScanning) {
                            try {
                                this.socket.send(buffer, 0, buffer.length, DEFAULT_UDP_PORT, '255.255.255.255');
                            }
                            catch {
                                // Ignore send errors
                            }
                        }
                    }, 1000);
                    setTimeout(() => {
                        clearInterval(interval);
                        this.stop();
                        resolve(Array.from(this.foundDevices.values()));
                    }, timeoutMs);
                }
                catch (err) {
                    Logger.debug(`UDP broadcast send error: ${err.message}`);
                    this.stop();
                    resolve(Array.from(this.foundDevices.values()));
                }
            });
        });
    }
    stop() {
        this.isScanning = false;
        if (this.socket) {
            try {
                this.socket.close();
            }
            catch {
                // Ignore
            }
            this.socket = null;
        }
    }
}
//# sourceMappingURL=udp.js.map