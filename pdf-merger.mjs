"use strict"
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

import fs from 'node:fs'
import path from 'node:path'
import { argv, exit } from 'node:process'

export class pdfMerger {
    // program defaults
    config = {

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
    messages = {
        DIR_NOT_EXISTS: 'The provided scanning path (%s) does not exist.\nPlease provide a valid path!\nExiting now...',
        TARGET_DIR_CREATE_FAILED: 'Unable to create target folder (%s).\nPlease make sure the script has the necessary rights\nExiting now...' 
    }
    // this object will be filled in with the appropiate data (filename, toc filename etc.)
    tocObject = {
        // name of the Table-Of-Contents file that will be used to determine the order of files
        toc: 'TOC.json',
    
        // name of the generated combined file
        // defaults to "current directory".pdf
        targetFile: ''
    }
    sourceDirectory
    pdfFilesScanned
    
    constructor() {
        // uses command line argument if given, or the source folder
        this.sourceDirectory = argv?.[2] ?? '.'
        // file name will be based on the folder name of the source directory
        this.tocObject.targetFile = (path.parse(this.sourceDirectory).name).concat(this.config.extensions.pdf)
    }

    // reads all files in current directory and filters them (only allowed extensions according to config)
    scanSourceDirectory() {
        try {
            this.pdfFilesScanned = fs.readdirSync(this.sourceDirectory).filter(item =>
                fs.lstatSync(path.join(this.sourceDirectory, item)).isFile()
                &&
                path.extname(item).toLowerCase() === this.config.extensions.pdf
            )
        } catch (e) {
            console.error(this.messages.DIR_NOT_EXISTS, this.sourceDirectory)
            throw e
        }
    }

    // create output directory if necessary
    createTargetDirectory() {
        try {
            fs.mkdirSync(this.config.targetDir, {recursive: true})
        } catch (e) {
            console.error(this.messages.TARGET_DIR_CREATE_FAILED, this.config.targetDir)
            throw e
        }
    }

    // write TOC.json file
    writeTOCFile() {
        try {
            fs.writeFileSync(path.join(this.config.targetDir, this.tocObject.toc), JSON.stringify({...this.tocObject, files: this.pdfFilesScanned}, null, this.config.jsonSpace), { flag: 'w' })
            console.info(`${this.tocObject.toc} written`)
        } catch (e) {
            console.error(this.messages.TARGET_FILE_WRITE_ERROR, this.tocObject.toc)
            throw e
        }
    }

    start() {
        try {
            this.scanSourceDirectory()
            this.createTargetDirectory()
            this.writeTOCFile()
        } catch (e) {
            exit(1)
        }
    }
}

let myPdfMerger = new pdfMerger();
myPdfMerger.start()