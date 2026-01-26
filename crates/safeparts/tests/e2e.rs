use assert_cmd::Command;
use predicates::prelude::*;

fn run_split(encoding: &str, k: u8, n: u8, input: &[u8], passphrase: Option<&str>) -> Vec<String> {
    let mut cmd = Command::new(assert_cmd::cargo::cargo_bin!("safeparts"));

    cmd.args([
        "split",
        "--k",
        &k.to_string(),
        "--n",
        &n.to_string(),
        "--encoding",
        encoding,
        "--in-stdin",
        "--out-stdout",
    ]);

    if let Some(passphrase) = passphrase {
        cmd.args(["--passphrase", passphrase]);
    }

    let assert = cmd.write_stdin(input).assert().success();

    let stdout = String::from_utf8(assert.get_output().stdout.clone()).unwrap();
    stdout
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .map(str::to_string)
        .collect()
}

fn run_combine(from: &str, shares: &[String], passphrase: Option<&str>) -> Vec<u8> {
    let stdin = shares.join("\n") + "\n";

    let mut cmd = Command::new(assert_cmd::cargo::cargo_bin!("safeparts"));
    cmd.args(["combine", "--from", from, "--in-stdin", "--out-stdout"]);

    if let Some(passphrase) = passphrase {
        cmd.args(["--passphrase", passphrase]);
    }

    let assert = cmd.write_stdin(stdin).assert().success();
    assert.get_output().stdout.clone()
}

#[test]
fn e2e_round_trip_base58check() {
    let input = b"hello e2e base58check";
    let shares = run_split("base58check", 2, 3, input, None);
    let recovered = run_combine("base58check", &shares[..2], None);
    assert_eq!(recovered, input);
}

#[test]
fn e2e_round_trip_base64url() {
    let input = b"hello e2e base64url";
    let shares = run_split("base64url", 2, 3, input, None);
    let recovered = run_combine("base64url", &shares[..2], None);
    assert_eq!(recovered, input);
}

#[test]
fn e2e_round_trip_mnemo_words() {
    let input = b"hello e2e mnemo words";
    let shares = run_split("mnemo-words", 2, 3, input, None);
    let recovered = run_combine("mnemo-words", &shares[..2], None);
    assert_eq!(recovered, input);
}

#[test]
fn e2e_round_trip_mnemo_bip39() {
    let input = b"hello e2e mnemo bip39";
    let shares = run_split("mnemo-bip39", 2, 3, input, None);
    let recovered = run_combine("mnemo-bip39", &shares[..2], None);
    assert_eq!(recovered, input);
}

#[test]
fn e2e_round_trip_encrypted_base64url() {
    let input = b"hello e2e encrypted";
    let shares = run_split("base64url", 2, 3, input, Some("passphrase"));
    let recovered = run_combine("base64url", &shares[..2], Some("passphrase"));
    assert_eq!(recovered, input);
}

#[test]
fn encrypted_without_passphrase_fails() {
    let input = b"hello";
    let shares = run_split("base64url", 2, 3, input, Some("pw"));

    let stdin = format!("{}\n{}\n", shares[0], shares[1]);
    let mut cmd = Command::new(assert_cmd::cargo::cargo_bin!("safeparts"));
    cmd.args([
        "combine",
        "--from",
        "base64url",
        "--in-stdin",
        "--out-stdout",
    ])
    .write_stdin(stdin)
    .assert()
    .failure()
    .stderr(predicate::str::contains("passphrase required"));
}

#[test]
fn wrong_passphrase_fails() {
    let input = b"hello";
    let shares = run_split("base64url", 2, 3, input, Some("pw"));

    let stdin = format!("{}\n{}\n", shares[0], shares[1]);
    let mut cmd = Command::new(assert_cmd::cargo::cargo_bin!("safeparts"));
    cmd.args([
        "combine",
        "--from",
        "base64url",
        "--passphrase",
        "wrong",
        "--in-stdin",
        "--out-stdout",
    ])
    .write_stdin(stdin)
    .assert()
    .failure();
}

#[test]
fn combine_with_insufficient_shares_fails() {
    let input = b"insufficient";
    let shares = run_split("base64url", 2, 3, input, None);

    let stdin = format!("{}\n", shares[0]);
    let mut cmd = Command::new(assert_cmd::cargo::cargo_bin!("safeparts"));
    cmd.args([
        "combine",
        "--from",
        "base64url",
        "--in-stdin",
        "--out-stdout",
    ])
    .write_stdin(stdin)
    .assert()
    .failure()
    .stderr(predicate::str::contains("need at least k shares"));
}
