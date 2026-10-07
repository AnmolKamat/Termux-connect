export interface MenuItem<T = string> {
    label: string;
    value: T;
    description?: string;
    badge?: string;
}
export declare class UI {
    /**
     * Renders an interactive select menu controlled with arrow keys
     */
    static select<T = string>(title: string, items: MenuItem<T>[], initialIndex?: number): Promise<T | null>;
    /**
     * Prompts the user for a text response
     */
    static prompt(question: string, defaultValue?: string): Promise<string>;
    /**
     * Prompts for yes/no confirmation
     */
    static confirm(question: string, defaultYes?: boolean): Promise<boolean>;
    /**
     * Displays an animated spinner during a long-running promise
     */
    static withSpinner<T>(message: string, action: () => Promise<T>): Promise<T>;
    /**
     * Renders a key-value summary table
     */
    static renderTable(title: string, data: Record<string, string | number | boolean | undefined>): void;
}
//# sourceMappingURL=ui.d.ts.map