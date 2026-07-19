#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

TARGETS = {
    "x64": ("win-x64", "x86_64-pc-windows-msvc", "x64"),
    "arm64": ("win-arm64", "aarch64-pc-windows-msvc", "ARM64"),
}


def run(command: list[str], root: Path) -> None:
    subprocess.run(command, cwd=root, check=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("version")
    parser.add_argument("architecture", choices=TARGETS)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    version = args.version.removeprefix("v")
    if len(version.split(".")) != 3 or not all(part.isdigit() for part in version.split(".")):
        raise ValueError("version must use MAJOR.MINOR.PATCH")
    if sys.platform != "win32":
        raise RuntimeError("native Windows packaging requires Windows")
    root = Path(__file__).resolve().parents[2]
    rid, rust_target, platform = TARGETS[args.architecture]
    work = root / "target" / "native-windows-release" / args.architecture
    publish = work / "publish"
    extract = work / "extract"
    out = (args.output or root / "dist" / "release").resolve()
    shutil.rmtree(work, ignore_errors=True); publish.mkdir(parents=True); out.mkdir(parents=True, exist_ok=True)
    run(["rustup", "target", "add", rust_target], root)
    run(["cargo", "build", "--locked", "--release", "-p", "safeparts_uniffi", "--target", rust_target], root)
    run(["dotnet", "publish", "windows/Safeparts.App/Safeparts.App.csproj", "--configuration", "Release", "--runtime", rid, "--self-contained", "true", f"-p:Platform={platform}", "-p:WindowsPackageType=None", "-p:WindowsAppSDKSelfContained=true", "-p:PublishSingleFile=false", f"-p:Version={version}", f"-p:FileVersion={version}.0", "--output", str(publish)], root)
    for path in publish.rglob("*.pdb"): path.unlink()
    shutil.copy2(root / "target" / rust_target / "release" / "safeparts_uniffi.dll", publish / "safeparts_uniffi.dll")
    if (root / "LICENSE").is_file(): shutil.copy2(root / "LICENSE", publish / "LICENSE")
    run([sys.executable, "windows/scripts/validate-release.py", str(publish), version, args.architecture], root)
    stem = f"safeparts-native-windows-{args.architecture}-{version}"
    archive = out / f"{stem}.zip"
    temporary = archive.with_suffix(".zip.tmp")
    if temporary.exists(): temporary.unlink()
    with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipped:
        for path in sorted(item for item in publish.rglob("*") if item.is_file()):
            info = zipfile.ZipInfo(f"{stem}/{path.relative_to(publish).as_posix()}", (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED; info.external_attr = 0o644 << 16
            zipped.writestr(info, path.read_bytes(), compresslevel=9)
    os.replace(temporary, archive)
    shutil.rmtree(extract, ignore_errors=True); extract.mkdir(parents=True)
    with zipfile.ZipFile(archive) as zipped:
        for member in zipped.infolist():
            destination = (extract / member.filename).resolve()
            if extract.resolve() not in destination.parents: raise RuntimeError("unsafe archive path")
        zipped.extractall(extract)
    run([sys.executable, "windows/scripts/validate-release.py", str(extract / stem), version, args.architecture], root)
    print(archive)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
