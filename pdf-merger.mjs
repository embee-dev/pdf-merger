"use strict"
/*
* USER PATH
* - program starts, initiated in the current directory
* OR
* - program starts, uses the directory provided as a command line argument
* - checks if a TOC.json is available in the working directory
* - if yes, alerts the user and skips the reading/JSON writing parts, goes straight to user prompt
* - adds a config object to the JSON, adds "name" that defaults to the current directory
* - reads all PDF files in the working directory (alphabetical order)
* - stores them in an array
* - writes the array as JSON in the working directory
* - prints a message that the JSON is generated, the user must edit the file if necessary
* - wait for user prompt, continue or exit
* - reads the array of files from TOC.json
* - loops through each PDF file and merges them
* - writes the output using the "name" property in the TOC.json file
*/

// import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

console.log('running')