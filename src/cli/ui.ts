import * as readline from 'node:readline';
import { colors, bold, cyan, green, yellow, dim, gray, red, symbols, renderBox, visibleLength } from '../shared/ansi.js';

export interface MenuItem<T = string> {
  label: string;
  value: T;
  description?: string;
  badge?: string;
}

export class UI {
  /**
   * Renders an interactive select menu controlled with arrow keys
   */
  public static async select<T = string>(
    title: string,
    items: MenuItem<T>[],
    initialIndex = 0
  ): Promise<T | null> {
    if (!process.stdin.isTTY || items.length === 0) {
      return items[0]?.value ?? null;
    }

    let selectedIndex = initialIndex;
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    readline.emitKeypressEvents(process.stdin, rl);

    if (process.stdin.isRaw !== undefined) {
      process.stdin.setRawMode(true);
    }

    const render = () => {
      // Clear previous lines
      process.stdout.write('\x1b[2J\x1b[0;0H');

      const lines: string[] = [];
      lines.push(dim('↑/↓ Navigate  •  Enter Select  •  q Quit'));
      lines.push('');

      items.forEach((item, idx) => {
        const isSelected = idx === selectedIndex;
        const pointer = isSelected ? `${cyan(symbols.arrow)} ` : '  ';
        const labelText = isSelected ? bold(cyan(item.label)) : item.label;
        const badgeText = item.badge ? ` ${item.badge}` : '';
        lines.push(`${pointer}${labelText}${badgeText}`);

        if (item.description) {
          lines.push(`    ${dim(item.description)}`);
        }
      });

      console.log(renderBox(title, lines, 50));
    };

    render();

    return new Promise((resolve) => {
      const onKeypress = (str: string, key: readline.Key) => {
        if (!key) return;

        if (key.ctrl && key.name === 'c') {
          cleanup();
          process.exit(0);
        }

        if (key.name === 'q' || key.name === 'escape') {
          cleanup();
          resolve(null);
          return;
        }

        if (key.name === 'up') {
          selectedIndex = (selectedIndex - 1 + items.length) % items.length;
          render();
        } else if (key.name === 'down') {
          selectedIndex = (selectedIndex + 1) % items.length;
          render();
        } else if (key.name === 'return' || key.name === 'enter') {
          cleanup();
          resolve(items[selectedIndex].value);
        }
      };

      const cleanup = () => {
        process.stdin.removeListener('keypress', onKeypress);
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(false);
        }
        rl.close();
        process.stdout.write('\n');
      };

      process.stdin.on('keypress', onKeypress);
    });
  }

  /**
   * Prompts the user for a text response
   */
  public static async prompt(question: string, defaultValue = ''): Promise<string> {
    const promptText = defaultValue ? `${question} [${dim(defaultValue)}]: ` : `${question}: `;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(promptText, (answer) => {
        rl.close();
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  /**
   * Prompts for yes/no confirmation
   */
  public static async confirm(question: string, defaultYes = true): Promise<boolean> {
    const hint = defaultYes ? '(Y/n)' : '(y/N)';
    const ans = await this.prompt(`${question} ${hint}`, defaultYes ? 'y' : 'n');
    return ans.toLowerCase().startsWith('y');
  }

  /**
   * Displays an animated spinner during a long-running promise
   */
  public static async withSpinner<T>(message: string, action: () => Promise<T>): Promise<T> {
    const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIdx = 0;

    const timer = setInterval(() => {
      process.stdout.write(`\r${cyan(spinnerFrames[frameIdx])} ${message}`);
      frameIdx = (frameIdx + 1) % spinnerFrames.length;
    }, 80);

    try {
      const result = await action();
      clearInterval(timer);
      process.stdout.write(`\r${green(symbols.check)} ${message}\n`);
      return result;
    } catch (err) {
      clearInterval(timer);
      process.stdout.write(`\r${red(symbols.cross)} ${message}\n`);
      throw err;
    }
  }

  /**
   * Renders a key-value summary table
   */
  public static renderTable(title: string, data: Record<string, string | number | boolean | undefined>): void {
    const lines: string[] = [];
    const maxKeyLen = Math.max(...Object.keys(data).map((k) => k.length));

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      const pad = ' '.repeat(maxKeyLen - key.length + 2);
      lines.push(`${bold(key)}${pad}${value}`);
    }

    console.log(renderBox(title, lines, 45));
  }
}
