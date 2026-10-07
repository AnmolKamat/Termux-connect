import { LineProtocolParser, encodeMessage, createMessage } from '../protocol/parser.js';
import { AndroidSystem } from './system.js';
import { AndroidNotificationWatcher } from './notifications.js';
import { AndroidBroadcaster } from './broadcaster.js';
import { Logger } from '../shared/logger.js';
export class AndroidBridgeServer {
    parser = new LineProtocolParser();
    notificationWatcher = new AndroidNotificationWatcher(1500);
    broadcaster = null;
    isStreaming = false;
    constructor() {
        this.setupParser();
    }
    setupParser() {
        this.parser.on('message', async (msg) => {
            await this.handleIncomingMessage(msg);
        });
    }
    send(msg) {
        const data = encodeMessage(msg);
        process.stdout.write(data);
    }
    async handleIncomingMessage(msg) {
        if (msg.type === 'ping') {
            this.send(createMessage('pong', { id: msg.id }));
            return;
        }
        if (msg.type === 'request') {
            const { id, capability, action, payload } = msg;
            try {
                let result = null;
                if (capability === 'device') {
                    if (action === 'get_info') {
                        result = await AndroidSystem.getDeviceInfo();
                    }
                    else if (action === 'get_battery') {
                        result = await AndroidSystem.getBattery();
                    }
                }
                else if (capability === 'clipboard') {
                    if (action === 'get') {
                        result = await AndroidSystem.getClipboard();
                    }
                    else if (action === 'set') {
                        const text = payload?.text || '';
                        result = await AndroidSystem.setClipboard(text);
                    }
                }
                else if (capability === 'files') {
                    if (action === 'list') {
                        const p = payload?.path || '/sdcard';
                        result = await AndroidSystem.listFiles(p);
                    }
                }
                else if (capability === 'notifications') {
                    if (action === 'poll') {
                        await this.notificationWatcher.pollOnce();
                        result = { success: true };
                    }
                }
                else if (action === 'list_capabilities') {
                    result = ['notifications', 'device', 'clipboard', 'files'];
                }
                this.send({
                    version: 1,
                    id,
                    type: 'response',
                    capability,
                    action,
                    payload: result,
                    timestamp: Date.now(),
                });
            }
            catch (err) {
                this.send({
                    version: 1,
                    id,
                    type: 'error',
                    capability,
                    action,
                    error: err.message || String(err),
                    timestamp: Date.now(),
                });
            }
        }
    }
    /**
     * Starts stream session over stdin/stdout (used when spawned over SSH)
     */
    async startStream() {
        if (this.isStreaming)
            return;
        this.isStreaming = true;
        // Stream over stdin/stdout
        process.stdin.on('data', (chunk) => {
            this.parser.feed(chunk);
        });
        // Start watching notifications and emit them as protocol events
        this.notificationWatcher.on('notification', (notif) => {
            this.send({
                version: 1,
                type: 'event',
                capability: 'notifications',
                event: notif.event,
                payload: notif,
                timestamp: Date.now(),
            });
        });
        await this.notificationWatcher.start();
        // Send initial handshake / ready event
        const info = await AndroidSystem.getDeviceInfo();
        this.send({
            version: 1,
            type: 'event',
            capability: 'device',
            event: 'device.ready',
            payload: info,
            timestamp: Date.now(),
        });
    }
    /**
     * Starts background daemon with UDP discovery responder
     */
    async startDaemon(sshPort = 8022) {
        Logger.info('Starting Android Bridge Daemon in background...');
        this.broadcaster = new AndroidBroadcaster(sshPort);
        await this.broadcaster.start();
        Logger.success('Android Bridge Daemon is running and discoverable');
    }
    stop() {
        this.notificationWatcher.stop();
        this.broadcaster?.stop();
        this.isStreaming = false;
    }
}
//# sourceMappingURL=server.js.map