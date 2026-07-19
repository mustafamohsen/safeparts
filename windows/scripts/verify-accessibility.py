#!/usr/bin/env python3

from pathlib import Path

root = Path(__file__).resolve().parents[2]
xaml = (root / "windows" / "Safeparts.App" / "MainWindow.xaml").read_text(encoding="utf-8")
code = (root / "windows" / "Safeparts.App" / "MainWindow.xaml.cs").read_text(encoding="utf-8")
required_xaml = [
    'AutomationProperties.AutomationId="TaskSplit"',
    'AutomationProperties.AutomationId="TaskRecover"',
    'AutomationProperties.AutomationId="SecretText"',
    'AutomationProperties.AutomationId="SplitAction"',
    'AutomationProperties.AutomationId="RecoverAction"',
    'AutomationProperties.LiveSetting="Polite"',
    'AutomationProperties.Name="Recovery share"',
]
required_code = [
    "VirtualKey.Number1",
    "VirtualKey.Number2",
    "VirtualKey.O",
    "VirtualKey.S",
    "VirtualKey.Enter",
    "VirtualKey.Delete",
    "SetTitleBar(AppTitleBar)",
]
missing = [value for value in required_xaml if value not in xaml]
missing.extend(value for value in required_code if value not in code)
if missing:
    raise SystemExit("missing required native accessibility contract: " + ", ".join(missing))
if "#" in xaml and "Color=" in xaml:
    raise SystemExit("hard-coded XAML colors require an accessibility review")
print("Verified native Windows accessibility source contract.")
