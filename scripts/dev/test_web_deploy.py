#!/usr/bin/env python3
"""Behavior and workflow-policy tests for the Web deployment artifact."""

from __future__ import annotations

import functools
import hashlib
import http.server
import json
import re
import subprocess
import sys
import tempfile
import threading
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_TOOL = REPO_ROOT / "web" / "scripts" / "deploy-artifact.py"
WEB_WORKFLOW = REPO_ROOT / ".github" / "workflows" / "web-ci.yml"
CLOUDFLARE_WORKFLOW = REPO_ROOT / ".github" / "workflows" / "cloudflare-workers.yml"
SOURCE_COMMIT = "0123456789abcdef0123456789abcdef01234567"


class DeployArtifactTests(unittest.TestCase):
    def run_tool(self, *args: str, expected: int = 0) -> subprocess.CompletedProcess[str]:
        completed = subprocess.run(
            [sys.executable, str(ARTIFACT_TOOL), *args],
            cwd=REPO_ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        self.assertEqual(expected, completed.returncode, completed.stdout)
        return completed

    def test_prepare_records_and_verifies_the_deployed_content(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            site = root / "site"
            evidence = root / "evidence"
            (site / "assets").mkdir(parents=True)
            (site / "help" / "ar").mkdir(parents=True)
            (site / "index.html").write_text("<h1>Safeparts</h1>\n", encoding="utf-8")
            (site / "assets" / "app.js").write_bytes(b"console.log('synthetic')\n")
            (site / "help" / "ar" / "index.html").write_text("Arabic help\n", encoding="utf-8")

            self.run_tool(
                "prepare",
                "--site",
                str(site),
                "--evidence",
                str(evidence),
                "--source-commit",
                SOURCE_COMMIT,
                "--rust-version",
                "1.93.0",
                "--bun-version",
                "1.3.11",
                "--node-version",
                "22.12.0",
                "--wasm-pack-version",
                "0.15.0",
                "--wasm-bindgen-version",
                "0.2.108",
            )

            manifest = (evidence / "content-manifest.sha256").read_text(encoding="utf-8")
            self.assertEqual(
                manifest,
                "".join(
                    f"{hashlib.sha256((site / relative).read_bytes()).hexdigest()}  {relative}\n"
                    for relative in ["assets/app.js", "help/ar/index.html", "index.html"]
                ),
            )
            metadata = json.loads((site / "safeparts-build" / "metadata.json").read_text())
            self.assertEqual(SOURCE_COMMIT, metadata["sourceCommit"])
            self.assertEqual("1.93.0", metadata["tools"]["rust"])
            self.assertEqual("22.12.0", metadata["tools"]["node"])
            self.assertEqual(hashlib.sha256(manifest.encode()).hexdigest(), metadata["contentDigest"])
            self.assertEqual(
                (site / "safeparts-build" / "metadata.json").read_bytes(),
                (evidence / "metadata.json").read_bytes(),
            )

            self.run_tool("verify", "--site", str(site), "--evidence", str(evidence))
            (site / "assets" / "app.js").write_bytes(b"tampered\n")
            failure = self.run_tool(
                "verify", "--site", str(site), "--evidence", str(evidence), expected=1
            )
            self.assertIn("content manifest does not match", failure.stdout)

    def test_remote_verification_checks_identity_encoded_served_bytes(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            site = root / "site"
            evidence = root / "evidence"
            (site / "help").mkdir(parents=True)
            (site / "index.html").write_text("<h1>Safeparts</h1>\n", encoding="utf-8")
            (site / "help" / "index.html").write_text("Help\n", encoding="utf-8")
            self.run_tool(
                "prepare",
                "--site",
                str(site),
                "--evidence",
                str(evidence),
                "--source-commit",
                SOURCE_COMMIT,
                "--rust-version",
                "1.93.0",
                "--bun-version",
                "1.3.11",
                "--node-version",
                "22.12.0",
                "--wasm-pack-version",
                "0.15.0",
                "--wasm-bindgen-version",
                "0.2.108",
            )

            encodings: list[str | None] = []

            class RecordingHandler(http.server.SimpleHTTPRequestHandler):
                def do_GET(self) -> None:  # noqa: N802 - standard-library callback name
                    encodings.append(self.headers.get("Accept-Encoding"))
                    super().do_GET()

                def log_message(self, format: str, *args: object) -> None:
                    pass

            handler = functools.partial(RecordingHandler, directory=str(site))
            server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                result = self.run_tool(
                    "verify-remote",
                    "--base-url",
                    f"http://127.0.0.1:{server.server_port}",
                    "--evidence",
                    str(evidence),
                )
            finally:
                server.shutdown()
                thread.join()
                server.server_close()

            self.assertIn("verified 2 served files", result.stdout)
            self.assertTrue(encodings)
            self.assertEqual({"identity"}, set(encodings))

    def test_remote_verification_rejects_expected_bytes_served_as_an_error(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            site = root / "site"
            evidence = root / "evidence"
            site.mkdir()
            (site / "index.html").write_text("<h1>Safeparts</h1>\n", encoding="utf-8")
            self.run_tool(
                "prepare",
                "--site",
                str(site),
                "--evidence",
                str(evidence),
                "--source-commit",
                SOURCE_COMMIT,
                "--rust-version",
                "1.93.0",
                "--bun-version",
                "1.3.11",
                "--node-version",
                "22.12.0",
                "--wasm-pack-version",
                "0.15.0",
                "--wasm-bindgen-version",
                "0.2.108",
            )

            class ErrorStatusHandler(http.server.SimpleHTTPRequestHandler):
                def send_response(self, code: int, message: str | None = None) -> None:
                    super().send_response(404, message)

                def log_message(self, format: str, *args: object) -> None:
                    pass

            handler = functools.partial(ErrorStatusHandler, directory=str(site))
            server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                failure = self.run_tool(
                    "verify-remote",
                    "--base-url",
                    f"http://127.0.0.1:{server.server_port}",
                    "--evidence",
                    str(evidence),
                    expected=1,
                )
            finally:
                server.shutdown()
                thread.join()
                server.server_close()

            self.assertIn("HTTP 404", failure.stdout)

    def test_prepare_rejects_a_non_commit_identifier(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            site = root / "site"
            site.mkdir()
            (site / "index.html").write_text("synthetic", encoding="utf-8")
            failure = self.run_tool(
                "prepare",
                "--site",
                str(site),
                "--evidence",
                str(root / "evidence"),
                "--source-commit",
                "main",
                "--rust-version",
                "1.93.0",
                "--bun-version",
                "1.3.11",
                "--node-version",
                "22.12.0",
                "--wasm-pack-version",
                "0.15.0",
                "--wasm-bindgen-version",
                "0.2.108",
                expected=1,
            )
            self.assertIn("40-character lowercase hexadecimal", failure.stdout)


class WorkflowPolicyTests(unittest.TestCase):
    def test_web_workflow_uses_one_tested_artifact_and_immutable_actions(self) -> None:
        workflow = WEB_WORKFLOW.read_text(encoding="utf-8")
        self.assertFalse(CLOUDFLARE_WORKFLOW.exists(), "duplicate provider build workflow remains")
        self.assertNotRegex(workflow, r"curl\s+https?://.*(?:rustup|bun)")
        self.assertNotIn("BUILD_HOOK", workflow)

        for material_input in (
            "Cargo.toml",
            "Cargo.lock",
            ".github/workflows/cloudflare-workers.yml",
        ):
            self.assertEqual(
                2,
                workflow.count(f"- '{material_input}'"),
                f"push and pull-request filters must cover {material_input}",
            )

        action_refs = re.findall(r"^\s*-?\s*uses:\s*([^\s#]+)", workflow, re.MULTILINE)
        self.assertGreaterEqual(len(action_refs), 5)
        for action_ref in action_refs:
            if action_ref.startswith("./"):
                continue
            self.assertRegex(action_ref, r"@[0-9a-f]{40}$", f"mutable action: {action_ref}")

        installs = re.findall(r"^\s*run:\s*(bun install[^\n]*)", workflow, re.MULTILINE)
        self.assertGreaterEqual(len(installs), 2)
        self.assertTrue(all("--frozen-lockfile" in install for install in installs))

        self.assertEqual(1, workflow.count("bun run build:wasm"))
        self.assertIn("bun run test:wasm", workflow)
        self.assertIn("bun run test:e2e:full", workflow)
        self.assertLess(workflow.index("bun run test:e2e:full"), workflow.index("deploy-artifact.py prepare"))
        self.assertLess(workflow.index("deploy-artifact.py prepare"), workflow.index("actions/upload-artifact@"))
        self.assertIn("web-deploy-${{ github.sha }}", workflow)
        self.assertGreaterEqual(workflow.count("actions/download-artifact@"), 2)
        self.assertIn("deploy_netlify:", workflow)
        self.assertIn("deploy_cloudflare:", workflow)

        for job_name in ("deploy_netlify", "deploy_cloudflare"):
            match = re.search(
                rf"^  {job_name}:\n(?P<body>.*?)(?=^  [a-zA-Z_][a-zA-Z0-9_]*:\n|\Z)",
                workflow,
                re.MULTILINE | re.DOTALL,
            )
            self.assertIsNotNone(match)
            job = match.group("body") if match else ""
            self.assertNotIn("build:wasm", job)
            self.assertNotRegex(job, r"bun run (?:build|help:build)")
            self.assertIn("deploy-artifact.py verify", job)

    def test_provider_configuration_cannot_rebuild_source(self) -> None:
        netlify = (REPO_ROOT / "netlify.toml").read_text(encoding="utf-8")
        self.assertNotRegex(netlify, r"(?m)^\s*command\s*=")
        self.assertIn('publish = "web/dist"', netlify)

        wrangler = (REPO_ROOT / "wrangler.jsonc").read_text(encoding="utf-8")
        self.assertIn('"directory": "web/dist"', wrangler)

        package = json.loads((REPO_ROOT / "web" / "package.json").read_text(encoding="utf-8"))
        self.assertEqual("27.4.1", package["devDependencies"]["netlify-cli"])
        self.assertEqual("4.127.1", package["devDependencies"]["wrangler"])


if __name__ == "__main__":
    unittest.main()
