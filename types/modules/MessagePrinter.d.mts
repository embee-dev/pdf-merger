export class MessagePrinter {
    constructor({ language, }?: {
        language?: string;
    });
    getMessage(messageKey?: string): any;
    setLanguage(language?: string): void;
    getLanguage(): string;
    group(messageKey?: string, ...parameters: any[]): void;
    groupEnd(): void;
    info(messageKey?: string, ...parameters: any[]): void;
    error(messageKey?: string, ...parameters: any[]): void;
    #private;
}
