import * as dgram from 'node:dgram';
import * as os from 'node:os';
import { spawn } from 'node:child_process';
import { DEFAULT_UDP_PORT, DEFAULT_SSH_PORT, MDNS_SERVICE_NAME, PROTOCOL_VERSION } from '../protocol/constants.js';
import { AndroidSystem } from './system.js';
import { Logger } from '../shared/logger.js';
export class AndroidBroadcaster {
    socket = null;
    beaconTimer = null;
    mdnsProc = null;
    isRunning = false;
    port = DEFAULT_SSH_PORT;
    constructor(sshPort = DEFAULT_SSH_PORT) {
        this.port = sshPort;
    }
    getLocalIp() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name] || []) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return '127.0.0.1';
    }
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        const deviceId = await AndroidSystem.getDeviceId();
        const deviceName = await AndroidSystem.getDeviceName();
        const model = await AndroidSystem.getModel();
        this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        this.socket.on('error', (err) => {
            Logger.debug(`Broadcaster socket error: ${err.message}`);
        });
        this.socket.on('message', (msg, rinfo) => {
            try {
                const text = msg.toString('utf-8');
                const parsed = JSON.parse(text);
                if (parsed.type === 'discover') {
                    const beacon = {
                        id: deviceId,
                        name: deviceName,
                        model,
                        ip: this.getLocalIp(),
                        port: this.port,
                        capabilities: ['notifications', 'device', 'clipboard', 'files'],
                        version: PROTOCOL_VERSION,
                        timestamp: Date.now(),
                    };
                    const response = Buffer.from(JSON.stringify({ type: 'discover_response', device: beacon }));
                    this.socket?.send(response, 0, response.length, rinfo.port, rinfo.address);
                    Logger.debug(`Responded to discovery query from ${rinfo.address}:${rinfo.port}`);
                }
            }
            catch {
                // Ignore
            }
        });
        this.socket.bind(DEFAULT_UDP_PORT, () => {
            try {
                this.socket?.setBroadcast(true);
            }
            catch {
                // Ignore
            }
            Logger.info(`Discovery responder listening on UDP port ${DEFAULT_UDP_PORT}`);
        });
        // Broadcast periodic announcement beacon
        this.beaconTimer = setInterval(async () => {
            if (!this.socket || !this.isRunning)
                return;
            try {
                const beacon = {
                    id: deviceId,
                    name: deviceName,
                    model,
                    ip: this.getLocalIp(),
                    port: this.port,
                    capabilities: ['notifications', 'device', 'clipboard', 'files'],
                    version: PROTOCOL_VERSION,
                    timestamp: Date.now(),
                };
                const buf = Buffer.from(JSON.stringify({ type: 'discover_response', device: beacon }));
                this.socket.send(buf, 0, buf.length, DEFAULT_UDP_PORT, '255.255.255.255');
            }
            catch {
                // Ignore
            }
        }, 5000);
        // Try starting mDNS via avahi or dns-sd if installed in Termux
        this.startMdns(deviceName);
    }
    startMdns(serviceName) {
        try {
            // avahi-publish-service <name> <type> <port>
            this.mdnsProc = spawn('avahi-publish-service', [
                serviceName,
                MDNS_SERVICE_NAME,
                String(this.port),
            ]);
            this.mdnsProc.on('error', () => {
                // avahi not installed, ignore
            });
        }
        catch {
            // Ignore
        }
    }
    stop() {
        this.isRunning = false;
        if (this.beaconTimer) {
            clearInterval(this.beaconTimer);
            this.beaconTimer = null;
        }
        if (this.socket) {
            try {
                this.socket.close();
            }
            catch {
                // Ignore
            }
            this.socket = null;
        }
        if (this.mdnsProc) {
            try {
                this.mdnsProc.kill();
            }
            catch {
                // Ignore
            }
            this.mdnsProc = null;
        }
    }
}
//# sourceMappingURL=broadcaster.js.map