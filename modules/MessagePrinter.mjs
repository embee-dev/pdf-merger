export class MessagePrinter {
    constructor({
        language = '',
    } = {}) {
        this.setLanguage(language)
    }

    #config = {
        availableLanguages: [
            'EN',
            'HU'
        ],
        defaultLanguage: 'EN',
        language: '',

        messageSeparator: {
            info: '\n'.concat('-'.repeat(20), '\n'),
            error: '\n'.concat('!'.repeat(20), '\n')
        }
    }

    // program messages
    #messages = {
        'EN': {
            // errors
            fileCheckError: `Checking any existing TOC file was unsuccessful.
            A new TOC file will be generated.
            
            `,
            fileFilterError: 'Cannot find/access file "%s", it will be removed from the TOC file list.',
            directoryNotExistsError: 'The provided scanning path (%s) does not exist.\nPlease provide a valid path!\nExiting now...',
            accessError: 'File/Directory operation failed.\nPlease make sure tha application has the necessary rights.\nExiting now...',
            pdfEncryptedErrorGroup: 'The file "%s" is encrypted.',
            pdfEncryptedError: `This version of PDF Merger cannot handle encrypted PDF files, so this file will be ignored from the final PDF.`,
            pdfUnknownErrorGroup: `There was a problem opening "%s".`,
            pdfUnknownError: ` According to the PDF processor, this file is not a valid PDF file,
            so this file will be ignored from the final PDF.`,
            writeTOCFileError: `
            Uh-oh! Creating/Writing "%s" was unsuccessful.
            Please check that pdf-merger is provided the necessary rights for this operation!
            pdf-merger will now terminate.            
            `,
            writeMergedPDFError: `
            Uh-oh! Creating/Writing "%s" was unsuccessful.
            Please check that pdf-merger is provided the necessary rights for this operation,
            or the target file name provided in the TOC.json file is a valid filename!
            pdf-merger will now terminate.
            `,
            noPDFsError: `
            Uh-oh! There are no PDF files either in this folder,
            or in the existing TOC.json file.
            Please run pdf-merger in a folder containing at least 1 PDF file,
            or make sure that the existing TOC.json file is correct.
            pdf-merger will now terminate.
            `,
            unknownError: 'Unknown Error',

            // info
            welcome: `Welcome to PDF Merger!
            This simple CLI will help you merging PDF files.

            `,

            beginWork: `Let's begin!
            `,
            checkingExistingTOCFile: `Looking for existing TOC file...
            `,
            existingTOCFileFound: `Existing TOC file found!
                Now scanning the list of included files...
            `,
            filteringFile: 'Checking "%s"',
            filteringFilePassed: '"%s" is OK.',

            tocFileNeedsRewrite: `The existing TOC file needs to be rewritten.
            Saving it now...
            `,

            tocFileWritten: `The TOC file with the name "%s" was successfully saved.`,
            mergedFileWritten: `
            Ready!
            The merged PDF file "%s" was successfully generated!
            Thank you for using PDF Merger!
            
            `,

            continueFromHere: `
            OK, everything is ready!

            The TOC file "%s" has been generated/checked.

            You now have the possibility to generate the merged PDF
            or make edits on the TOC file manually if you wish to change something.
            When ready with manual editing, simply restart the program, it will
            use your edited TOC file version.
            The JSON format of the TOC file can be found here:
            %s
            `,

            continueFromHerePrompt: `Do you wish to continue?
            If [Y]ES, the program will generate the PDF,
            if [N]O, the program will exit and you can edit the TOC file.
            Please press: `,

            userStopped: `
            OK, please use your favorite text editor to edit the generated JSON file.
            When you are ready with your edits, start the program again.
            
            `,

            beginMerging: `
            OK, let's begin merging "%s"
            [...hard working noises...]`,

            currentlyProcessing: `
            Processing "%s"...`,

            processingWasSuccessful: `Done!`,

            bye: `Bye!`,
            needsTranslationLabel: '### TRANSLATE ME ### --> '
        },
        'HU': {
        }
    }

    #trimLeadingSpaces(s) {
        return s.replaceAll(/\n\s{2,}/g, '\n')
    }

    getMessage(messageKey = '') {
        if (this.#messages[this.getLanguage()]?.[messageKey]) {
            return this.#trimLeadingSpaces(this.#messages[this.getLanguage()][messageKey])
        } else {
            return this.#trimLeadingSpaces(this.#messages[this.#getDefaultLanguage()].needsTranslationLabel.concat(this.#messages[this.#getDefaultLanguage()][messageKey]))
        }
    }

    setLanguage(language = '') {
        if (this.#config.availableLanguages.indexOf(language) !== -1) {
            this.#config.language = language
        } else {
            this.#config.language = this.#config.defaultLanguage
        }
    }
    #getDefaultLanguage() {
        return this.#config.defaultLanguage
    }
    getLanguage() {
        return this.#config.language
    }

    group(messageKey = '', ...parameters) {
        console.group(this.getMessage(messageKey), ...parameters)
    }
    groupEnd() {
        console.groupEnd()
    }
    info(messageKey = '', ...parameters) {
        console.info(this.getMessage(messageKey), ...parameters)
    }
    error(messageKey = '', ...parameters) {
        console.error(this.getMessage(messageKey), ...parameters)
    }
}
