use std::panic::{AssertUnwindSafe, catch_unwind};

use rand::rngs::StdRng;
use rand::{Rng, RngCore, SeedableRng};
use safeparts_core::crypto::{MAX_MEM_COST_KIB, MAX_PARALLELISM, MAX_TIME_COST};
use safeparts_core::encoding::{self, Encoding};
use safeparts_core::packet::SharePacket;
use safeparts_core::{CoreError, combine_shares, split_secret};

const CASES: usize = 24;
const MAX_SECRET_BYTES: usize = 192;
const MAX_TEXT_BYTES: usize = 32 * 1024;
const SEED: u64 = 0x5afe_2026_0049;

fn generated_secret(rng: &mut StdRng) -> Vec<u8> {
    let mut secret = vec![0; rng.gen_range(0..=MAX_SECRET_BYTES)];
    rng.fill_bytes(&mut secret);
    secret
}

fn compact_input(shares: &[String]) -> String {
    let separators = ["\t", "\r\n", " \n\t "];
    shares
        .iter()
        .enumerate()
        .fold(String::new(), |mut input, (index, share)| {
            if index > 0 {
                input.push_str(separators[(index - 1) % separators.len()]);
            }
            input.push_str(share);
            input
        })
}

#[test]
fn generated_packets_round_trip_through_every_encoding() {
    let mut rng = StdRng::seed_from_u64(SEED);

    for _ in 0..CASES {
        let secret = generated_secret(&mut rng);
        let n = rng.gen_range(1..=5);
        let k = rng.gen_range(1..=n);
        let packets = split_secret(&secret, k, n, None).unwrap();

        for packet in packets {
            for &share_encoding in Encoding::CONCRETE {
                let encoded = encoding::encode_packet(&packet, share_encoding).unwrap();
                assert!(encoded.len() <= MAX_TEXT_BYTES);
                let decoded = encoding::decode_packet(&encoded, share_encoding).unwrap();
                assert_eq!(decoded, packet);
            }
        }
    }
}

#[test]
fn bounded_binary_mutations_and_truncations_never_panic_or_recover() {
    let mut rng = StdRng::seed_from_u64(SEED ^ 0x01);

    for _ in 0..CASES {
        let secret = generated_secret(&mut rng);
        let packets = split_secret(&secret, 2, 3, None).unwrap();
        let encoded = packets[0].encode_binary().unwrap();
        assert!(encoded.len() <= MAX_SECRET_BYTES + 128);

        for truncated_len in 0..encoded.len() {
            let outcome = catch_unwind(|| SharePacket::decode_binary(&encoded[..truncated_len]));
            assert!(outcome.is_ok());
            assert!(outcome.unwrap().is_err());
        }

        for offset in 0..encoded.len() {
            let mut mutated = encoded.clone();
            mutated[offset] ^= 0x5a;
            let outcome = catch_unwind(AssertUnwindSafe(|| SharePacket::decode_binary(&mutated)));
            assert!(outcome.is_ok());

            if let Ok(mutated_packet) = outcome.unwrap() {
                assert!(combine_shares(&[mutated_packet, packets[1].clone()], None).is_err());
            }
        }
    }
}

#[test]
fn bounded_text_mutations_never_panic() {
    let packets = split_secret(b"deterministic text mutation payload", 2, 3, None).unwrap();

    for &share_encoding in Encoding::CONCRETE {
        let encoded = encoding::encode_packet(&packets[0], share_encoding).unwrap();
        assert!(encoded.len() <= MAX_TEXT_BYTES);

        let mut mutated = encoded.into_bytes();
        for offset in (0..mutated.len()).step_by(7) {
            let original = mutated[offset];
            mutated[offset] = b'!';
            let input = String::from_utf8(mutated.clone()).unwrap();
            let outcome = catch_unwind(|| encoding::decode_packet(&input, share_encoding));
            assert!(outcome.is_ok());
            mutated[offset] = original;
        }
    }
}

