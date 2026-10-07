import { interactiveCommand } from './commands/interactive.js';
import {
  listDevicesCommand,
  discoverDevicesCommand,
  pairDeviceCommand,
  removeDeviceCommand,
} from './commands/devices.js';
import { connectCommand } from './commands/connect.js';
import { statusCommand } from './commands/status.js';
import { notificationsCommand } from './commands/notifications.js';
import { infoCommand } from './commands/info.js';
import { clipboardCommand } from './commands/clipboard.js';
import { filesCommand } from './commands/files.js';
import { serviceCommand } from './commands/service.js';
import { logsCommand } from './commands/logs.js';
import { bold, cyan, dim, green, yellow } from '../shared/ansi.js';
import { PathManager } from '../shared/config.js';
import { Logger } from '../shared/logger.js';

function printHelp(): void {
  console.log(`
${bold('android-sync')} — Android ↔ macOS Bridge

${bold('USAGE:')}
  ${cyan('android-sync')}                            Launch interactive terminal UI
  ${cyan('android-sync devices')}                    List paired Android devices
  ${cyan('android-sync devices discover')}           Scan local network for devices
  ${cyan('android-sync devices pair <ip> [port]')}   Pair a new Android device
  ${cyan('android-sync devices remove <id>')}        Remove a paired device
  ${cyan('android-sync connect [id]')}               Connect and sync notifications
  ${cyan('android-sync status')}                     Show bridge & device status
  ${cyan('android-sync notifications')}              List active notifications
  ${cyan('android-sync notifications --watch')}      Stream live notifications
  ${cyan('android-sync info [id]')}                  Show battery, specs, and storage
  ${cyan('android-sync clipboard --get')}            Get clipboard from phone
  ${cyan('android-sync clipboard --set <text>')}     Send text to phone clipboard
  ${cyan('android-sync files list [path]')}          List files on Android (/sdcard)
  ${cyan('android-sync files pull <remote> [dest]')} Download file from Android
  ${cyan('android-sync files push <src> [dest]')}    Upload file to Android
  ${cyan('android-sync service <action>')}           Manage background daemon (install|status|start|stop)
  ${cyan('android-sync logs [-f]')}                  View or follow logs

${bold('OPTIONS:')}
  ${cyan('--json')}                                  Output in JSON format (scripting)
  ${cyan('-v, --verbose')}                           Enable debug logging
  ${cyan('-h, --help')}                              Show this help menu
`);
}

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  PathManager.initialize();

  if (argv.includes('-v') || argv.includes('--verbose')) {
    Logger.setLevel('debug');
  }

  const isJson = argv.includes('--json');
  if (isJson) {
    Logger.setQuiet(true);
  }

  // Filter out global flags for positional command parsing
  const cleanArgs = argv.filter((a) => !a.startsWith('--') && !a.startsWith('-'));
  const flags = new Set(argv.filter((a) => a.startsWith('-')));

  const cmd = cleanArgs[0];
  const subCmd = cleanArgs[1];

  if (flags.has('-h') || flags.has('--help') || cmd === 'help') {
    printHelp();
    return;
  }

  if (!cmd) {
    // Launch interactive TUI
    await interactiveCommand();
    return;
  }

  switch (cmd) {
    case 'devices': {
      if (subCmd === 'discover') {
        await discoverDevicesCommand({ json: isJson });
      } else if (subCmd === 'pair') {
        const host = cleanArgs[2];
        const port = cleanArgs[3] ? parseInt(cleanArgs[3], 10) : undefined;
        await pairDeviceCommand(host, { port });
      } else if (subCmd === 'remove' || subCmd === 'rm') {
        const id = cleanArgs[2];
        if (!id) {
          console.error('Please specify device ID to remove');
          process.exit(1);
        }
        await removeDeviceCommand(id);
      } else {
        await listDevicesCommand({ json: isJson });
      }
      break;
    }

    case 'connect': {
      const deviceId = cleanArgs[1];
      await connectCommand(deviceId);
      break;
    }

    case 'status': {
      await statusCommand({ json: isJson });
      break;
    }

    case 'notifications': {
      const watch = flags.has('--watch') || flags.has('-w');
      const deviceId = cleanArgs[1];
      await notificationsCommand(deviceId, { watch, json: isJson });
      break;
    }

    case 'info': {
      const deviceId = cleanArgs[1];
      await infoCommand(deviceId, { json: isJson });
      break;
    }

    case 'clipboard': {
      const get = flags.has('--get');
      const setIdx = argv.findIndex((a) => a === '--set');
      const setText = setIdx !== -1 ? argv[setIdx + 1] : undefined;
      const deviceId = cleanArgs[1];
      await clipboardCommand({ get, set: setText, deviceId });
      break;
    }

    case 'files': {
      const action = (subCmd as 'list' | 'pull' | 'push') || 'list';
      const arg1 = cleanArgs[2];
      const arg2 = cleanArgs[3];

      if (action === 'pull') {
        await filesCommand('pull', { remotePath: arg1, localPath: arg2 });
      } else if (action === 'push') {
        await filesCommand('push', { localPath: arg1, remotePath: arg2 });
      } else {
        await filesCommand('list', { remotePath: arg1 });
      }
      break;
    }

    case 'service': {
      const action = (subCmd as any) || 'status';
      await serviceCommand(action);
      break;
    }

    case 'logs': {
      const follow = flags.has('-f') || flags.has('--follow');
      await logsCommand({ follow });
      break;
    }

    default: {
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
    }
  }
}
