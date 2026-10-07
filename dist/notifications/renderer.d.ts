import type { NotificationPayload, DeviceRecord } from '../protocol/types.js';
export declare class NotificationRenderer {
    private static recentIds;
    private static escapeAppleScript;
    /**
     * Displays native macOS notification using osascript.
     */
    static render(notification: NotificationPayload, device?: DeviceRecord): Promise<boolean>;
}
//# sourceMappingURL=renderer.d.ts.map