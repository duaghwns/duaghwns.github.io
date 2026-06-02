# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec — bundles server.py + the static/ web UI into one executable.
# Build:  pyinstaller diskmap.spec --noconfirm
import sys

APP_NAME = "DiskMap"

a = Analysis(
    ["server.py"],
    pathex=[],
    binaries=[],
    datas=[("static", "static")],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name=APP_NAME,
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

if sys.platform == "darwin":
    app = BUNDLE(
        exe,
        name=f"{APP_NAME}.app",
        icon=None,
        bundle_identifier="me.duaghwns.diskmap",
        info_plist={
            "CFBundleName": APP_NAME,
            "LSBackgroundOnly": False,
            "NSHighResolutionCapable": True,
        },
    )
