use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::{ChaCha20Poly1305, Key, Nonce};
use rand::rngs::OsRng;
use rand::RngCore;
use zeroize::Zeroizing;

use crate::error::{CoreError, CoreResult};

pub const SALT_LEN: usize = 16;
pub const NONCE_LEN: usize = 12;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct CryptoParams {
    pub salt: [u8; SALT_LEN],
    pub nonce: [u8; NONCE_LEN],
    pub mem_cost_kib: u32,
    pub time_cost: u32,
    pub parallelism: u32,
}

impl CryptoParams {
    pub fn random_default() -> Self {
        let mut salt = [0u8; SALT_LEN];
        let mut nonce = [0u8; NONCE_LEN];
        OsRng.fill_bytes(&mut salt);
        OsRng.fill_bytes(&mut nonce);

        Self {
            salt,
            nonce,
            mem_cost_kib: 65_536,
            time_cost: 3,
            parallelism: 1,
        }
    }
}

pub fn encrypt(plaintext: &[u8], passphrase: &[u8]) -> CoreResult<(Vec<u8>, CryptoParams)> {
    let params = CryptoParams::random_default();
    let key = derive_key(passphrase, &params)?;

    let cipher = ChaCha20Poly1305::new(Key::from_slice(&*key));
    let nonce = Nonce::from_slice(&params.nonce);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| CoreError::EncryptFailed)?;

    Ok((ciphertext, params))
}

pub fn decrypt(ciphertext: &[u8], passphrase: &[u8], params: CryptoParams) -> CoreResult<Vec<u8>> {
    let key = derive_key(passphrase, &params)?;

    let cipher = ChaCha20Poly1305::new(Key::from_slice(&*key));
    let nonce = Nonce::from_slice(&params.nonce);

    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| CoreError::DecryptFailed)
}

fn derive_key(passphrase: &[u8], params: &CryptoParams) -> CoreResult<Zeroizing<[u8; 32]>> {
    let argon_params = argon2::Params::new(
        params.mem_cost_kib,
        params.time_cost,
        params.parallelism,
        Some(32),
    )
    .map_err(|e| CoreError::Crypto(format!("argon2 params: {e}")))?;

    let argon = argon2::Argon2::new(
        argon2::Algorithm::Argon2id,
        argon2::Version::V0x13,
        argon_params,
    );

    let mut key = Zeroizing::new([0u8; 32]);
    argon
        .hash_password_into(passphrase, &params.salt, &mut *key)
        .map_err(|e| CoreError::Crypto(format!("argon2: {e}")))?;

    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encrypt_decrypt_round_trip() {
        let plaintext = b"secret";
        let passphrase = b"pass";

        let (ciphertext, params) = encrypt(plaintext, passphrase).unwrap();
        let recovered = decrypt(&ciphertext, passphrase, params).unwrap();
        assert_eq!(recovered, plaintext);
    }

    #[test]
    fn wrong_passphrase_fails() {
        let plaintext = b"secret";
        let passphrase = b"pass";

        let (ciphertext, params) = encrypt(plaintext, passphrase).unwrap();
        let err = decrypt(&ciphertext, b"wrong", params).unwrap_err();
        assert!(matches!(
            err,
            CoreError::DecryptFailed | CoreError::Crypto(_)
        ));
    }
}
