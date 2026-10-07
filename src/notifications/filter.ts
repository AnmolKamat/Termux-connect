import { ConfigStore } from '../device-manager/store.js';
import type { DeviceRecord, NotificationPayload } from '../protocol/types.js';

export class NotificationFilter {
  public static shouldDisplay(notification: NotificationPayload, device?: DeviceRecord): boolean {
    const config = ConfigStore.getConfig();
    if (!config.notificationsEnabled) {
      return false;
    }

    if (device?.notificationFilter) {
      if (!device.notificationFilter.enabled) {
        return false;
      }

      const pkg = notification.package.toLowerCase();
      const app = notification.app.toLowerCase();

      // Check blacklist
      if (device.notificationFilter.blacklist && device.notificationFilter.blacklist.length > 0) {
        const isBlacklisted = device.notificationFilter.blacklist.some(
          (b) => pkg.includes(b.toLowerCase()) || app.includes(b.toLowerCase())
        );
        if (isBlacklisted) {
          return false;
        }
      }

      // Check whitelist
      if (device.notificationFilter.whitelist && device.notificationFilter.whitelist.length > 0) {
        const isWhitelisted = device.notificationFilter.whitelist.some(
          (w) => pkg.includes(w.toLowerCase()) || app.includes(w.toLowerCase())
        );
        if (!isWhitelisted) {
          return false;
        }
      }
    }

    return true;
  }
}
