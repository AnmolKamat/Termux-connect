import { LineProtocolParser, encodeMessage, createMessage } from '../protocol/parser.js';
import { AndroidSystem } from './system.js';
import { AndroidNotificationWatcher } from './notifications.js';
import { AndroidBroadcaster } from './broadcaster.js';
import { Logger } from '../shared/logger.js';
import type { ProtocolMessage } from '../protocol/types.js';

export class AndroidBridgeServer {
  private parser = new LineProtocolParser();
  private notificationWatcher = new AndroidNotificationWatcher(1500);
  private broadcaster: AndroidBroadcaster | null = null;
  private isStreaming = false;

  constructor() {
    this.setupParser();
  }

  private setupParser(): void {
    this.parser.on('message', async (msg: ProtocolMessage) => {
      await this.handleIncomingMessage(msg);
    });
  }

  private send(msg: ProtocolMessage): void {
    const data = encodeMessage(msg);
    process.stdout.write(data);
  }

  private async handleIncomingMessage(msg: ProtocolMessage): Promise<void> {
    if (msg.type === 'ping') {
      this.send(createMessage('pong', { id: msg.id }));
      return;
    }

    if (msg.type === 'request') {
      const { id, capability, action, payload } = msg;

      try {
        let result: unknown = null;

        if (capability === 'device') {
          if (action === 'get_info') {
            result = await AndroidSystem.getDeviceInfo();
          } else if (action === 'get_battery') {
            result = await AndroidSystem.getBattery();
          }
        } else if (capability === 'clipboard') {
          if (action === 'get') {
            result = await AndroidSystem.getClipboard();
          } else if (action === 'set') {
            const text = (payload as { text?: string })?.text || '';
            result = await AndroidSystem.setClipboard(text);
          }
        } else if (capability === 'files') {
          if (action === 'list') {
            const p = (payload as { path?: string })?.path || '/sdcard';
            result = await AndroidSystem.listFiles(p);
          }
        } else if (capability === 'notifications') {
          if (action === 'poll') {
            await this.notificationWatcher.pollOnce();
            result = { success: true };
          }
        } else if (action === 'list_capabilities') {
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
      } catch (err: unknown) {
        this.send({
          version: 1,
          id,
          type: 'error',
          capability,
          action,
          error: (err as Error).message || String(err),
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Starts stream session over stdin/stdout (used when spawned over SSH)
   */
  public async startStream(): Promise<void> {
    if (this.isStreaming) return;
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
  public async startDaemon(sshPort = 8022): Promise<void> {
    Logger.info('Starting Android Bridge Daemon in background...');
    this.broadcaster = new AndroidBroadcaster(sshPort);
    await this.broadcaster.start();
    Logger.success('Android Bridge Daemon is running and discoverable');
  }

  public stop(): void {
    this.notificationWatcher.stop();
    this.broadcaster?.stop();
    this.isStreaming = false;
  }
}
