import { error } from 'node:console'
import fs from 'node:fs'
import path from 'node:path'
import { cwd, exit } from 'node:process'
import { PDFDocument } from 'pdf-lib'
import readlineSync from 'readline-sync'

import { messageTypes, printMessage } from './modules/messagePrinter.mjs'

export class PDFMerger {

    // program defaults
    #config = {
        // value used as space for JSON.stringify, when generating the TOC.json file
        jsonSpace: 4,

        // the directory containing the PDF files to be merged
        // either defaults to the current directory where the program was called
        // or provided by either the TOC.json file or via command line argument
        sourceDirectory: '',
    
        // generated files will go in this folder
        targetDirectory: 'generated',
    
        // default file extensions
        extensions: {
            pdf: '.pdf'
        },

        // if true, the program prompts the user for input on
        // otherwise automatic values, like target file name etc.
        interactive: false
    }

    // this object will be filled in with the appropiate data (filename, toc filename etc.)
    #tocObject = {
        // name of the Table-Of-Contents file that will be used to determine the order of files
        tocFileName: 'TOC.json',
    
        // name of the generated combined file
        // defaults to "current directory".pdf
        targetFile: '',

        files: []
    }

    get #TOCFilePath() {
        return path.join(this.#config.targetDirectory, this.#tocObject.tocFileName)
    }

    // helper to store the existing TOC file that can be used if available
    #existingTOCFileContent
    // flag to decide whether the existing TOC file needs rewrite (for example in case of missing files etc.)
    #existingTOCFileNeedsRewrite

    // program messages
    #messages = {
        errors: {
            fileCheckError: 'Checking any existing TOC file was unsuccessful. Will be creating a new TOC file.',
            fileFilterError: 'There was an error looking for file "%s". Removing it from the list.',
            directoryNotExistsError: 'The provided scanning path (%s) does not exist.\nPlease provide a valid path!\nExiting now...',
            accessError: 'File/Directory operation failed.\nPlease make sure tha application has the necessary rights.\nExiting now...',    
        },

        interaction: {
            overrideDefaultTargetFile: 'Do you widh to change the name of the generated PDF file?\nIf yes, please provide a filename here, if no, just leave the field as is.',
            continueFromHere: 'A TOC.json file has been created.\nIt contains the name of the target PDF file and the order of the original PDF files to be merged\nDo you wish to edit the file manually before proceeding?'
        },
        
        info: {
            userStopped: 'Feel free to edit the generated JSON file.\nWhen you are ready, start the program again. Bye!',
        }
    }

    // object to tag locations of different messages
    #locationMarkers = {
        fileCheck: 'TOC_FILE_CHECK',
        fileFilter: 'TOC_FILE_FILTER',
        targetFolder: 'TARGET_FOLDER',
        mergePDFs: 'MERGE_PDFS',

        userStopped: 'USER_STOPPED'
    }

    // prints various messages in case of any errors
    #dispatchMessage({
        errorObject = null,
        locationMarker = '',
        terminateProgram = false,
        printParams = null
    } = {}) {
        switch (locationMarker) {
            case this.#locationMarkers.fileCheck:
                switch (errorObject.code) {
                    case 'ENOENT':
                        printMessage(messageTypes.error, this.#messages.errors.fileCheckError)
                        break
                    default:
                        printMessage(messageTypes.error, error)
                        break
                }
                break
            case this.#locationMarkers.fileFilter:
                switch (errorObject.code) {
                    case 'ENOENT':
                        printMessage(messageTypes.info, this.#messages.errors.fileFilterError, printParams.missingFile)
                        break
                    default:
                        printMessage(messageTypes.error, errorObject)
                        break
                }
                break
            case this.#locationMarkers.targetFolder:
                switch (errorObject.code) {
                    case 'ENOENT':
                        printMessage(messageTypes.error, this.#messages.errors.directoryNotExistsError, this.#config.sourceDirectory)
                        break
                    case 'EACCES':
                        printMessage(messageTypes.error, this.#messages.errors.accessError)
                        break
                    default:
                        printMessage(messageTypes.error, errorObject)
                        break
                }
                break
            case this.#locationMarkers.mergePDFs:
                switch (errorObject.code) {
                    case 'ENOENT':
                        printMessage(messageTypes.error, this.#messages.errors.directoryNotExistsError, this.#config.sourceDirectory)
                        break
                    case 'EACCES':
                        printMessage(messageTypes.error, this.#messages.errors.accessError)
                        break
                    default:
                        printMessage(messageTypes.error, errorObject)
                        break
                }
                break
            case this.#locationMarkers.userStopped:
                printMessage(messageTypes.info, this.#messages.info.userStopped)
                break
            default:
                break
        }
        if (terminateProgram) {
            exit(1)
        }
    }

    // reads all files in current directory and filters them (only allowed extensions according to config)
    #getPDFFilesFromSourceDirectory(sourceDirectory) {
        return fs.readdirSync(sourceDirectory).filter(item =>
            fs.lstatSync(path.join(sourceDirectory, item)).isFile()
            &&
            path.extname(item).toLowerCase() === this.#config.extensions.pdf
        ).sort((a, b) => 
            a.localeCompare(b)
        )
    }

    // check and read any existing TOC file
    // returns the parsed content
    #checkAndReadExistingTOCFile(filePath) {
        return (
            fs.lstatSync(filePath).isFile()
            ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            : null
        )
    }

    // go through the existing TOC file and remove any file entries
    // that are not in the source directory at the time of scanning
    #filterExistingTOCFile(fileContent) {
        let filteredFiles = { ...fileContent }
        let contentChanged = false
        if (fileContent && fileContent?.files && fileContent.files?.length) {
            filteredFiles.files = fileContent.files.filter((item) => {
                let fileExists = false
                printMessage(messageTypes.info, `filtering files, checking: ${item}`)
                try {
                    fileExists = fs.lstatSync(path.join(this.#config.sourceDirectory, item)).isFile()
                } catch (e) {
                    this.#dispatchMessage({
                        errorObject: e,
                        locationMarker: this.#locationMarkers.fileFilter,
                        printParams: { missingFile: item }
                    })
                }
                printMessage(messageTypes.info, `${fileExists ? 'item exists, leaving it in' : 'item not exists, removing'}`)
                if (!fileExists) contentChanged = true
                return fileExists
            })
        }
        return [ filteredFiles, contentChanged ]
    }

    // create output directory if necessary
    #createTargetDirectory() {
        fs.mkdirSync(this.#config.targetDirectory, {recursive: true})
    }

    // write TOC.json file
    #writeTOCFile(fileObject) {
        fs.writeFileSync(this.#TOCFilePath, JSON.stringify(fileObject, null, this.#config.jsonSpace), { flag: 'w' })
        printMessage(messageTypes.info, `${this.#tocObject.tocFileName} written`)
    }

    async #mergeAndSavePDF(TOCObject) {
        const mergedPDF = await PDFDocument.create();

        for (let pdfFile of TOCObject.files) {
            const pdfContent = await PDFDocument.load(fs.readFileSync(path.join(this.#config.sourceDirectory, pdfFile)));
            const pdfPages = await mergedPDF.copyPages(pdfContent, pdfContent.getPageIndices());
            pdfPages.forEach((page) => mergedPDF.addPage(page));
        }

        const mergedPDFBytes = await mergedPDF.save();
        fs.writeFileSync(path.join(this.#config.targetDirectory, TOCObject.targetFile), mergedPDFBytes, { flag: 'w' })
        printMessage(messageTypes.info, `${this.#tocObject.targetFile} written`)
    }

    init({
        sourceDirectory = null,
        targetFile = null,
        interactive = false
    } = {}) {
        // uses command line argument if given, or the source folder
        this.#config.sourceDirectory = sourceDirectory ? path.resolve(sourceDirectory) : cwd()

        this.#config.interactive = interactive

        this.#tocObject.targetFile = targetFile || (path.parse(this.#config.sourceDirectory).name).concat(this.#config.extensions.pdf)

        if (this.#config.interactive) {
            const userProvidedTargetFile = readlineSync.question(this.#messages.interaction.overrideDefaultTargetFile, {
                defaultInput: this.#tocObject.targetFile
            })
            printMessage(messageTypes.info, `You provided ${userProvidedTargetFile} as the target file name`)
        }

        printMessage(messageTypes.info, `sourceDirectory is: ${this.#config.sourceDirectory}, targetFile is: ${this.#tocObject.targetFile}`)
    }

    // the main program starts here
    start() {
        
        // check for any existing TOC files,
        // if available, read its contents
        try {
            this.#existingTOCFileContent = this.#checkAndReadExistingTOCFile(this.#TOCFilePath)
        } catch (e) {
            this.#dispatchMessage({
                errorObject: e,
                locationMarker: this.#locationMarkers.fileCheck
            })
        }
        
        // if there was an existing TOC file, write it back after filtering
        if (this.#existingTOCFileContent?.files) {
            // filtering existing file contents, wiping out any invalid files
            [ this.#existingTOCFileContent, this.#existingTOCFileNeedsRewrite ] = this.#filterExistingTOCFile(this.#existingTOCFileContent)

            if (this.#existingTOCFileNeedsRewrite) {
                printMessage(messageTypes.info, 'TOC file needs rewite')
                this.#writeTOCFile(this.#existingTOCFileContent)
            }

            this.#tocObject = this.#existingTOCFileContent
        } else {
            try {
                this.#createTargetDirectory()
                this.#tocObject.files = this.#getPDFFilesFromSourceDirectory(this.#config.sourceDirectory)
                this.#writeTOCFile(this.#tocObject)
            } catch (e) {
                this.#dispatchMessage({
                    errorObject: e,
                    locationMarker: this.#locationMarkers.targetFolder,
                    terminateProgram: true
                })
            }
            
        }

        // @TODO ask for user input to continue from here
        // or let the user edit the TOC file first
        const userWishesToEditManually = readlineSync.keyInYNStrict(this.#messages.interaction.continueFromHere)
        
        if (userWishesToEditManually) {
            this.#dispatchMessage({
                locationMarker: this.#locationMarkers.userStopped,
                terminateProgram: true
            })
        }

        // do real work
        // see https://github.com/Hopding/pdf-lib/issues/252#issuecomment-566063380
        try {
            this.#mergeAndSavePDF(this.#tocObject)
        } catch (e) {
            this.#dispatchMessage({
                errorObject: e,
                locationMarker: this.#locationMarkers.mergePDFs,
                terminateProgram: true
            })
        }
        
    }
}