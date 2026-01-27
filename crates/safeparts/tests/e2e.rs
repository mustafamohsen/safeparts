use assert_cmd::Command;
use predicates::prelude::*;

fn run_split(encoding: &str, k: u8, n: u8, input: &[u8], passphrase: Option<&str>) -> Vec<String> {
    let mut cmd = Command::new(assert_cmd::cargo::cargo_bin!("safeparts"));

    cmd.args([
        "split",
        "-k",
        &k.to_string(),
        "-n",
        &n.to_string(),
        "-e",
        encoding,
    ]);

    if let Some(passphrase) = passphrase {
        cmd.args(["-p", passphrase]);
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

fn run_combine(encoding: Option<&str>, shares: &[String], passphrase: Option<&str>) -> Vec<u8> {
    let stdin = shares.join("\n") + "\n";

    let mut cmd = Command::new(assert_cmd::cargo::cargo_bin!("safeparts"));
    cmd.arg("combine");

    if let Some(encoding) = encoding {
        cmd.args(["-e", encoding]);
    }

    if let Some(passphrase) = passphrase {
        cmd.args(["-p", passphrase]);
    }

    let assert = cmd.write_stdin(stdin).assert().success();
    assert.get_output().stdout.clone()
}

#[test]
fn e2e_round_trip_base58() {
    let input = b"hello e2e base58";
    let shares = run_split("base58", 2, 3, input, None);
    let recovered = run_combine(None, &shares[..2], None);
    assert_eq!(recovered, input);
}

#[test]
fn e2e_round_trip_base64() {
    let input = b"hello e2e base64";
    let shares = run_split("base64", 2, 3, input, None);
    let recovered = run_combine(None, &shares[..2], None);
    assert_eq!(recovered, input);
}

#[test]
fn e2e_round_trip_mnemo_words() {
    let input = b"hello e2e mnemo words";
    let shares = run_split("mnemo-words", 2, 3, input, None);
    let recovered = run_combine(None, &shares[..2], None);
    assert_eq!(recovered, input);
}

#[test]
fn e2e_round_trip_mnemo_bip39() {
    let input = b"hello e2e mnemo bip39";
    let shares = run_split("mnemo-bip39", 2, 3, input, None);
    let recovered = run_combine(None, &shares[..2], None);
    assert_eq!(recovered, input);
}

#[test]
fn e2e_round_trip_encrypted_base64() {
    let input = b"hello e2e encrypted";
    let shares = run_split("base64", 2, 3, input, Some("passphrase"));
    let recovered = run_combine(None, &shares[..2], Some("passphrase"));
    assert_eq!(recovered, input);
}

#[test]
fn encrypted_without_passphrase_fails() {
    let input = b"hello";
    let shares = run_split("base64", 2, 3, input, Some("pw"));

    let stdin = format!("{}\n{}\n", shares[0], shares[1]);
    let mut cmd = Command::new(assert_cmd::cargo::cargo_bin!("safeparts"));
    cmd.args(["combine"])
        .write_stdin(stdin)
        .assert()
        .failure()
        .stderr(predicate::str::contains("passphrase required"));
}

#[test]
fn wrong_passphrase_fails() {
    let input = b"hello";
    let shares = run_split("base64", 2, 3, input, Some("pw"));

    let stdin = format!("{}\n{}\n", shares[0], shares[1]);
    let mut cmd = Command::new(assert_cmd::cargo::cargo_bin!("safeparts"));
    cmd.args(["combine", "-p", "wrong"])
        .write_stdin(stdin)
        .assert()
        .failure();
}

#[test]
fn combine_with_insufficient_shares_fails() {
    let input = b"insufficient";
    let shares = run_split("base64", 2, 3, input, None);

    let stdin = format!("{}\n", shares[0]);
    let mut cmd = Command::new(assert_cmd::cargo::cargo_bin!("safeparts"));
    cmd.args(["combine"])
        .write_stdin(stdin)
        .assert()
        .failure()
        .stderr(predicate::str::contains("need at least k shares"));
}
