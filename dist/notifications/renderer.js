import { runCommand } from '../shared/exec.js';
import { Logger } from '../shared/logger.js';
import { NotificationFilter } from './filter.js';
import { ConfigStore } from '../device-manager/store.js';
export class NotificationRenderer {
    static recentIds = new Map();
    static escapeAppleScript(str) {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\r/g, '')
            .replace(/\n/g, ' ');
    }
    /**
     * Displays native macOS notification using osascript.
     */
    static async render(notification, device) {
        if (notification.event !== 'notification.created') {
            return false;
        }
        if (!NotificationFilter.shouldDisplay(notification, device)) {
            Logger.debug(`Notification filtered out: ${notification.app} - ${notification.title}`);
            return false;
        }
        // Deduplication check (within 3 seconds)
        const dedupKey = `${notification.deviceId}:${notification.notificationId}:${notification.title}:${notification.body}`;
        const now = Date.now();
        const lastSeen = this.recentIds.get(dedupKey);
        if (lastSeen && now - lastSeen < 3000) {
            return false;
        }
        this.recentIds.set(dedupKey, now);
        // Clean old entries
        for (const [k, timestamp] of this.recentIds.entries()) {
            if (now - timestamp > 10000) {
                this.recentIds.delete(k);
            }
        }
        const title = this.escapeAppleScript(notification.app || 'Android');
        const subtitle = this.escapeAppleScript(notification.title || '');
        const body = this.escapeAppleScript(notification.body || '');
        const config = ConfigStore.getConfig();
        const titlePart = subtitle ? `${title} — ${subtitle}` : title;
        let script = `display notification "${body}" with title "${titlePart}"`;
        if (config.soundEnabled) {
            script += ` sound name "default"`;
        }
        Logger.info(`🔔 [${notification.app}] ${notification.title}: ${notification.body}`);
        if (process.platform === 'darwin') {
            try {
                await runCommand('osascript', ['-e', script]);
                return true;
            }
            catch (err) {
                Logger.error('Failed to display macOS notification', err);
                return false;
            }
        }
        return true;
    }
}
//# sourceMappingURL=renderer.js.map