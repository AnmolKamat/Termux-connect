import { ConfigStore } from '../device-manager/store.js';
export class NotificationFilter {
    static shouldDisplay(notification, device) {
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
                const isBlacklisted = device.notificationFilter.blacklist.some((b) => pkg.includes(b.toLowerCase()) || app.includes(b.toLowerCase()));
                if (isBlacklisted) {
                    return false;
                }
            }
            // Check whitelist
            if (device.notificationFilter.whitelist && device.notificationFilter.whitelist.length > 0) {
                const isWhitelisted = device.notificationFilter.whitelist.some((w) => pkg.includes(w.toLowerCase()) || app.includes(w.toLowerCase()));
                if (!isWhitelisted) {
                    return false;
                }
            }
        }
        return true;
    }
}
//# sourceMappingURL=filter.js.map