#[test]
fn metadata_integrity_and_checksum_corruption_cannot_recover() {
    let packets = split_secret(b"deterministic integrity payload", 2, 3, None).unwrap();

    let duplicate = [packets[0].clone(), packets[0].clone()];
    assert!(matches!(
        combine_shares(&duplicate, None),
        Err(CoreError::DuplicateX { .. })
    ));

    let other = split_secret(b"different deterministic payload", 2, 3, None).unwrap();
    assert!(matches!(
        combine_shares(&[packets[0].clone(), other[1].clone()], None),
        Err(CoreError::InconsistentMetadata)
    ));

    let mut corrupted = packets[0].clone();
    corrupted.payload[0] ^= 0x80;
    assert!(matches!(
        combine_shares(&[corrupted, packets[1].clone()], None),
        Err(CoreError::IntegrityCheckFailed)
    ));

    let base58 = encoding::encode_packet(&packets[0], Encoding::Base58check).unwrap();
    let mut corrupted_base58 = base58.into_bytes();
    let last = corrupted_base58.len() - 1;
    corrupted_base58[last] = if corrupted_base58[last] == b'1' {
        b'2'
    } else {
        b'1'
    };
    let corrupted_base58 = String::from_utf8(corrupted_base58).unwrap();
    assert!(encoding::decode_packet(&corrupted_base58, Encoding::Base58check).is_err());
}

#[test]
fn mnemonic_framing_and_appended_input_are_canonical() {
    let packet = &split_secret(&[0x42; 160], 1, 1, None).unwrap()[0];

    let words = encoding::encode_packet(packet, Encoding::MnemoWords).unwrap();
    let appended_word = words.split_whitespace().next().unwrap();
    assert!(
        encoding::decode_packet(&format!("{words} {appended_word}"), Encoding::MnemoWords).is_err()
    );

    let bip39 = encoding::encode_packet(packet, Encoding::MnemoBip39).unwrap();
    let mut frames = bip39.split('/').map(str::trim).collect::<Vec<_>>();
    assert!(frames.len() > 1);
    frames.reverse();
    assert_eq!(
        encoding::decode_packet(&frames.join(" / "), Encoding::MnemoBip39).unwrap(),
        *packet
    );

    let appended_frame = format!("{bip39} / {}", frames[0]);
    assert!(encoding::decode_packet(&appended_frame, Encoding::MnemoBip39).is_err());
}

#[test]
fn auto_parsing_accepts_arbitrary_compact_whitespace() {
    let packets = split_secret(b"deterministic whitespace payload", 2, 3, None).unwrap();

    for &share_encoding in &[Encoding::Base64url, Encoding::Base58check] {
        let shares = packets
            .iter()
            .map(|packet| encoding::encode_packet(packet, share_encoding).unwrap())
            .collect::<Vec<_>>();
        let parsed =
            encoding::parse_share_packets(&compact_input(&shares), Encoding::Auto).unwrap();

        assert_eq!(parsed.encoding, share_encoding);
        assert_eq!(parsed.packets, packets);
    }
}

#[test]
fn mutated_kdf_parameters_are_rejected_before_recovery() {
    let packet = &split_secret(
        b"deterministic encrypted payload",
        1,
        1,
        Some(b"passphrase"),
    )
    .unwrap()[0];
    let encoded = packet.encode_binary().unwrap();
    let mem_cost_offset = 25 + 16 + 12;
    let time_cost_offset = mem_cost_offset + 4;
    let parallelism_offset = time_cost_offset + 4;

    for (offset, unsupported) in [
        (mem_cost_offset, 0),
        (mem_cost_offset, MAX_MEM_COST_KIB + 1),
        (mem_cost_offset, u32::MAX),
        (time_cost_offset, 0),
        (time_cost_offset, MAX_TIME_COST + 1),
        (parallelism_offset, 0),
        (parallelism_offset, MAX_PARALLELISM + 1),
    ] {
        let mut mutated = encoded.clone();
        mutated[offset..offset + 4].copy_from_slice(&unsupported.to_be_bytes());
        assert!(matches!(
            SharePacket::decode_binary(&mutated),
            Err(CoreError::UnsupportedCryptoParams { .. })
        ));
    }
}
