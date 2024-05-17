#!/usr/bin/env node

import { pdfMerger } from '../pdf-merger.mjs'
import { exit } from 'node:process'
import { ArgumentParser } from 'argparse'

const parser = new ArgumentParser({
    description: 'PDF merger'
})

// let args = parser.parse_args()
exit()

const myPdfMerger = new pdfMerger()
myPdfMerger.sourceDirectory = args.sourceDirectory