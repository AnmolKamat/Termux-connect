import { EventEmitter } from 'node:events';
import { SshClient } from './ssh.js';
import { LineProtocolParser, encodeMessage, createMessage } from '../protocol/parser.js';
import { HeartbeatMonitor } from './heartbeat.js';
import { BACKOFF_DELAYS } from '../protocol/constants.js';
import { Logger } from '../shared/logger.js';
import { DeviceStore } from '../device-manager/store.js';
export class ConnectionManager extends EventEmitter {
    device;
    sshClient;
    state = 'disconnected';
    process = null;
    parser = new LineProtocolParser();
    heartbeat = null;
    backoffIndex = 0;
    reconnectTimer = null;
    shouldStayConnected = false;
    pendingRequests = new Map();
    constructor(device) {
        super();
        this.device = device;
        this.sshClient = new SshClient(device);
        this.setupParser();
    }
    getState() {
        return this.state;
    }
    getDevice() {
        return this.device;
    }
    setState(newState) {
        if (this.state !== newState) {
            this.state = newState;
            DeviceStore.updateDeviceStatus(this.device.id, newState);
            this.emit('stateChange', newState, this.device);
            Logger.debug(`[${this.device.name}] State changed to ${newState}`);
        }
    }
    setupParser() {
        this.parser.on('message', (msg) => {
            this.handleIncomingMessage(msg);
        });
        this.parser.on('invalid', (raw, err) => {
            Logger.debug(`[${this.device.name}] Non-protocol output: ${raw}`);
        });
    }
    handleIncomingMessage(msg) {
        if (msg.type === 'pong') {
            this.heartbeat?.handlePong();
            return;
        }
        if (msg.type === 'ping') {
            this.send(createMessage('pong'));
            return;
        }
        if (msg.type === 'response' || msg.type === 'error') {
            if (msg.id && this.pendingRequests.has(msg.id)) {
                const { resolve, reject, timer } = this.pendingRequests.get(msg.id);
                clearTimeout(timer);
                this.pendingRequests.delete(msg.id);
                if (msg.type === 'error') {
                    reject(new Error(msg.error || 'RPC error'));
                }
                else {
                    resolve(msg.payload);
                }
                return;
            }
        }
        if (msg.type === 'event') {
            if (msg.event?.startsWith('notification.')) {
                this.emit('notification', msg.payload);
            }
            this.emit('event', msg);
        }
        this.emit('message', msg);
    }
    /**
     * Starts a persistent connection and handles auto-reconnect.
     */
    async connect() {
        this.shouldStayConnected = true;
        this.cancelReconnect();
        await this.initiateConnection();
    }
    async initiateConnection() {
        try {
            this.setState('connecting');
            Logger.info(`[${this.device.name}] Connecting to ${this.device.host}:${this.device.port}...`);
            this.setState('authenticating');
            // Command on Android: invokes android-sync-bridge or fallback node script
            const remoteCmd = 'android-sync-bridge --stream 2>/dev/null || node ~/.android-sync-bridge/bin/android-sync-bridge.js --stream 2>/dev/null || python3 -m android_sync_bridge --stream 2>/dev/null';
            this.process = this.sshClient.spawnStream(remoteCmd);
            this.process.stdout?.on('data', (chunk) => {
                this.parser.feed(chunk);
            });
            this.process.stderr?.on('data', (chunk) => {
                const str = chunk.toString('utf-8').trim();
                if (str) {
                    Logger.debug(`[${this.device.name}] stderr: ${str}`);
                }
            });
            this.process.on('close', (code) => {
                Logger.warn(`[${this.device.name}] SSH process closed (code ${code})`);
                this.handleDisconnect();
            });
            this.process.on('error', (err) => {
                Logger.error(`[${this.device.name}] SSH process error: ${err.message}`);
                this.handleDisconnect();
            });
            // Heartbeat setup
            this.heartbeat = new HeartbeatMonitor((msg) => this.send(msg));
            this.heartbeat.on('timeout', () => {
                Logger.warn(`[${this.device.name}] Heartbeat timed out`);
                this.disconnectCurrentProcess();
            });
            this.heartbeat.on('pong', (latency) => {
                Logger.debug(`[${this.device.name}] Heartbeat OK (${latency}ms)`);
            });
            this.setState('connected');
            this.backoffIndex = 0; // reset backoff on successful connect
            this.heartbeat.start();
            this.emit('connected', this.device);
            Logger.success(`[${this.device.name}] Connected and bridge stream active`);
        }
        catch (err) {
            Logger.error(`[${this.device.name}] Connection failed: ${err.message}`);
            this.handleDisconnect();
        }
    }
    send(msg) {
        if (this.state !== 'connected' || !this.process?.stdin?.writable) {
            return false;
        }
        try {
            const data = encodeMessage(msg);
            this.process.stdin.write(data);
            return true;
        }
        catch (err) {
            Logger.error(`[${this.device.name}] Failed to write message: ${err.message}`);
            return false;
        }
    }
    /**
     * Invokes an RPC method on the remote device and awaits the response.
     */
    async request(capability, action, payload, timeoutMs = 8000) {
        if (this.state !== 'connected') {
            throw new Error(`Device ${this.device.name} is not connected`);
        }
        const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const msg = {
            version: 1,
            id,
            type: 'request',
            capability: capability,
            action,
            payload,
            timestamp: Date.now(),
        };
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`Request ${action} timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            this.pendingRequests.set(id, { resolve, reject, timer });
            const sent = this.send(msg);
            if (!sent) {
                clearTimeout(timer);
                this.pendingRequests.delete(id);
                reject(new Error('Failed to send request: stream not writable'));
            }
        });
    }
    handleDisconnect() {
        this.disconnectCurrentProcess();
        if (!this.shouldStayConnected) {
            this.setState('disconnected');
            this.emit('disconnected', this.device);
            return;
        }
        this.scheduleReconnect();
    }
    disconnectCurrentProcess() {
        if (this.heartbeat) {
            this.heartbeat.stop();
            this.heartbeat = null;
        }
        if (this.process) {
            try {
                this.process.kill();
            }
            catch {
                // Ignore
            }
            this.process = null;
        }
        this.parser.reset();
        // Reject pending requests
        for (const [id, { reject, timer }] of this.pendingRequests.entries()) {
            clearTimeout(timer);
            reject(new Error('Connection lost while awaiting response'));
        }
        this.pendingRequests.clear();
    }
    scheduleReconnect() {
        this.setState('reconnecting');
        this.emit('disconnected', this.device);
        const delay = BACKOFF_DELAYS[this.backoffIndex] || BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1];
        this.backoffIndex = Math.min(this.backoffIndex + 1, BACKOFF_DELAYS.length - 1);
        Logger.info(`[${this.device.name}] Will reconnect in ${delay / 1000}s...`);
        this.cancelReconnect();
        this.reconnectTimer = setTimeout(() => {
            this.initiateConnection();
        }, delay);
    }
    cancelReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    disconnect() {
        this.shouldStayConnected = false;
        this.cancelReconnect();
        this.disconnectCurrentProcess();
        this.setState('disconnected');
        this.emit('disconnected', this.device);
        Logger.info(`[${this.device.name}] Disconnected by user`);
    }
}
//# sourceMappingURL=connection.js.map