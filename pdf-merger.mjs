import fs from 'node:fs'
import path from 'node:path'
import { exit } from 'node:process'
import { PDFDocument } from 'pdf-lib'
// LATER import { readlineSync } from 'readline-sync'

export class pdfMerger {

    // program defaults
    #config = {

        // value used as space for JSON.stringify, when generating the TOC.json file
        jsonSpace: 4,
    
        // generated files will go in this folder
        targetDir: 'generated',
    
        // default file extensions
        extensions: {
            pdf: '.pdf'
        }
    }

    // program messages
    #messages = {
        TOC_FILE_CHECK_ERROR: 'Checking any existing TOC file was unsuccessful. Will be creating a new TOC file.',
        TOC_FILE_FILTER_ERROR: 'There was an error looking for file "%s". Removing it from the list.',
        DIR_NOT_EXISTS: 'The provided scanning path (%s) does not exist.\nPlease provide a valid path!\nExiting now...',
        ACCESS_ERROR: 'File/Directory operation failed.\nPlease make sure tha application has the necessary rights.\nExiting now...'
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
        return path.join(this.#config.targetDir, this.#tocObject.tocFileName)
    }

    // existing TOC file that can be used if available
    #existingTOCFileContent
    #existingTOCFileNeedsRewrite

    // path of the source directory
    #sourceDirectory
    
    constructor(sourceDirectory) {
        // uses command line argument if given, or the source folder
        this.#sourceDirectory = path.resolve(sourceDirectory)

        console.log(`sourceDirectory is: ${this.#sourceDirectory}`)

        // file name will be based on the folder name of the source directory
        this.#tocObject.targetFile = (path.parse(this.#sourceDirectory).name).concat(this.#config.extensions.pdf)
    }

    // reads all files in current directory and filters them (only allowed extensions according to config)
    #getPDFFilesFromSourceDirectory(sourceDirectory) {
        return fs.readdirSync(sourceDirectory).filter(item =>
            fs.lstatSync(path.join(sourceDirectory, item)).isFile()
            &&
            path.extname(item).toLowerCase() === this.#config.extensions.pdf
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
                console.log(`filtering files, checking: ${item}`)
                try {
                    fileExists = fs.lstatSync(path.join(this.#sourceDirectory, item)).isFile()
                } catch (e) {
                    this.#errorHandler(e, 'TOC_FILE_FILTER', false, { missingFile: item })
                }
                console.log(`${fileExists ? 'item exists, leaving it in' : 'item not exists, removing'}`)
                if (!fileExists) contentChanged = true
                return fileExists
            })
        }
        return [ filteredFiles, contentChanged ]
    }

    // create output directory if necessary
    #createTargetDirectory() {
        fs.mkdirSync(this.#config.targetDir, {recursive: true})
    }

    // write TOC.json file
    #writeTOCFile(fileObject) {
        fs.writeFileSync(this.#TOCFilePath, JSON.stringify(fileObject, null, this.#config.jsonSpace), { flag: 'w' })
        console.info(`${this.#tocObject.tocFileName} written`)
    }

    // prints various messages in case of any errors
    #errorHandler(error, errorLocation, terminate = false, params = {}) {
        switch (errorLocation) {
            case 'TOC_FILE_CHECK':
                switch (error.code) {
                    case 'ENOENT':
                        console.info(this.#messages.TOC_FILE_CHECK_ERROR)
                        break
                    default:
                        break
                }
                break
            case 'TOC_FILE_FILTER':
                switch (error.code) {
                    case 'ENOENT':
                        console.info(this.#messages.TOC_FILE_FILTER_ERROR, params.missingFile)
                        break
                    default:
                        break
                }
                break
            case 'TARGET_FOLDER':
                switch (error.code) {
                    case 'ENOENT':
                        console.error(this.#messages.DIR_NOT_EXISTS, this.#sourceDirectory)
                        break
                    case 'EACCES':
                        console.error(this.#messages.ACCESS_ERROR)
                        break
                    default:
                        break
                }
                break
            default:
                break
        }
        if (terminate) {
            exit(1)
        }
    }

    async #mergeAndSavePDF(TOCObject) {
        const mergedPDF = await PDFDocument.create();

        for (let pdfFile of TOCObject.files) {
            const pdfContent = await PDFDocument.load(fs.readFileSync(path.join(this.#sourceDirectory, pdfFile)));
            const pdfPages = await mergedPDF.copyPages(pdfContent, pdfContent.getPageIndices());
            pdfPages.forEach((page) => mergedPDF.addPage(page));
        }

        const mergedPDFBytes = await mergedPDF.save();
        fs.writeFileSync(path.join(this.#config.targetDir, TOCObject.targetFile), mergedPDFBytes, { flag: 'w' })
    }

    // the main program starts here
    start() {
        
        // check for any existing TOC files,
        // if available, read its contents
        try {
            this.#existingTOCFileContent = this.#checkAndReadExistingTOCFile(this.#TOCFilePath)
        } catch (e) { this.#errorHandler(e, 'TOC_FILE_CHECK', false) }
        
        // if there was an existing TOC file, write it back after filtering
        if (this.#existingTOCFileContent?.files) {
            // filtering existing file contents, wiping out any invalid files
            [ this.#existingTOCFileContent, this.#existingTOCFileNeedsRewrite ] = this.#filterExistingTOCFile(this.#existingTOCFileContent)

            if (this.#existingTOCFileNeedsRewrite) {
                console.info('TOC file needs rewite')
                this.#writeTOCFile(this.#existingTOCFileContent)
            }

            this.#tocObject = this.#existingTOCFileContent
        } else {
            try {
                this.#createTargetDirectory()
                this.#tocObject.files = this.#getPDFFilesFromSourceDirectory(this.#sourceDirectory)
                this.#writeTOCFile(this.#tocObject)
            } catch (e) {
                this.#errorHandler(e, 'TARGET_FOLDER', true)
            }
            
        }

        // @TODO ask for user input to continue from here
        // or let the user edit the TOC file first

        // do real work
        // see https://github.com/Hopding/pdf-lib/issues/252#issuecomment-566063380
        try {
            this.#mergeAndSavePDF(this.#tocObject)
        } catch (e) {
            this.#errorHandler(e, 'MERGE_PDFS', true)
        }
        
    }
}