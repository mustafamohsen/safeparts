#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import tomllib
import xml.etree.ElementTree as ET
from pathlib import Path


def normalized_version(value: str) -> str:
    version = value.removeprefix("refs/tags/").removeprefix("v")
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version):
        raise ValueError(f"release version must use vMAJOR.MINOR.PATCH form: {value}")
    return version


def toml_version(path: Path) -> str:
    with path.open("rb") as file:
        return str(tomllib.load(file)["package"]["version"])


def json_version(path: Path) -> str:
    with path.open(encoding="utf-8") as file:
        return str(json.load(file)["version"])


def project_version(path: Path) -> str:
    value = ET.parse(path).findtext(".//Version")
    if value is None:
        raise ValueError(f"project has no Version property: {path}")
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description="Check release version consistency")
    parser.add_argument("version")
    args = parser.parse_args()

    expected = normalized_version(args.version)
    root = Path(__file__).resolve().parents[2]
    sources = {
        "crates/safeparts/Cargo.toml": toml_version,
        "crates/safeparts_core/Cargo.toml": toml_version,
        "crates/safeparts_tui/Cargo.toml": toml_version,
        "crates/safeparts_wasm/Cargo.toml": toml_version,
        "crates/safeparts_uniffi/Cargo.toml": toml_version,
        "desktop/src-tauri/Cargo.toml": toml_version,
        "desktop/package.json": json_version,
        "desktop/src-tauri/tauri.conf.json": json_version,
        "windows/Safeparts.App/Safeparts.App.csproj": project_version,
    }

    mismatches: list[str] = []
    for relative, reader in sources.items():
        actual = reader(root / relative)
        if actual != expected:
            mismatches.append(f"{relative}: expected {expected}, found {actual}")

    if mismatches:
        raise RuntimeError("release version mismatch:\n" + "\n".join(mismatches))

    print(f"Verified release version {expected} across {len(sources)} manifests.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
