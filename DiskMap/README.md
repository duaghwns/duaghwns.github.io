# DiskMap

DiskMap is a small local macOS-friendly web tool for finding large files,
cache folders, installers, archives, build artifacts, and other cleanup
candidates.

It is intentionally read-only. It scans a folder, visualizes the largest
items as a bubble map, and lets you reveal selected items in Finder.

## Run

```bash
python3 server.py
```

Then open:

```text
http://127.0.0.1:8788
```

## Notes

- Start with `~/Downloads` or `~/Documents` for fast results.
- Scanning your full home folder can take a while.
- macOS privacy permissions may hide some folders unless the terminal app has
  Full Disk Access.
- No files are deleted by this app.

## Permission Denied

If the app reports unreadable folders, click `권한 설정 열기` in the app. In
macOS System Settings, enable Full Disk Access for the app that runs this
server, such as Codex, Terminal, or iTerm. Then restart the server and scan
again.
