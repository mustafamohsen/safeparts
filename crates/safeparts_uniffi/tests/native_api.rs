use safeparts_uniffi::{
    BridgeError, ShareEncoding, combine_share_input, inspect_share_input, split_secret,
};

const BINARY_SECRET: &[u8] = &[0, 255, 3, 128];

fn joined_shares(encoding: ShareEncoding, passphrase: Option<&str>) -> String {
    split_secret(
        BINARY_SECRET.to_vec(),
        2,
        3,
        encoding,
        passphrase.map(str::to_owned),
    )
    .expect("synthetic split should succeed")
    .into_iter()
    .take(2)
    .map(|share| share.text)
    .collect::<Vec<_>>()
    .join("\n\n")
}

#[test]
fn public_native_api_round_trips_every_encoding_and_protection_mode() {
    for encoding in [
        ShareEncoding::Base64url,
        ShareEncoding::Base58check,
        ShareEncoding::MnemoWords,
        ShareEncoding::MnemoBip39,
    ] {
        let plain_input = joined_shares(encoding, None);
        let inspection = inspect_share_input(plain_input.clone(), ShareEncoding::Auto)
            .expect("synthetic shares should inspect");
        assert_eq!(inspection.threshold, 2);
        assert_eq!(inspection.share_count, 3);
        assert_eq!(inspection.provided_count, 2);
        assert!(inspection.ready);
        assert!(!inspection.encrypted);
        assert_eq!(
            combine_share_input(plain_input, ShareEncoding::Auto, None)
                .expect("plain shares should recover")
                .bytes,
            BINARY_SECRET
        );

        let protected_input = joined_shares(encoding, Some("correct"));
        assert!(matches!(
            combine_share_input(protected_input.clone(), ShareEncoding::Auto, None),
            Err(BridgeError::PassphraseRequired)
        ));
        assert!(matches!(
            combine_share_input(
                protected_input.clone(),
                ShareEncoding::Auto,
                Some("wrong".to_owned())
            ),
            Err(BridgeError::IncorrectPassphrase)
        ));
        assert_eq!(
            combine_share_input(
                protected_input,
                ShareEncoding::Auto,
                Some("correct".to_owned())
            )
            .expect("protected shares should recover")
            .bytes,
            BINARY_SECRET
        );
    }
}
