#!/usr/bin/env node

import { pdfMerger } from '../pdf-merger.mjs'
import { argv } from 'node:process'

let args = argv.slice(2)

let myPdfMerger = new pdfMerger(args[0] ?? '.')
myPdfMerger.start()