use std::process::ExitCode;

use camino::Utf8PathBuf;
use uniffi_bindgen::bindings::{KotlinBindingGenerator, SwiftBindingGenerator};

fn main() -> ExitCode {
    if let Err(e) = run() {
        eprintln!("uniffi_gen failed: {e:#}");
        return ExitCode::FAILURE;
    }

    ExitCode::SUCCESS
}

fn run() -> anyhow::Result<()> {
    let crate_root = Utf8PathBuf::from(std::env::var("CARGO_MANIFEST_DIR")?);
    let udl = crate_root.join("src/safeparts_mobile_bridge.udl");

    // Put generated bindings in the app tree so iOS/Android wrappers can consume them.
    let out_base = crate_root.join("../bridge/bindings");
    let out_swift = out_base.join("ios");
    let out_kotlin = out_base.join("android");

    std::fs::create_dir_all(&out_swift)?;
    std::fs::create_dir_all(&out_kotlin)?;

    uniffi_bindgen::generate_bindings(
        udl.as_path(),
        None::<&camino::Utf8Path>,
        SwiftBindingGenerator,
        Some(out_swift.as_path()),
        None::<&camino::Utf8Path>,
        None,
        true,
    )?;

    uniffi_bindgen::generate_bindings(
        udl.as_path(),
        None::<&camino::Utf8Path>,
        KotlinBindingGenerator,
        Some(out_kotlin.as_path()),
        None::<&camino::Utf8Path>,
        None,
        true,
    )?;

    println!("Generated UniFFI bindings into {out_base}");
    Ok(())
}
