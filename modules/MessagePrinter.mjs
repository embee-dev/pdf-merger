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
            fileCheckError: 'Checking any existing TOC file was unsuccessful. Will be creating a new TOC file.',
            fileFilterError: 'There was an error looking for file "%s". Removing it from the list.',
            directoryNotExistsError: 'The provided scanning path (%s) does not exist.\nPlease provide a valid path!\nExiting now...',
            accessError: 'File/Directory operation failed.\nPlease make sure tha application has the necessary rights.\nExiting now...',
            pdfEncryptedError: 'The file "%s" is encrypted.\nThis version of PDF Merger cannot handle encrypted PDF files, so this file will be ignored from the final PDF.',
            unknownError: 'Unknown Error',

            // info
            filteringFiles: 'filtering files, checking: %s',
            filteringFilePassed: 'item exists, leaving it in',
            filteringFileMissing: 'item not exists, removing',
            echoUserProvidedTargetFile: 'You provided %s as the target file name',
            echoUserProvidedStrings: 'sourceDirectory is: %s, targetFile is: %s',

            tocFileNeedsRewrite: 'TOC file needs rewite',
            tocFileWritten: 'Successfully created a TOC file with the name: %s',
            mergedFileWritten: 'The merged PDF file "%s" was successfully generated!',
            overrideDefaultTargetFile: 'Do you widh to change the name of the generated PDF file?\nIf yes, please provide a filename here, if no, just leave the field as is.',
            continueFromHere: 'A TOC.json file has been created.\nIt contains the name of the target PDF file and the order of the original PDF files to be merged\nDo you wish to edit the file manually before proceeding?',
            userStopped: 'Feel free to edit the generated JSON file.\nWhen you are ready, start the program again. Bye!',
            needsTranslationLabel: '### TRANSLATE ME ### --> '
        },
        'HU': {
        }
    }

    getMessage(messageKey = '') {
        if (this.#messages[this.getLanguage()]?.[messageKey]) {
            return this.#messages[this.getLanguage()][messageKey]
        } else {
            return this.#messages[this.#getDefaultLanguage()].needsTranslationLabel.concat(this.#messages[this.#getDefaultLanguage()][messageKey])
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

    info(messageKey = '', ...parameters) {
        console.info(this.#config.messageSeparator.info.concat(this.getMessage(messageKey), this.#config.messageSeparator.info), ...parameters)
    }
    error(messageKey = '', ...parameters) {
        console.error(this.#config.messageSeparator.error.concat(this.getMessage(messageKey), this.#config.messageSeparator.error), ...parameters)
    }
}
