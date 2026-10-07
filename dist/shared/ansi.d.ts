/**
 * Terminal ANSI styling and formatting utilities
 */
export declare const colors: {
    reset: string;
    bold: string;
    dim: string;
    italic: string;
    underline: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    gray: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
};
export declare function stripAnsi(str: string): string;
export declare function visibleLength(str: string): number;
export declare function green(text: string): string;
export declare function red(text: string): string;
export declare function yellow(text: string): string;
export declare function blue(text: string): string;
export declare function cyan(text: string): string;
export declare function magenta(text: string): string;
export declare function gray(text: string): string;
export declare function bold(text: string): string;
export declare function dim(text: string): string;
export declare const symbols: {
    arrow: string;
    check: string;
    cross: string;
    bullet: string;
    connected: string;
    disconnected: string;
    phone: string;
    laptop: string;
    battery: string;
    bell: string;
    gear: string;
    wifi: string;
    lock: string;
};
/**
 * Renders a rounded box around lines of text
 */
export declare function renderBox(title: string, lines: string[], minWidth?: number): string;
//# sourceMappingURL=ansi.d.ts.map