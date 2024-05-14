"use strict"
/*
* USER PATH
* + program starts, uses the directory provided as a command line argument
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

// program messages
const messages = {
    DIR_NOT_EXISTS: 'The provided scanning path (%s) does not exist.\nPlease provide a valid path!\nExiting now...'
}

// program defaults
const config = {

    // value used as space for JSON.stringify, when generating the TOC.json file
    jsonSpace: 4,

    // generated files will go in this folder
    outDir: 'generated',

    // default file extensions
    extensions: {
        pdf: '.pdf'
    }
}

// this object will be filled in with the appropiate data (filename, toc filename etc.)
const tocObject = {
    // name of the Table-Of-Contents file that will be used to determine the order of files
    toc: 'TOC.json',

    // name of the generated combined file
    // defaults to "current directory".pdf
    output: ''
}

export function start() {
    // uses command line argument if given, or the current folder
    const workingDirectory = argv?.[2] ?? '.'
    const folderName = path.parse(workingDirectory).name
    let pdfFilesScanned
    
    // file name will be based on the folder name of the current directory
    tocObject.output = folderName.concat(config.extensions.pdf)

    // reads all files in current directory and filters them (only allowed extensions according to config)
    try {
        pdfFilesScanned = fs.readdirSync(workingDirectory).filter(item =>
            fs.lstatSync(path.join(workingDirectory, item)).isFile()
            &&
            path.extname(item).toLowerCase() === config.extensions.pdf
        )
    } catch (e) {
        console.error(messages.DIR_NOT_EXISTS, workingDirectory)
        exit()
    }
    

    // create output directory if necessary
    fs.mkdirSync(config.outDir, {recursive: true})

    // write TOC.json file
    fs.writeFileSync(path.join(config.outDir, tocObject.toc), JSON.stringify({...tocObject, files: pdfFilesScanned}, null, config.jsonSpace), { flag: 'w' })
    console.log(`${tocObject.toc} written`)
}

start();

