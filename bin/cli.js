#!/usr/bin/env node

import { pdfMerger } from '../pdf-merger.mjs'
import { argv } from 'node:process'
import { ArgumentParser } from 'argparse'

const myPdfMerger = new pdfMerger()
const commandLineParameters = argv.slice(2)
let args

const parser = new ArgumentParser({
    description: 'PDF Merger',
    add_help: true
})
parser.add_argument('-s', '--source', { help: 'Path to the source directory, defaults to current folder' })
parser.add_argument('-o', '--output', { help: 'Name of the generated file, defaults to the name of the current folder: "current folder".pdf' })
parser.add_argument('-i', '--interactive', { help: 'Gives the user the possibility to edit options like the name of the generated file etc.', action: 'store_true' })

if (commandLineParameters.length) {
    args = parser.parse_args()
} else {
    args = {}
}

myPdfMerger.init({
    sourceDirectory: args?.source,
    targetFile: args?.output,
    interactive: args.interactive
})
myPdfMerger.start()