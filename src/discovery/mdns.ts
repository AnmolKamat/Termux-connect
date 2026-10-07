import { spawn, ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { MDNS_SERVICE_NAME, DEFAULT_SSH_PORT } from '../protocol/constants.js';
import type { DiscoveredDevice } from './udp.js';
import { Logger } from '../shared/logger.js';
import { runCommand } from '../shared/exec.js';

/**
 * mDNS / Bonjour discovery using macOS native dns-sd
 */
export class MdnsScanner extends EventEmitter {
  private proc: ChildProcess | null = null;
  private foundDevices = new Map<string, DiscoveredDevice>();

  public async scan(timeoutMs = 3000): Promise<DiscoveredDevice[]> {
    this.foundDevices.clear();

    if (process.platform !== 'darwin') {
      return [];
    }

    return new Promise((resolve) => {
      try {
        // Run: dns-sd -B _android-sync._tcp local
        this.proc = spawn('/usr/bin/dns-sd', ['-B', MDNS_SERVICE_NAME, 'local']);

        const serviceNames: string[] = [];

        this.proc.stdout?.on('data', (data: Buffer) => {
          const lines = data.toString('utf-8').split('\n');
          for (const line of lines) {
            // Typical dns-sd -B line:
            // 12:34:56.789  Add  3  local.  _android-sync._tcp.  Pixel-9-Pro
            const match = line.match(/Add\s+\d+\s+local\.\s+_android-sync\._tcp\.\s+(.+)$/);
            if (match && match[1]) {
              const instanceName = match[1].trim();
              if (!serviceNames.includes(instanceName)) {
                serviceNames.push(instanceName);
              }
            }
          }
        });

        this.proc.on('error', (err) => {
          Logger.debug(`dns-sd error: ${err.message}`);
        });

        setTimeout(async () => {
          this.stop();

          // Resolve services discovered
          for (const name of serviceNames) {
            try {
              const resolved = await this.resolveService(name);
              if (resolved) {
                this.foundDevices.set(`${resolved.host}:${resolved.port}`, resolved);
                this.emit('device', resolved);
              }
            } catch {
              // Ignore resolve error
            }
          }

          resolve(Array.from(this.foundDevices.values()));
        }, timeoutMs);
      } catch (err) {
        Logger.debug(`mDNS scan failed: ${(err as Error).message}`);
        resolve([]);
      }
    });
  }

  private async resolveService(name: string): Promise<DiscoveredDevice | null> {
    return new Promise((resolve) => {
      // Run: dns-sd -L <name> _android-sync._tcp local
      const resolveProc = spawn('/usr/bin/dns-sd', ['-L', name, MDNS_SERVICE_NAME, 'local']);
      let resolved = false;

      resolveProc.stdout?.on('data', async (data: Buffer) => {
        const text = data.toString('utf-8');
        // Looks for: can be reached at <host>.local.:<port>
        const match = text.match(/can be reached at\s+([^:]+):(\d+)/i);
        if (match && !resolved) {
          resolved = true;
          const hostTarget = match[1].trim();
          const port = parseInt(match[2].trim(), 10) || DEFAULT_SSH_PORT;

          try {
            resolveProc.kill();
          } catch {
            // Ignore
          }

          // Resolve IP for hostTarget (e.g., Pixel.local)
          let ip = hostTarget;
          const pingResult = await runCommand('ping', ['-c', '1', '-t', '1', hostTarget]);
          const ipMatch = pingResult.stdout.match(/\(([\d.]+)\)/);
          if (ipMatch) {
            ip = ipMatch[1];
          }

          const dev: DiscoveredDevice = {
            id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name,
            model: name,
            host: ip,
            port,
            capabilities: ['notifications', 'device'],
            source: 'mdns',
          };
          resolve(dev);
        }
      });

      setTimeout(() => {
        if (!resolved) {
          try {
            resolveProc.kill();
          } catch {
            // Ignore
          }
          resolve(null);
        }
      }, 1500);
    });
  }

  public stop(): void {
    if (this.proc) {
      try {
        this.proc.kill();
      } catch {
        // Ignore
      }
      this.proc = null;
    }
  }
}
