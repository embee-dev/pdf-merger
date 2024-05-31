# PDF Merger
A simple Node CLI tool for merging PDF files.

## How to install?
The simplest way to install and use the CLI is to install it as a global module:

`> npm install -g @embee-dev/pdf-merger`

After installation, the CLI tool can be simply run like this:

`> pdf-merger`

## How does it work?
`pdf-merger` is designed to work with folders containing PDF files.

Let's say you have 3 separate PDF files that you want to merge:
- `cover-page.pdf`
- `content.pdf`
- `index.pdf`

To use `pdf-merger` create a folder (in this example `My Awesome PDF`) and copy/move all 3 files to that folder. Then using the terminal, navigate to this folder and simply run

`> pdf-merger`

The program will scan the folder, looking for PDF files and then generates a special JSON file (by default called `TOC.json`)