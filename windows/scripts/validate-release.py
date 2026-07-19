#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import struct
import subprocess
import sys
from pathlib import Path

MACHINES = {"x64": 0x8664, "arm64": 0xAA64}


def pe_machine(path: Path) -> int:
    data = path.read_bytes()
    if data[:2] != b"MZ":
        raise ValueError(f"not a PE file: {path.name}")
    offset = struct.unpack_from("<I", data, 0x3C)[0]
    if data[offset : offset + 4] != b"PE\0\0":
        raise ValueError(f"invalid PE signature: {path.name}")
    return struct.unpack_from("<H", data, offset + 4)[0]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("package_root", type=Path)
    parser.add_argument("version")
    parser.add_argument("architecture", choices=MACHINES)
    args = parser.parse_args()
    root = args.package_root.resolve()
    exe = root / "Safeparts.exe"
    bridge = root / "safeparts_uniffi.dll"
    for path in [exe, bridge, root / "Safeparts.deps.json", root / "Safeparts.runtimeconfig.json", root / "resources.pri"]:
        require(path.is_file(), f"missing package file: {path.name}")
    require((root / "Assets" / "Safeparts.ico").is_file(), "missing app icon")
    require(pe_machine(exe) == MACHINES[args.architecture], "apphost architecture mismatch")
    require(pe_machine(bridge) == MACHINES[args.architecture], "Rust bridge architecture mismatch")
    debug_runtimes = {"ucrtbased.dll", "vcruntime140d.dll", "msvcp140d.dll", "msvcp140_1d.dll", "msvcp140_2d.dll", "concrt140d.dll"}
    forbidden = [path for path in root.rglob("*") if path.is_file() and (path.suffix.lower() in {".pdb", ".ilk", ".exp"} or path.name.lower() in debug_runtimes)]
    require(not forbidden, "debug or intermediate files are present")
    deps = json.loads((root / "Safeparts.deps.json").read_text(encoding="utf-8"))
    runtime = str(deps.get("runtimeTarget", {}).get("name", ""))
    require(f"win-{args.architecture}" in runtime, "managed runtime identifier mismatch")
    for name in ["hostfxr.dll", "hostpolicy.dll", "coreclr.dll"]:
        require((root / name).is_file(), f"missing self-contained runtime file: {name}")
    project = Path(__file__).resolve().parents[1] / "Safeparts.App" / "Safeparts.App.csproj"
    require(f"<Version>{args.version}</Version>" in project.read_text(encoding="utf-8"), "application version mismatch")
    if sys.platform == "win32":
        for path in [exe, bridge]:
            command = f"(Get-AuthenticodeSignature -LiteralPath '{path}').Status"
            result = subprocess.run(["pwsh", "-NoProfile", "-Command", command], check=True, capture_output=True, text=True)
            require(result.stdout.strip() == "NotSigned", f"unexpected signing state for {path.name}")
    print(f"Verified unsigned native Windows {args.architecture} package {args.version}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
