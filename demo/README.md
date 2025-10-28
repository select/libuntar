# libuntar Demo

This demo shows how to use libuntar in a browser environment to extract and view files from .tar.gz archives.

## Running the Demo

### Option 1: Using a Simple HTTP Server

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open your browser to `http://localhost:8000/demo/`

### Option 2: Direct File Access

Some modern browsers allow opening HTML files directly, but you may encounter CORS issues with ES modules. Using a local server is recommended.

## Features

- **Drag & Drop**: Upload any .tar.gz file
- **Sample Data**: Load a pre-included sample archive
- **File Browser**: View all files and directories in the archive
- **Content Viewer**: Click on any file to view its contents
- **Statistics**: See file counts and total size
- **Native APIs**: Uses browser's native `DecompressionStream` for gzip decompression

## How It Works

1. User uploads or loads a .tar.gz file
2. File is decompressed using native `DecompressionStream('gzip')`
3. TAR entries are extracted using `tarGetEntries()`
4. Files can be viewed by extracting their data with `tarGetEntryData()`
5. Content is displayed in a clean, readable format

## Browser Compatibility

- Chrome/Edge 80+
- Firefox 113+
- Safari 16.4+

Requires support for:

- ES Modules
- DecompressionStream API
- ArrayBuffer
- Blob/File APIs
