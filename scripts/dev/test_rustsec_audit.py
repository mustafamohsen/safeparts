import unittest

import rustsec_audit


def warning(advisory: str, category: str = "unmaintained") -> dict:
    return {
        "kind": category,
        "advisory": {"id": advisory},
        "package": {"name": "synthetic-package"},
    }


class RustSecAuditTests(unittest.TestCase):
    def test_reviewed_warning_passes(self) -> None:
        report = {
            "vulnerabilities": {"list": []},
            "warnings": {"unmaintained": [warning("RUSTSEC-TEST-0001")]},
        }
        exceptions = {
            "RUSTSEC-TEST-0001": {"category": "unmaintained", "owner": "test"}
        }

        errors, allowed = rustsec_audit.evaluate(report, exceptions)

        self.assertEqual(errors, [])
        self.assertEqual([item.advisory for item in allowed], ["RUSTSEC-TEST-0001"])

    def test_vulnerability_and_unexpected_unsound_advisory_fail(self) -> None:
        report = {
            "vulnerabilities": {
                "list": [
                    {
                        "advisory": {"id": "RUSTSEC-TEST-0002"},
                        "package": {"name": "vulnerable-package"},
                    }
                ]
            },
            "warnings": {
                "unsound": [warning("RUSTSEC-TEST-0003", "unsound")]
            },
        }

        errors, allowed = rustsec_audit.evaluate(report, {})

        self.assertEqual(allowed, [])
        self.assertEqual(len(errors), 2)
        self.assertIn("vulnerability", errors[0])
        self.assertIn("unexpected unsound", errors[1])

    def test_stale_exception_fails(self) -> None:
        report = {"vulnerabilities": {"list": []}, "warnings": {}}
        exceptions = {
            "RUSTSEC-TEST-0004": {"category": "unmaintained", "owner": "test"}
        }

        errors, _ = rustsec_audit.evaluate(report, exceptions)

        self.assertEqual(len(errors), 1)
        self.assertIn("stale", errors[0])


if __name__ == "__main__":
    unittest.main()
