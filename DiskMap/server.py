#!/usr/bin/env python3
from __future__ import annotations

import argparse
import errno
import json
import os
import stat as stat_module
import subprocess
import time
from dataclasses import dataclass
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse


APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"

ARCHIVE_EXTS = {
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".tgz",
    ".bz2",
    ".xz",
    ".dmg",
    ".pkg",
    ".iso",
}
MEDIA_EXTS = {
    ".mov",
    ".mp4",
    ".m4v",
    ".avi",
    ".mkv",
    ".hevc",
    ".mp3",
    ".wav",
    ".aiff",
    ".flac",
}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".heic", ".raw", ".tiff", ".gif", ".webp"}
DOC_EXTS = {".pdf", ".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx", ".key"}
DEV_DIRS = {
    "node_modules",
    ".gradle",
    ".npm",
    ".pnpm-store",
    ".yarn",
    ".cargo",
    ".rustup",
    ".pub-cache",
    "Pods",
    ".build",
    "build",
    "dist",
    ".next",
    ".turbo",
    "DerivedData",
}
CACHE_DIRS = {
    "Caches",
    ".cache",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".parcel-cache",
    ".vite",
}


@dataclass
class ScanOptions:
    max_depth: int = 9
    child_limit: int = 36
    include_hidden: bool = True
    max_entries: int = 240_000


def human_path(path: Path) -> str:
    home = Path.home()
    try:
        return "~/" + str(path.resolve().relative_to(home))
    except ValueError:
        return str(path)


def classify(path: Path, is_dir: bool, size: int) -> tuple[str, list[str], int]:
    name = path.name
    lower_path = str(path).lower()
    ext = path.suffix.lower()
    kind = "folder" if is_dir else "file"
    flags: list[str] = []
    score = 0

    if is_dir and name in CACHE_DIRS:
        kind = "cache"
        flags.append("cache")
        score += 4
    if is_dir and name in DEV_DIRS:
        kind = "dev-artifact"
        flags.append("developer artifact")
        score += 3
    if "/library/caches/" in lower_path or lower_path.endswith("/library/caches"):
        kind = "cache"
        flags.append("cache")
        score += 4
    if "/downloads/" in lower_path:
        flags.append("download")
        score += 1
    if not is_dir and ext in ARCHIVE_EXTS:
        kind = "archive"
        flags.append("archive/installer")
        score += 3
    if not is_dir and ext in MEDIA_EXTS:
        kind = "media"
        flags.append("large media")
        score += 1
    if not is_dir and ext in IMAGE_EXTS:
        kind = "image"
    if not is_dir and ext in DOC_EXTS:
        kind = "document"
    if "xcode/deriveddata" in lower_path:
        kind = "dev-artifact"
        flags.append("Xcode DerivedData")
        score += 4
    if "/trash/" in lower_path or "/.trash/" in lower_path:
        flags.append("trash")
        score += 5
    if size >= 5 * 1024**3:
        flags.append("very large")
        score += 3
    elif size >= 1024**3:
        flags.append("large")
        score += 2

    return kind, sorted(set(flags)), score


def stat_mtime(path: Path) -> float | None:
    try:
        return path.stat().st_mtime
    except OSError:
        return None


