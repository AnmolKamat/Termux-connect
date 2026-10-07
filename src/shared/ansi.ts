/**
 * Terminal ANSI styling and formatting utilities
 */

export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Bright
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

export function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

export function green(text: string): string {
  return `${colors.green}${text}${colors.reset}`;
}

export function red(text: string): string {
  return `${colors.red}${text}${colors.reset}`;
}

export function yellow(text: string): string {
  return `${colors.yellow}${text}${colors.reset}`;
}

export function blue(text: string): string {
  return `${colors.blue}${text}${colors.reset}`;
}

export function cyan(text: string): string {
  return `${colors.cyan}${text}${colors.reset}`;
}

export function magenta(text: string): string {
  return `${colors.magenta}${text}${colors.reset}`;
}

export function gray(text: string): string {
  return `${colors.gray}${text}${colors.reset}`;
}

export function bold(text: string): string {
  return `${colors.bold}${text}${colors.reset}`;
}

export function dim(text: string): string {
  return `${colors.dim}${text}${colors.reset}`;
}

export const symbols = {
  arrow: '❯',
  check: '✓',
  cross: '✗',
  bullet: '•',
  connected: '●',
  disconnected: '○',
  phone: '📱',
  laptop: '💻',
  battery: '🔋',
  bell: '🔔',
  gear: '⚙️',
  wifi: '📶',
  lock: '🔒',
};

/**
 * Renders a rounded box around lines of text
 */
export function renderBox(title: string, lines: string[], minWidth = 40): string {
  const contentWidth = Math.max(
    minWidth,
    visibleLength(title) + 4,
    ...lines.map((l) => visibleLength(l))
  );

  const innerWidth = contentWidth + 2;
  const horizontal = '─'.repeat(innerWidth);

  const top = `╭${horizontal}╮`;
  const bottom = `╰${horizontal}╯`;

  const titlePad = Math.max(0, Math.floor((innerWidth - visibleLength(title)) / 2));
  const titleLine = `│${' '.repeat(titlePad)}${bold(title)}${' '.repeat(innerWidth - titlePad - visibleLength(title))}│`;

  const renderedLines = lines.map((l) => {
    const pad = Math.max(0, innerWidth - visibleLength(l) - 2);
    return `│ ${l}${' '.repeat(pad)} │`;
  });

  return [top, titleLine, ...renderedLines, bottom].join('\n');
}
