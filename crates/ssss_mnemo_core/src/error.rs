use thiserror::Error;

pub type CoreResult<T> = Result<T, CoreError>;

#[derive(Debug, Error)]
pub enum CoreError {
    #[error("invalid parameters: require 1 <= k <= n <= 255, got k={k}, n={n}")]
    InvalidKAndN { k: u8, n: u8 },

    #[error("need at least k shares: need {k}, got {m}")]
    NotEnoughShares { k: u8, m: usize },

    #[error("share set metadata mismatch")]
    InconsistentMetadata,

    #[error("duplicate x coordinate {x}")]
    DuplicateX { x: u8 },

    #[error("invalid x coordinate 0")]
    InvalidX,

    #[error("cannot invert zero")]
    DivisionByZero,

    #[error("invalid combined length {len}")]
    InvalidCombinedLength { len: usize },

    #[error("integrity check failed")]
    IntegrityCheckFailed,

    #[error("invalid packet: {0}")]
    InvalidPacket(String),

    #[error("encoding error: {0}")]
    Encoding(String),

    #[error("crypto error: {0}")]
    Crypto(String),

    #[error("encryption failed")]
    EncryptFailed,

    #[error("decryption failed")]
    DecryptFailed,

    #[error("passphrase required")]
    PassphraseRequired,

    #[error("crypto params mismatch")]
    CryptoParamsMismatch,
}
