export class PDFMerger {
    constructor({ sourceDirectory, targetFile, interactive, language }?: {
        sourceDirectory?: any;
        targetFile?: any;
        interactive?: boolean;
        language?: string;
    });
    start(): Promise<void>;
    #private;
}
