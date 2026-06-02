# DiskMap

DiskMap is a small read-only web tool for finding large files, cache folders,
installers, archives, build artifacts, and other cleanup candidates.

It scans a folder, visualizes the largest items as a bubble map, and lets you
drill into folders. No files are ever uploaded or deleted.

## Run in the browser (no install)

Open `static/index.html` (e.g. via GitHub Pages), click **폴더 선택**, and pick a
folder to analyze. Everything is processed locally in the browser using the
[File System Access API](https://developer.mozilla.org/docs/Web/API/File_System_API).

- Works in **Chrome** and **Edge**. Safari and Firefox do not support the
  directory picker yet.
- Start with `Downloads` or `Documents` for fast results. Scanning a very large
  folder can take a while because each file's size is read individually.
- Selecting an item copies its relative path to the clipboard (browsers cannot
  open Finder/Explorer directly).

## Optional: local server (system folders + macOS Finder)

Browsers hard-block sensitive/system directories (drive roots, `C:\Windows`,
`/System`, `~/Library`, …) from the directory picker, and there is no way for a
web page to override that. To scan those folders — or to get native
"Reveal in Finder" and absolute paths — run the local server:

```bash
python3 server.py
```

Then open:

```text
http://127.0.0.1:8788
```

When the app is served this way it detects the local server and adds a
**"경로로 스캔"** input next to the folder picker. Scans then run through the
server with your account's file permissions, so system folders are readable.

- On macOS, give the terminal app Full Disk Access (System Settings → Privacy &
  Security → Full Disk Access) to read protected folders like `~/Library`.
- On Windows, run the terminal as Administrator to read protected locations.

## Notes

- The tool is intentionally read-only — it never deletes or modifies files.
- All analysis happens on your machine; nothing is sent to a server.
