#!/usr/bin/env python3
"""Enforce the repository RustSec policy against Cargo.lock."""

from __future__ import annotations

import json
import subprocess
import sys
import tomllib
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

REQUIRED_EXCEPTION_FIELDS = {
    "advisories",
    "category",
    "package",
    "dependency_path",
    "exposure",
    "constraint",
    "owner",
    "review_by",
}


@dataclass(frozen=True)
class Finding:
    advisory: str
    category: str
    package: str


def load_exceptions(path: Path, today: date) -> tuple[dict[str, dict[str, Any]], list[str]]:
    policy = tomllib.loads(path.read_text(encoding="utf-8"))
    errors: list[str] = []
    if policy.get("schema") != 1:
        errors.append("rustsec policy schema must be 1")

    by_advisory: dict[str, dict[str, Any]] = {}
    for index, exception in enumerate(policy.get("exceptions", []), 1):
        missing = REQUIRED_EXCEPTION_FIELDS - exception.keys()
        if missing:
            errors.append(
                f"exception {index} is missing fields: {', '.join(sorted(missing))}"
            )
            continue

        try:
            review_by = date.fromisoformat(exception["review_by"])
        except (TypeError, ValueError):
            errors.append(f"exception {index} has an invalid review_by date")
            continue
        if review_by < today:
            errors.append(
                f"exception {index} for {exception['package']} expired on {review_by}"
            )

        if exception["category"] not in {"unmaintained", "unsound"}:
            errors.append(
                f"exception {index} has unsupported category {exception['category']}"
            )

        for advisory in exception["advisories"]:
            if advisory in by_advisory:
                errors.append(f"duplicate policy entry for {advisory}")
            by_advisory[advisory] = exception

    return by_advisory, errors


def findings_from_report(report: dict[str, Any]) -> tuple[list[Finding], list[Finding]]:
    vulnerabilities = [
        Finding(
            advisory=item["advisory"]["id"],
            category="vulnerability",
            package=item["package"]["name"],
        )
        for item in report.get("vulnerabilities", {}).get("list", [])
    ]

    warnings = []
    for category, items in report.get("warnings", {}).items():
        warnings.extend(
            Finding(
                advisory=item["advisory"]["id"],
                category=category,
                package=item["package"]["name"],
            )
            for item in items
        )
    return vulnerabilities, warnings


def evaluate(
    report: dict[str, Any], exceptions: dict[str, dict[str, Any]]
) -> tuple[list[str], list[Finding]]:
    vulnerabilities, warnings = findings_from_report(report)
    errors = [
        f"{finding.advisory}: vulnerability in {finding.package}"
        for finding in vulnerabilities
    ]
    allowed: list[Finding] = []
    observed = set()

    for finding in warnings:
        observed.add(finding.advisory)
        exception = exceptions.get(finding.advisory)
        if exception is None:
            errors.append(
                f"{finding.advisory}: unexpected {finding.category} advisory in {finding.package}"
            )
        elif exception["category"] != finding.category:
            errors.append(
                f"{finding.advisory}: reported as {finding.category}, policy says "
                f"{exception['category']}"
            )
        else:
            allowed.append(finding)

    for advisory in exceptions.keys() - observed:
        errors.append(
            f"{advisory}: policy exception is stale; remove it or explain the missing finding"
        )

    return errors, allowed


def audit_report(repo: Path) -> dict[str, Any]:
    command = ["cargo", "audit", "--json"]
    print("+", " ".join(command), flush=True)
    result = subprocess.run(command, cwd=repo, text=True, capture_output=True)
    if result.stderr:
        print(result.stderr, file=sys.stderr, end="")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise RuntimeError(
            f"cargo audit did not return JSON (exit {result.returncode})"
        ) from error


def main() -> int:
    repo = Path(__file__).resolve().parents[2]
    exceptions, policy_errors = load_exceptions(
        repo / "rustsec-policy.toml", date.today()
    )
    if policy_errors:
        for error in policy_errors:
            print(f"error: {error}", file=sys.stderr)
        return 1

    try:
        report = audit_report(repo)
    except (OSError, RuntimeError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    errors, allowed = evaluate(report, exceptions)
    for finding in sorted(allowed, key=lambda item: item.advisory):
        exception = exceptions[finding.advisory]
        print(
            f"reviewed {finding.category}: {finding.advisory} "
            f"({finding.package}; owner: {exception['owner']}; review by: "
            f"{exception['review_by']})"
        )

    if errors:
        print("\nRustSec policy failures:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        f"\nRustSec policy passed: 0 vulnerabilities, "
        f"{len(allowed)} reviewed target/upstream warnings"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
