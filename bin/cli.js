#!/usr/bin/env node

import { pdfMerger } from '../pdf-merger.mjs'
import { argv } from 'node:process'

let myPdfMerger = new pdfMerger(argv?.[2] ?? '.')
myPdfMerger.start()