def scan_path(root: Path, options: ScanOptions) -> dict[str, Any]:
    started = time.time()
    state = {
        "entries": 0,
        "permission_errors": 0,
        "permission_paths": [],
        "truncated": False,
        "skipped_hidden": 0,
    }

    def record_permission_error(path: Path, exc: OSError | None = None) -> None:
        if exc and exc.errno not in {errno.EACCES, errno.EPERM}:
            return
        state["permission_errors"] += 1
        paths = state["permission_paths"]
        if len(paths) < 12:
            paths.append(human_path(path))

    def scan(current: Path, depth: int) -> dict[str, Any]:
        if state["entries"] >= options.max_entries:
            state["truncated"] = True
            return placeholder_node(current, "entry limit reached")

        state["entries"] += 1
        try:
            st = current.lstat()
        except OSError as exc:
            record_permission_error(current, exc)
            return placeholder_node(current, exc.strerror or "unreadable")

        is_dir = stat_module.S_ISDIR(st.st_mode) and not stat_module.S_ISLNK(st.st_mode)
        if not is_dir:
            size = int(st.st_size)
            kind, flags, score = classify(current, False, size)
            return {
                "name": current.name or str(current),
                "path": str(current),
                "displayPath": human_path(current),
                "size": size,
                "kind": kind,
                "isDir": False,
                "modified": st.st_mtime,
                "flags": flags,
                "score": score,
                "children": [],
                "entryCount": 1,
            }

        total = 0
        entry_count = 1
        children: list[dict[str, Any]] = []
        unreadable: list[str] = []
        if depth >= options.max_depth:
            total, measured_entries = measure_subtree(current)
            kind, flags, score = classify(current, True, total)
            return {
                "name": current.name or str(current),
                "path": str(current),
                "displayPath": human_path(current),
                "size": total,
                "kind": kind,
                "isDir": True,
                "modified": st.st_mtime,
                "flags": flags + ["depth limit"],
                "score": score,
                "children": [],
                "entryCount": measured_entries,
                "limited": True,
            }

        try:
            entries = list(os.scandir(current))
        except OSError as exc:
            record_permission_error(current, exc)
            kind, flags, score = classify(current, True, 0)
            return {
                "name": current.name or str(current),
                "path": str(current),
                "displayPath": human_path(current),
                "size": 0,
                "kind": kind,
                "isDir": True,
                "modified": st.st_mtime,
                "flags": flags,
                "score": score,
                "children": [],
                "entryCount": 1,
                "error": exc.strerror or "unreadable",
            }

        for entry in entries:
            if not options.include_hidden and entry.name.startswith("."):
                state["skipped_hidden"] += 1
                continue
            child_path = Path(entry.path)
            child = scan(child_path, depth + 1)
            total += int(child.get("size", 0))
            entry_count += int(child.get("entryCount", 1))
            if child.get("error"):
                unreadable.append(child["name"])
            children.append(child)
            if state["truncated"]:
                break

        children.sort(key=lambda item: item.get("size", 0), reverse=True)
        omitted = children[options.child_limit :]
        visible_children = children[: options.child_limit]
        omitted_size = sum(int(item.get("size", 0)) for item in omitted)
        kind, flags, score = classify(current, True, total)
        if unreadable:
            flags = sorted(set(flags + ["partially unreadable"]))

        node = {
            "name": current.name or str(current),
            "path": str(current),
            "displayPath": human_path(current),
            "size": total,
            "kind": kind,
            "isDir": True,
            "modified": st.st_mtime,
            "flags": flags,
            "score": score,
            "children": visible_children,
            "entryCount": entry_count,
            "childCount": len(children),
            "omittedCount": len(omitted),
            "omittedSize": omitted_size,
        }
        return node

    def measure_subtree(current: Path) -> tuple[int, int]:
        total = 0
        entry_count = 1
        try:
            entries = list(os.scandir(current))
        except OSError as exc:
            record_permission_error(current, exc)
            return 0, entry_count

        for entry in entries:
            if state["entries"] >= options.max_entries:
                state["truncated"] = True
                break
            if not options.include_hidden and entry.name.startswith("."):
                state["skipped_hidden"] += 1
                continue

            state["entries"] += 1
            entry_count += 1
            child_path = Path(entry.path)
            try:
                st = child_path.lstat()
            except OSError as exc:
                record_permission_error(child_path, exc)
                continue

            if stat_module.S_ISDIR(st.st_mode) and not stat_module.S_ISLNK(st.st_mode):
                child_total, child_entries = measure_subtree(child_path)
                total += child_total
                entry_count += max(0, child_entries - 1)
            else:
                total += int(st.st_size)
        return total, entry_count

    root_node = scan(root, 0)
    candidates = collect_candidates(root_node)
    root_node["scan"] = {
        "durationMs": round((time.time() - started) * 1000),
        "entries": state["entries"],
        "permissionErrors": state["permission_errors"],
        "permissionPaths": state["permission_paths"],
        "truncated": state["truncated"],
        "skippedHidden": state["skipped_hidden"],
        "root": str(root),
        "displayRoot": human_path(root),
    }
    root_node["candidates"] = candidates
    return root_node


def placeholder_node(path: Path, error: str) -> dict[str, Any]:
    return {
        "name": path.name or str(path),
        "path": str(path),
        "displayPath": human_path(path),
        "size": 0,
        "kind": "folder",
        "isDir": True,
        "modified": stat_mtime(path),
        "flags": [],
        "score": 0,
        "children": [],
        "entryCount": 1,
        "error": error,
    }


