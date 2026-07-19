#!/usr/bin/env python3

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    archive = args.archive.resolve()
    if not archive.is_file():
        raise FileNotFoundError(archive)

    hasher = hashlib.sha256()
    with archive.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            hasher.update(chunk)
    checksum = archive.with_suffix(archive.suffix + ".sha256")
    checksum.write_text(f"{hasher.hexdigest()}  {archive.name}\n", encoding="utf-8")
    print(checksum)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
