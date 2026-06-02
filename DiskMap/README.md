# DiskMap

DiskMap is a small read-only web tool for finding large files, cache folders,
installers, archives, build artifacts, and other cleanup candidates.

It scans a folder, visualizes the largest items as a bubble map, and lets you
drill into folders. No files are ever uploaded or deleted.

## Download the app (scan system folders, no commands)

Want to scan system folders without typing any commands? Grab a prebuilt app
from the [**Releases**](../../releases) page:

- **Windows:** `DiskMap-windows.zip` → unzip → double-click `DiskMap.exe`
- **macOS (Apple Silicon):** `DiskMap-macos.zip` → unzip → double-click `DiskMap.app`

It starts a tiny local server and opens your browser automatically. A
**"경로로 스캔"** box lets you scan any folder your account can read, including
system folders. Click **"DiskMap 종료"** in the app to stop it.

Because the apps are not code-signed, the OS shows a one-time warning:

- **Windows SmartScreen:** click *More info* → *Run anyway*.
- **macOS Gatekeeper:** right-click the app → *Open* → *Open*.

> Builds are produced automatically by GitHub Actions (`.github/workflows/build-diskmap.yml`).
> Push a `diskmap-v*` tag (or run the workflow manually) to publish a new release.

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

## Run the local server from source

Browsers hard-block sensitive/system directories (drive roots, `C:\Windows`,
`/System`, `~/Library`, …) from the directory picker, and there is no way for a
web page to override that. The downloadable app above bundles this server; to
run it from source instead (needs Python 3), use:

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
