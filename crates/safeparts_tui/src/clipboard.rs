use std::io::{self, Write};

use anyhow::{Context, Result};
use base64::Engine;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CopyMethod {
    System,
    Osc52,
}

pub struct Clipboard {
    inner: Option<arboard::Clipboard>,
}

impl Clipboard {
    pub fn new() -> Self {
        let inner = arboard::Clipboard::new().ok();
        Self { inner }
    }

    pub fn get_text(&mut self) -> Result<String> {
        match self.inner.as_mut() {
            Some(cb) => cb.get_text().context("read clipboard"),
            None => anyhow::bail!("clipboard unavailable"),
        }
    }

    pub fn set_text(&mut self, text: &str) -> Result<CopyMethod> {
        if let Some(cb) = self.inner.as_mut() {
            cb.set_text(text.to_string()).context("write clipboard")?;
            return Ok(CopyMethod::System);
        }

        osc52_copy(text).context("osc52 copy")?;
        Ok(CopyMethod::Osc52)
    }
}

fn osc52_copy(text: &str) -> Result<()> {
    // OSC52: ESC ] 52 ; c ; <base64> BEL
    // Works in many terminals, including over SSH/tmux (when allowed).
    let b64 = base64::engine::general_purpose::STANDARD.encode(text.as_bytes());
    let seq = format!("\x1b]52;c;{b64}\x07");

    let mut out = io::stdout();
    out.write_all(seq.as_bytes()).context("write osc52")?;
    out.flush().context("flush osc52")?;
    Ok(())
}
