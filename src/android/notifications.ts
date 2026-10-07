import { EventEmitter } from 'node:events';
import { runCommand } from '../shared/exec.js';
import { AndroidSystem } from './system.js';
import type { NotificationPayload } from '../protocol/types.js';

interface RawTermuxNotification {
  id?: number | string;
  tag?: string;
  key?: string;
  group?: string;
  packageName?: string;
  title?: string;
  content?: string;
  when?: string;
}

export class AndroidNotificationWatcher extends EventEmitter {
  private isWatching = false;
  private pollIntervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private knownNotifications = new Map<string, { title: string; body: string; timestamp: number }>();
  private initialScan = true;

  constructor(pollIntervalMs = 1500) {
    super();
    this.pollIntervalMs = pollIntervalMs;
  }

  public async start(): Promise<void> {
    if (this.isWatching) return;
    this.isWatching = true;
    this.initialScan = true;
    this.knownNotifications.clear();

    await this.pollOnce();

    this.timer = setInterval(async () => {
      if (this.isWatching) {
        await this.pollOnce();
      }
    }, this.pollIntervalMs);
  }

  private formatAppName(pkg: string): string {
    const knownApps: Record<string, string> = {
      'com.whatsapp': 'WhatsApp',
      'org.telegram.messenger': 'Telegram',
      'com.google.android.gm': 'Gmail',
      'com.google.android.apps.messaging': 'Messages',
      'com.slack': 'Slack',
      'com.discord': 'Discord',
      'com.twitter.android': 'X',
      'com.instagram.android': 'Instagram',
      'com.google.android.youtube': 'YouTube',
      'com.spotify.music': 'Spotify',
    };

    if (knownApps[pkg]) {
      return knownApps[pkg];
    }

    const segments = pkg.split('.');
    const last = segments[segments.length - 1];
    return last ? last.charAt(0).toUpperCase() + last.slice(1) : pkg;
  }

  public async pollOnce(): Promise<void> {
    const res = await runCommand('termux-notification-list', [], { timeout: 3000 });
    if (res.code !== 0 || !res.stdout.trim()) {
      return;
    }

    try {
      const items = JSON.parse(res.stdout) as RawTermuxNotification[];
      const currentKeys = new Set<string>();
      const deviceId = await AndroidSystem.getDeviceId();

      for (const item of items) {
        const pkg = item.packageName || 'unknown';
        // Ignore system notifications and termux notifications
        if (pkg === 'com.termux' || pkg === 'com.termux.api') {
          continue;
        }

        const notificationId = String(item.key || `${pkg}-${item.id || ''}-${item.tag || ''}`);
        currentKeys.add(notificationId);

        const title = item.title || '';
        const body = item.content || '';
        const app = this.formatAppName(pkg);

        const existing = this.knownNotifications.get(notificationId);

        if (!existing) {
          this.knownNotifications.set(notificationId, { title, body, timestamp: Date.now() });

          // Don't emit notifications on the initial cold start scan to avoid flooding the Mac
          if (!this.initialScan) {
            const payload: NotificationPayload = {
              event: 'notification.created',
              deviceId,
              package: pkg,
              app,
              title,
              body,
              timestamp: Date.now(),
              notificationId,
            };
            this.emit('notification', payload);
          }
        } else if (existing.title !== title || existing.body !== body) {
          // Content updated
          this.knownNotifications.set(notificationId, { title, body, timestamp: Date.now() });
          if (!this.initialScan) {
            const payload: NotificationPayload = {
              event: 'notification.updated',
              deviceId,
              package: pkg,
              app,
              title,
              body,
              timestamp: Date.now(),
              notificationId,
            };
            this.emit('notification', payload);
          }
        }
      }

      // Check for removed notifications
      for (const [key] of this.knownNotifications.entries()) {
        if (!currentKeys.has(key)) {
          this.knownNotifications.delete(key);
          if (!this.initialScan) {
            const payload: NotificationPayload = {
              event: 'notification.removed',
              deviceId,
              package: '',
              app: '',
              title: '',
              body: '',
              timestamp: Date.now(),
              notificationId: key,
            };
            this.emit('notification', payload);
          }
        }
      }

      this.initialScan = false;
    } catch {
      // Ignore JSON parse errors
    }
  }

  public stop(): void {
    this.isWatching = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
