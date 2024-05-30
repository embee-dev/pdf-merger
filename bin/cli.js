#!/usr/bin/env node

import { PDFMerger } from '../pdf-merger.mjs'

const myPdfMerger = new PDFMerger()

myPdfMerger.init()
myPdfMerger.start()