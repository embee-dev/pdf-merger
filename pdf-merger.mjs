import { error } from 'node:console'
import fs from 'node:fs'
import path from 'node:path'
import { cwd, exit } from 'node:process'
import { PDFDocument } from 'pdf-lib'
import readlineSync from 'readline-sync'

import { MessagePrinter } from './modules/MessagePrinter.mjs'

export class PDFMerger {

    // program defaults
    #config = {
        // URL of the documentation for the TOC file format
        JSONFormatURL: 'https://www.npmjs.com/package/@embee-dev/pdf-merger##tocjson-file-format',

        // value used as space for JSON.stringify, when generating the TOC.json file
        JSONSpace: 4,

        // the directory containing the PDF files to be merged
        // either defaults to the current directory where the program was called
        // or provided by either the TOC.json file or via command line argument
        sourceDirectory: '',
    
        // generated files will go in this folder
        // @TODO is it necessary?
        targetDirectory: '',
    
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

    #messagePrinter

    // object to tag locations of different messages
    #locationMarkers = {
        fileCheck: 'TOC_FILE_CHECK',
        fileFilter: 'TOC_FILE_FILTER',
        targetFolder: 'TARGET_FOLDER',
        mergePDFs: 'MERGE_PDFS',
        loadPDFs: 'LOAD_PFDS',

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
                        this.#messagePrinter.error('fileCheckError')
                        break
                    default:
                        this.#messagePrinter.error('unknownError', error)
                        break
                }
                break
            case this.#locationMarkers.fileFilter:
                switch (errorObject.code) {
                    case 'ENOENT':
                        this.#messagePrinter.error('fileFilterError', printParams.missingFile)
                        break
                    default:
                        this.#messagePrinter.error('unknownError', errorObject)
                        break
                }
                break
            case this.#locationMarkers.targetFolder:
                switch (errorObject.code) {
                    case 'ENOENT':
                        this.#messagePrinter.error('directoryNotExistsError', this.#config.sourceDirectory)
                        break
                    case 'EACCES':
                        this.#messagePrinter.error('accessError')
                        break
                    default:
                        this.#messagePrinter.error('unknownError', errorObject)
                        break
                }
                break
            case this.#locationMarkers.mergePDFs:
                switch (errorObject.code) {
                    case 'ENOENT':
                        this.#messagePrinter.error('directoryNotExistsError', this.#config.sourceDirectory)
                        break
                    case 'EACCES':
                        this.#messagePrinter.error('accessError')
                        break
                    default:
                        this.#messagePrinter.error('unknownError', errorObject)
                        break
                }
                break
            case this.#locationMarkers.loadPDFs:
                if (errorObject.message.indexOf('encrypted') !== -1) {
                        this.#messagePrinter.error('pdfEncryptedError', printParams.encryptedFile)
                }
                break
            case this.#locationMarkers.userStopped:
                this.#messagePrinter.info('userStopped')
                this.#messagePrinter.info('bye')
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
        let filteredFiles = { ...fileContent },
            contentChanged = false

        if (fileContent && fileContent?.files && fileContent.files?.length) {
            filteredFiles.files = fileContent.files.filter((item) => {
                let fileExists = false
                this.#messagePrinter.group('filteringFile', item)
                try {
                    fileExists = fs.lstatSync(path.join(this.#config.sourceDirectory, item)).isFile()
                } catch (e) {
                    this.#dispatchMessage({
                        errorObject: e,
                        locationMarker: this.#locationMarkers.fileFilter,
                        printParams: { missingFile: item }
                    })
                }
                if (!fileExists) {
                    contentChanged = true
                } else {
                    this.#messagePrinter.info('filteringFilePassed', item)
                }
                this.#messagePrinter.groupEnd()
                return fileExists
            })
        }
        return [ filteredFiles, contentChanged ]
    }

    // create output directory if necessary
    //#createTargetDirectory() {
    //    fs.mkdirSync(this.#config.targetDirectory, {recursive: true})
    //}

    // write TOC.json file
    #writeTOCFile(fileObject) {
        fs.writeFileSync(this.#TOCFilePath, JSON.stringify(fileObject, null, this.#config.JSONSpace), { flag: 'w' })
        this.#messagePrinter.info('tocFileWritten', this.#tocObject.tocFileName)
    }

    async #mergeAndSavePDF(TOCObject) {
        const mergedPDF = await PDFDocument.create();

        for (let pdfFile of TOCObject.files) {
            try {
                const pdfContent = await PDFDocument.load(fs.readFileSync(path.join(this.#config.sourceDirectory, pdfFile)));
                const pdfPages = await mergedPDF.copyPages(pdfContent, pdfContent.getPageIndices());
                pdfPages.forEach((page) => mergedPDF.addPage(page));
            } catch (e) {
                this.#dispatchMessage({
                    errorObject: e,
                    locationMarker: this.#locationMarkers.loadPDFs,
                    printParams: { encryptedFile: pdfFile }
                }) 
            }
        }

        const mergedPDFBytes = await mergedPDF.save();
        fs.writeFileSync(path.join(this.#config.targetDirectory, TOCObject.targetFile), mergedPDFBytes, { flag: 'w' })
        this.#messagePrinter.info('mergedFileWritten', TOCObject.targetFile)
        this.#messagePrinter.info('bye')
    }

    constructor({
        sourceDirectory = null,
        targetFile = null,

        // @TODO is interactive needed?
        interactive = false,

        language = ''
    } = {}) {

        // processing command line arguments
        this.#config.sourceDirectory = sourceDirectory ? path.resolve(sourceDirectory) : cwd()

        this.#config.targetDirectory = this.#config.sourceDirectory

        this.#config.interactive = interactive

        this.#tocObject.targetFile = targetFile || (path.parse(this.#config.sourceDirectory).name).concat(this.#config.extensions.pdf)

        this.#messagePrinter = new MessagePrinter({
            language: language
        })

        this.#messagePrinter.info('welcome')
    }

    // the main program starts here
    start() {

        this.#messagePrinter.info('beginWork')
        
        // check for any existing TOC files,
        // if available, read its contents
        try {
            this.#messagePrinter.group('checkingExistingTOCFile')
            this.#existingTOCFileContent = this.#checkAndReadExistingTOCFile(this.#TOCFilePath)
        } catch (e) {
            this.#dispatchMessage({
                errorObject: e,
                locationMarker: this.#locationMarkers.fileCheck
            })
        } finally {
            this.#messagePrinter.groupEnd()
        }
        
        // if there was an existing TOC file, write it back after filtering
        if (this.#existingTOCFileContent?.files) {
            this.#messagePrinter.group('existingTOCFileFound')

            // filtering existing file contents, wiping out any invalid files
            ; [ this.#existingTOCFileContent, this.#existingTOCFileNeedsRewrite ] = this.#filterExistingTOCFile(this.#existingTOCFileContent)

            this.#messagePrinter.groupEnd()

            if (this.#existingTOCFileNeedsRewrite) {
                this.#messagePrinter.info('tocFileNeedsRewrite')
                this.#writeTOCFile(this.#existingTOCFileContent)
            }

            this.#tocObject = this.#existingTOCFileContent
        } else {
            try {
                // this.#createTargetDirectory()
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
        this.#messagePrinter.info('continueFromHere', this.#tocObject.tocFileName, this.#config.JSONFormatURL)
        const userWishesToContinue = readlineSync.keyInYNStrict(this.#messagePrinter.getMessage('continueFromHerePrompt'))
        
        if (!userWishesToContinue) {
            this.#dispatchMessage({
                locationMarker: this.#locationMarkers.userStopped,
                terminateProgram: true
            })
        }

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