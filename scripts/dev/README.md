# Developer scripts

Run these from the repository root.

```bash
python3 scripts/dev/doctor.py
python3 scripts/dev/verify_dx.py
python3 scripts/dev/check_desktop_parity.py
```

Mise shortcuts:

```bash
mise run doctor
mise run dx:verify
mise run desktop:parity
```

The scripts are read-only. They report local setup or repository consistency problems and suggest the next command to run.
