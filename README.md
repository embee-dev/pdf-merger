# PDF Merger
A simple Node CLI tool for merging PDF files.

## Installation
The easiest way to install and use the CLI is to install it as a global module:

`> npm install -g @embee-dev/pdf-merger`

After installation, the CLI tool can be simply run like this in any folder that contains PDF files:

`> pdf-merger`

## Usage
`pdf-merger` is designed to work with folders containing PDF files. It scans the content a folder, generates a special JSON file (called `TOC.json` by default) and then either generates the merged PDF file (based on the values gathered by the first scan) or lets the user edit the content of this JSON file according to their wishes.

Let's say you have 3 separate PDF files that you want to merge:
- `cover.pdf`
- `content.pdf`
- `index.pdf`

To use `pdf-merger`, create a folder (in this example `My Awesome PDF`) and copy/move all 3 files to that folder. Then using the terminal, navigate to this folder and simply run

`me@computer:/.../My Awesome PDF$ pdf-merger`

`pdf-merger` will scan the folder, gather all PDF files inside and then generate a special JSON file (by default called `TOC.json`)

After scanning, `pdf-merger` will ask you to decide whether you want to generate the merged PDF file (with the parameters of the automatically generated `TOC.json` file) or you want to make some changes first:

```
The TOC file "TOC.json" has been generated/checked.
...
Do you wish to continue?
If [Y]ES, the program will generate the PDF,
if [N]O, the program will exit and you can edit the TOC file.
Please press [y/n]: n
```

Let's answer `n` (no) and then `pdf-merger` will exit, letting you make your changes first.

In the example above, this `TOC.json` file will look like this:

```json
{
    "tocFileName": "TOC.json",
    "targetFile": "My Awesome PDF.pdf",
    "files": [
        "content.pdf",
        "cover.pdf",
        "index.pdf"
    ]
}
```

Let's take a closer look at this JSON file!

### `TOC.json` file format

The fields are the following:
- `tocFileName`: the name of the TOC JSON file. (usually you can leave this field unchanged)
- `targetFile`: this will be the **name of the generated/merged PDF file**. The default value is the name of the current folder, where `pdf-merger` was started with an added `.pdf` extension. You can change it to anything that is valid as a filename and also valid as a JSON string.
- `files`: this is a JSON array containing **a list of all the scanned PDF files**. The default order is a simple alphabetical (Unicode) order.
    
Take a look at our example above: if we leave everything as it is, then `content.pdf` will be inserted *before* `cover.pdf`. If you want to change this order, simply open the generated `TOC.json` file with any text editor and change the order of the files to your liking.

**NOTE**: always make sure that after your edits the `TOC.json` file still remains **valid** JSON.

Let's change the order of the files and for now, leave everything else as it is. Our edited `TOC.json` will look like this:

```json
{
    "tocFileName": "TOC.json",
    "targetFile": "My Awesome PDF.pdf",
    "files": [
        "cover.pdf",
        "content.pdf",
        "index.pdf"
    ]
}
```

When you are ready, simply start `pdf-merger` again. It will check and find our existing `TOC.json` file and again display the same prompt as above, but this time we can choose `y` (yes):

```
The TOC file "TOC.json" has been generated/checked.
...
Do you wish to continue?
If [Y]ES, the program will generate the PDF,
if [N]O, the program will exit and you can edit the TOC file.
Please press [y/n]: y

The merged PDF file "My Awesome PDF.pdf" was successfully generated!
Thank you for using PDF Merger!

Bye!
```

And you are done! You can find the generated/merged PDF in the same folder.

## Known Bugs
- **Encrypted PDF files**: `pdf-merger` cannot handle encrypted PDF files. If you include such a file, it will be dismissed/ignored when creating the merged PDF file.

## Planned Features
- **Handle page numbers/page ranges**: the `TOC.json` format is planned to be extended to include a default page range for every document. Based on a common format, there are plans to handle custom page ranges.
- **Creating Bookmarks**: At the moment, the PDF files are just simply copied into one final PDF file. There are plans to add bookmarks to every included file (also custom-editable in the `TOC.json` file).

## Contact
Let me know if you have problems using `pdf-merger` or you have any good suggestions to improve it.

The Github page of the project can be found at the sidebar of this page.