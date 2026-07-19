#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

GENERATOR_REPOSITORY = "https://github.com/NordSecurity/uniffi-bindgen-cs"
GENERATOR_REVISION = "e10ce410eb3a10cc19c7928b93ea8d84e038c034"
GENERATOR_VERSION = "uniffi-bindgen 0.11.0+v0.31.0"


def run(command: list[str], *, cwd: Path) -> None:
    subprocess.run(command, cwd=cwd, check=True)


def native_library_name() -> str:
    if sys.platform == "win32":
        return "safeparts_uniffi.dll"
    if sys.platform == "darwin":
        return "libsafeparts_uniffi.dylib"
    return "libsafeparts_uniffi.so"


def generator_binary(tool_root: Path) -> Path:
    suffix = ".exe" if sys.platform == "win32" else ""
    return tool_root / "bin" / f"uniffi-bindgen-cs{suffix}"


def ensure_generator(root: Path, tool_root: Path) -> Path:
    binary = generator_binary(tool_root)
    if binary.is_file():
        result = subprocess.run(
            [str(binary), "--version"],
            cwd=root,
            check=True,
            capture_output=True,
            text=True,
        )
        if result.stdout.strip() == GENERATOR_VERSION:
            return binary

    run(
        [
            "cargo",
            "install",
            "--git",
            GENERATOR_REPOSITORY,
            "--rev",
            GENERATOR_REVISION,
            "--locked",
            "--force",
            "--root",
            str(tool_root),
            "uniffi-bindgen-cs",
        ],
        cwd=root,
    )
    return binary


def normalize(path: Path) -> str:
    lines = [line.rstrip() for line in path.read_text(encoding="utf-8").splitlines()]
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build the host UniFFI library and generate its pinned C# binding"
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail instead of replacing the tracked binding when generated output differs",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2]
    target_dir = Path(os.environ.get("CARGO_TARGET_DIR", root / "target")).resolve()
    tool_root = target_dir / "uniffi-bindgen-cs"
    generated_dir = root / "windows" / "Generated"
    expected = generated_dir / "safeparts_uniffi.cs"

    run(["cargo", "build", "--locked", "-p", "safeparts_uniffi"], cwd=root)
    library = target_dir / "debug" / native_library_name()
    if not library.is_file():
        raise FileNotFoundError(f"Cargo did not produce the host library: {library}")

    generator = ensure_generator(root, tool_root)
    with tempfile.TemporaryDirectory(prefix="safeparts-csharp-") as temporary:
        output_dir = Path(temporary)
        run(
            [
                str(generator),
                "--library",
                "--crate",
                "safeparts_uniffi",
                "--config",
                str(root / "crates" / "safeparts_uniffi" / "uniffi.toml"),
                "--no-format",
                "--out-dir",
                str(output_dir),
                str(library),
            ],
            cwd=root,
        )
        generated = output_dir / "safeparts_uniffi.cs"
        content = normalize(generated)

    if args.check:
        if not expected.is_file() or expected.read_text(encoding="utf-8") != content:
            raise RuntimeError(
                "tracked C# binding is stale; run windows/scripts/prepare.py and commit the result"
            )
        print(f"Verified generated C# binding: {expected.relative_to(root)}")
        return 0

    generated_dir.mkdir(parents=True, exist_ok=True)
    temporary_output = expected.with_suffix(".cs.tmp")
    temporary_output.write_text(content, encoding="utf-8", newline="\n")
    shutil.move(temporary_output, expected)
    print(f"Generated C# binding: {expected.relative_to(root)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
