/*
* USER PATH
* + program starts, uses the directory provided as a command line argument
* + check if working directory is available, exits if no
* - checks if a TOC.json is available in the working directory
* - if yes, alerts the user and skips the reading/JSON writing parts, goes straight to user prompt
@TODO handle/read/process existing TOC.json file
* + adds a config object to the JSON, adds "name" that defaults to the current directory
* + reads all PDF files in the working directory (alphabetical order)
@TODO create sort function if necessary
* + stores them in an array
* + writes the array as JSON in the output directory
* - prints a message that the JSON is generated, the user must edit the file if necessary
* - wait for user prompt, continue or exit
* - reads the array of files from TOC.json
* - loops through each PDF file and merges them
* - writes the output using the "name" property in the TOC.json file
*/

// import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

import fs, { readFileSync } from 'node:fs'
import path from 'node:path'
import { exit } from 'node:process'

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
        targetFile: ''
    }

    get #TOCFilePath() {
        return path.join(this.#config.targetDir, this.#tocObject.tocFileName)
    }

    // existing TOC file that can be used if available
    #existingTOCFileContent

    // path of the source directory
    #sourceDirectory

    // container for the list of PDF files scanned in the source directory
    #pdfFilesScanned
    
    constructor(sourceDirectory) {
        // uses command line argument if given, or the source folder
        this.#sourceDirectory = sourceDirectory

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
            ? JSON.parse(readFileSync(filePath, 'utf-8'))
            : null
        )
    }

    // go through the existing TOC file and remove any file entries
    // that are not in the source directory at the time of scanning
    #filterExistingTOCFile(fileContent) {
        let filteredFiles = { ...fileContent }
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
                return fileExists
            })
        }
        return filteredFiles
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

    // the main program starts here
    start() {
        
        // check for any existing TOC files,
        // if available, read its contents
        try {
            this.#existingTOCFileContent = this.#checkAndReadExistingTOCFile(this.#TOCFilePath)
        } catch (e) { this.#errorHandler(e, 'TOC_FILE_CHECK', false) }

        // filtering existing file contents, wiping out any invalid files
        this.#existingTOCFileContent = this.#filterExistingTOCFile(this.#existingTOCFileContent)
        
        // if there was an existing TOC file, write it back after filtering
        if (this.#existingTOCFileContent?.files) {
            console.info('TOC file exists, here are the contents:')
            console.info(this.#existingTOCFileContent)
            console.info('writing it back to the disk after filtering')
            this.#writeTOCFile(this.#existingTOCFileContent)
        } else {
            try {
                this.#createTargetDirectory()
                this.#pdfFilesScanned = this.#getPDFFilesFromSourceDirectory(this.#sourceDirectory)
                this.#writeTOCFile({...this.#tocObject, files: this.#pdfFilesScanned})
            } catch (e) {
                this.#errorHandler(e, 'TARGET_FOLDER', true)
            }
            
        }
    }
}