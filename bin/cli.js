#!/usr/bin/env node

import { pdfMerger } from '../pdf-merger.mjs'
import { cwd, argv } from 'node:process'



const myPdfMerger = new pdfMerger(argv?.[2] ?? cwd())
myPdfMerger.start()