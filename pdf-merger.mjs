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
        DIR_NOT_EXISTS: 'The provided scanning path (%s) does not exist.\nPlease provide a valid path!\nExiting now...',
        ACCESS_ERROR: 'File/Directory operation failed.\nPlease make sure tha application has the necessary rights.\nExiting now...' 
    }
    // this object will be filled in with the appropiate data (filename, toc filename etc.)
    #tocObject = {
        // name of the Table-Of-Contents file that will be used to determine the order of files
        toc: 'TOC.json',
    
        // name of the generated combined file
        // defaults to "current directory".pdf
        targetFile: ''
    }
    #sourceDirectory
    #pdfFilesScanned
    
    constructor(sourceDirectory) {
        // uses command line argument if given, or the source folder
        this.#sourceDirectory = sourceDirectory

        console.log(`sourceDirectory is: ${this.#sourceDirectory}`)

        // file name will be based on the folder name of the source directory
        this.#tocObject.targetFile = (path.parse(this.#sourceDirectory).name).concat(this.#config.extensions.pdf)
    }

    // reads all files in current directory and filters them (only allowed extensions according to config)
    #getPDFFilesFromSourceDirectory() {
        this.#pdfFilesScanned = fs.readdirSync(this.#sourceDirectory).filter(item =>
            fs.lstatSync(path.join(this.#sourceDirectory, item)).isFile()
            &&
            path.extname(item).toLowerCase() === this.#config.extensions.pdf
        )
    }

    // create output directory if necessary
    #createTargetDirectory() {
        fs.mkdirSync(this.#config.targetDir, {recursive: true})
    }

    // write TOC.json file
    #writeTOCFile() {
        fs.writeFileSync(path.join(this.#config.targetDir, this.#tocObject.toc), JSON.stringify({...this.#tocObject, files: this.#pdfFilesScanned}, null, this.#config.jsonSpace), { flag: 'w' })
        console.info(`${this.#tocObject.toc} written`)
    }

    // prints various messages in case of any errors
    #printErrorMessage(error) {
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
    }

    start() {
        try {
            this.#getPDFFilesFromSourceDirectory()
            this.#createTargetDirectory()
            this.#writeTOCFile()
        } catch (e) {
            this.#printErrorMessage(e)
            exit(1)
        }
    }
}