def collect_candidates(root: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    def walk(node: dict[str, Any]) -> None:
        size = int(node.get("size", 0))
        score = int(node.get("score", 0))
        if size >= 300 * 1024**2 or score >= 3:
            items.append(
                {
                    "name": node.get("name"),
                    "path": node.get("path"),
                    "displayPath": node.get("displayPath"),
                    "size": size,
                    "kind": node.get("kind"),
                    "isDir": node.get("isDir"),
                    "flags": node.get("flags", []),
                    "score": score,
                    "modified": node.get("modified"),
                }
            )
        for child in node.get("children", []):
            walk(child)

    walk(root)
    items.sort(key=lambda item: (item["score"], item["size"]), reverse=True)
    return items[:120]


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        parsed = urlparse(path)
        clean = unquote(parsed.path).lstrip("/")
        if clean == "":
            return str(STATIC_DIR / "index.html")
        return str(STATIC_DIR / clean)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/presets":
            self.send_json(
                {
                    "home": str(Path.home()),
                    "presets": preset_paths(),
                }
            )
            return
        if parsed.path == "/api/scan":
            self.handle_scan(parsed.query)
            return
        if parsed.path == "/api/reveal":
            self.handle_reveal(parsed.query)
            return
        if parsed.path == "/api/open-privacy":
            self.handle_open_privacy()
            return
        for cache_header in ("If-Modified-Since", "If-None-Match"):
            if cache_header in self.headers:
                del self.headers[cache_header]
        super().do_GET()

    def handle_scan(self, query: str) -> None:
        params = parse_qs(query)
        raw_path = params.get("path", [str(Path.home())])[0]
        target = Path(os.path.expanduser(raw_path)).resolve()
        if not target.exists():
            self.send_error_json(HTTPStatus.BAD_REQUEST, f"Path does not exist: {target}")
            return
        if not target.is_dir():
            self.send_error_json(HTTPStatus.BAD_REQUEST, "Please choose a folder to scan.")
            return

        options = ScanOptions(
            max_depth=bounded_int(params.get("maxDepth", ["9"])[0], 1, 20, 9),
            child_limit=bounded_int(params.get("childLimit", ["36"])[0], 8, 100, 36),
            include_hidden=params.get("hidden", ["1"])[0] != "0",
            max_entries=bounded_int(params.get("maxEntries", ["240000"])[0], 10_000, 800_000, 240_000),
        )
        try:
            data = scan_path(target, options)
        except Exception as exc:  # Defensive boundary for the local server.
            self.send_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(exc))
            return
        self.send_json(data)

    def handle_reveal(self, query: str) -> None:
        params = parse_qs(query)
        raw_path = params.get("path", [""])[0]
        if not raw_path:
            self.send_error_json(HTTPStatus.BAD_REQUEST, "Missing path.")
            return
        target = Path(os.path.expanduser(raw_path)).resolve()
        if not target.exists():
            self.send_error_json(HTTPStatus.BAD_REQUEST, f"Path does not exist: {target}")
            return
        try:
            subprocess.run(["open", "-R", str(target)], check=False)
        except OSError as exc:
            self.send_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(exc))
            return
        self.send_json({"ok": True})

    def handle_open_privacy(self) -> None:
        try:
            subprocess.run(
                ["open", "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"],
                check=False,
            )
        except OSError as exc:
            self.send_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(exc))
            return
        self.send_json({"ok": True})

    def send_json(self, payload: Any, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_error_json(self, status: HTTPStatus, message: str) -> None:
        self.send_json({"error": message}, status)

    def log_message(self, fmt: str, *args: Any) -> None:
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))


def bounded_int(value: str, minimum: int, maximum: int, fallback: int) -> int:
    try:
        parsed = int(value)
    except ValueError:
        return fallback
    return max(minimum, min(maximum, parsed))


def preset_paths() -> list[dict[str, str]]:
    home = Path.home()
    candidates = [
        ("Home", home),
        ("Downloads", home / "Downloads"),
        ("Documents", home / "Documents"),
        ("Desktop", home / "Desktop"),
        ("Movies", home / "Movies"),
        ("Pictures", home / "Pictures"),
        ("Library Caches", home / "Library" / "Caches"),
        ("Applications", Path("/Applications")),
    ]
    return [{"label": label, "path": str(path)} for label, path in candidates if path.exists()]


def main() -> None:
    parser = argparse.ArgumentParser(description="Local DiskMap disk usage tool")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8788)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"DiskMap running at http://{args.host}:{args.port}")
    print("Press Ctrl-C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping.")


if __name__ == "__main__":
    main()
