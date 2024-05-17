#!/usr/bin/env node

import { pdfMerger } from '../pdf-merger.mjs'
import { argv, exit } from 'node:process'
import { ArgumentParser } from 'argparse'

const parser = new ArgumentParser({
    description: 'PDF merger'
});

console.dir(parser.parse_args());

let args = argv.slice(2)

    parser.print_help()
    exit();

let myPdfMerger = new pdfMerger(args[0] ?? '.')
myPdfMerger.start()