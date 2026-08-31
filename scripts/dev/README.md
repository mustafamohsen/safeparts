# Developer scripts

Run these from the repository root.

```bash
python3 scripts/dev/doctor.py
python3 scripts/dev/verify_dx.py
python3 scripts/dev/check_desktop_parity.py
python3 scripts/dev/test_rust_coverage.py
python3 scripts/dev/rust_coverage.py
python3 scripts/dev/test_rustsec_audit.py
python3 scripts/dev/rustsec_audit.py
python3 scripts/dev/test_workflow_policy.py
python3 scripts/dev/workflow_policy.py
```

Mise shortcuts:

```bash
mise run doctor
mise run dx:verify
mise run desktop:parity
mise run coverage
mise run audit
mise run workflow:check
```

The diagnostic scripts are read-only. The coverage runner writes LCOV, JSON, and HTML reports under `target/coverage/` and fails when a production-code floor is missed. The RustSec runner checks `Cargo.lock` against `rustsec-policy.toml` and rejects unreviewed or expired exceptions. The workflow policy check rejects mutable release actions, moving toolchains and runners, and write permissions outside the publication job.
