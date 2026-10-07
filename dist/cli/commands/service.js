import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runCommand } from '../../shared/exec.js';
import { bold, green, yellow, dim, gray, symbols, cyan } from '../../shared/ansi.js';
import { PathManager } from '../../shared/config.js';
const SERVICE_LABEL = 'com.android-sync.agent';
const PLIST_PATH = path.join(os.homedir(), 'Library/LaunchAgents', `${SERVICE_LABEL}.plist`);
export async function serviceCommand(action) {
    if (process.platform !== 'darwin') {
        console.log(yellow('Background service management via LaunchAgent is only supported on macOS.'));
        return;
    }
    if (action === 'status') {
        const res = await runCommand('launchctl', ['list']);
        const match = res.stdout.match(new RegExp(`(\\d+|-)\\s+\\S+\\s+${SERVICE_LABEL}`));
        if (match) {
            const isRunning = match[1] !== '-';
            console.log(`\n${bold('macOS LaunchAgent Status:')}`);
            console.log(`  State:       ${isRunning ? green('Running') : yellow('Loaded (Idle)')}`);
            if (isRunning) {
                console.log(`  PID:         ${dim(match[1])}`);
            }
            console.log(`  Plist:       ${dim(PLIST_PATH)}\n`);
        }
        else {
            console.log(`\n${bold('macOS LaunchAgent Status:')}`);
            console.log(`  State:       ${gray('Not installed / not running')}`);
            console.log(`  Install:     ${cyan('android-sync service install')}\n`);
        }
    }
    else if (action === 'install') {
        const launchAgentsDir = path.dirname(PLIST_PATH);
        if (!fs.existsSync(launchAgentsDir)) {
            fs.mkdirSync(launchAgentsDir, { recursive: true });
        }
        const nodePath = process.execPath;
        const scriptPath = path.resolve(process.argv[1]);
        const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${SERVICE_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${scriptPath}</string>
        <string>connect</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${path.join(PathManager.getLogsDir(), 'service-stdout.log')}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(PathManager.getLogsDir(), 'service-stderr.log')}</string>
</dict>
</plist>
`;
        fs.writeFileSync(PLIST_PATH, plistContent, 'utf-8');
        await runCommand('launchctl', ['load', '-w', PLIST_PATH]);
        console.log(`${green(symbols.check)} Installed and started background service: ${SERVICE_LABEL}`);
        console.log(`Logs available at: ${dim(PathManager.getLogsDir())}`);
    }
    else if (action === 'start') {
        if (!fs.existsSync(PLIST_PATH)) {
            await serviceCommand('install');
            return;
        }
        await runCommand('launchctl', ['start', SERVICE_LABEL]);
        console.log(`${green(symbols.check)} Service started`);
    }
    else if (action === 'stop') {
        await runCommand('launchctl', ['stop', SERVICE_LABEL]);
        console.log(`${yellow(symbols.check)} Service stopped`);
    }
    else if (action === 'restart') {
        await runCommand('launchctl', ['stop', SERVICE_LABEL]);
        await runCommand('launchctl', ['start', SERVICE_LABEL]);
        console.log(`${green(symbols.check)} Service restarted`);
    }
    else if (action === 'uninstall') {
        if (fs.existsSync(PLIST_PATH)) {
            await runCommand('launchctl', ['unload', '-w', PLIST_PATH]);
            fs.unlinkSync(PLIST_PATH);
            console.log(`${green(symbols.check)} Service uninstalled`);
        }
        else {
            console.log(dim('Service was not installed.'));
        }
    }
}
//# sourceMappingURL=service.js.map