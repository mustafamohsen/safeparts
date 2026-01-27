use std::fs;
use std::path::PathBuf;
use std::time::{Duration, Instant};

use anyhow::{Context, Result};
use base64::Engine;
use crossterm::event::{Event, KeyCode, KeyEvent, KeyModifiers};
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Clear, List, ListItem, Paragraph, Tabs, Wrap};
use ratatui::{Frame, Terminal};
use tui_textarea::{Input, TextArea};
use zeroize::Zeroizing;

use crate::clipboard::Clipboard;
use crate::domain::{Encoding, combine_shares, set_id_hex, split_secret};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Tab {
    Split,
    Combine,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum ModalKind {
    LoadSecretFile,
    LoadShareFiles,
    SaveSharesDir,
    SaveSecretFile,
}

#[derive(Debug)]
struct Modal {
    kind: ModalKind,
    input: TextArea<'static>,
}

impl Modal {
    fn new(kind: ModalKind, placeholder: &str) -> Self {
        let mut input = TextArea::default();
        input.set_placeholder_text(placeholder);
        Self { kind, input }
    }
}

pub struct App {
    tab: Tab,
    focus: Focus,

    // split
    split_secret_text: TextArea<'static>,
    split_secret_file: Option<PathBuf>,
    split_secret_file_len: Option<usize>,
    split_k: u8,
    split_n: u8,
    split_encoding: Encoding,
    split_passphrase: Zeroizing<String>,
    split_shares: Vec<String>,
    split_packets: Vec<safeparts_core::packet::SharePacket>,
    split_selected_share: usize,

    // combine
    combine_shares_text: TextArea<'static>,
    combine_encoding: Encoding,
    combine_passphrase: Zeroizing<String>,
    combine_recovered: Option<Vec<u8>>,
    combine_recovered_text: Option<String>,
    combine_used_encoding: Option<Encoding>,

    // common
    clipboard: Clipboard,
    status: String,
    last_status_at: Option<Instant>,
    show_help: bool,
    modal: Option<Modal>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Focus {
    SplitSecret,
    SplitK,
    SplitN,
    SplitEncoding,
    SplitPassphrase,
    SplitShares,

    CombineShares,
    CombineEncoding,
    CombinePassphrase,
}

impl App {
    pub fn new() -> Self {
        let mut split_secret_text = TextArea::default();
        split_secret_text
            .set_placeholder_text("Paste secret text here (UTF-8) or use Load file...");

        let mut combine_shares_text = TextArea::default();
        combine_shares_text.set_placeholder_text(
            "Paste shares here.\n\n- base64/base58: whitespace-separated\n- mnemonics: one share per paragraph (blank-line separated)",
        );

        Self {
            tab: Tab::Split,
            focus: Focus::SplitSecret,

            split_secret_text,
            split_secret_file: None,
            split_secret_file_len: None,
            split_k: 2,
            split_n: 3,
            split_encoding: Encoding::Base64,
            split_passphrase: Zeroizing::new(String::new()),
            split_shares: Vec::new(),
            split_packets: Vec::new(),
            split_selected_share: 0,

            combine_shares_text,
            combine_encoding: Encoding::Auto,
            combine_passphrase: Zeroizing::new(String::new()),
            combine_recovered: None,
            combine_recovered_text: None,
            combine_used_encoding: None,

            clipboard: Clipboard::new(),
            status: String::new(),
            last_status_at: None,
            show_help: false,
            modal: None,
        }
    }

    pub fn run<B: ratatui::backend::Backend>(mut self, terminal: &mut Terminal<B>) -> Result<()> {
        loop {
            terminal.draw(|f| self.render(f))?;

            if crossterm::event::poll(Duration::from_millis(100))? {
                match crossterm::event::read()? {
                    Event::Key(key) => {
                        if self.on_key(key)? {
                            break;
                        }
                    }
                    Event::Resize(_, _) => {}
                    _ => {}
                }
            }

            self.expire_status();
        }

        Ok(())
    }

    fn expire_status(&mut self) {
        if let Some(at) = self.last_status_at {
            if at.elapsed() > Duration::from_secs(3) {
                self.status.clear();
                self.last_status_at = None;
            }
        }
    }

    fn set_status(&mut self, msg: impl Into<String>) {
        self.status = msg.into();
        self.last_status_at = Some(Instant::now());
    }

    fn on_key(&mut self, key: KeyEvent) -> Result<bool> {
        if self.show_help {
            if key.code == KeyCode::Esc || key.code == KeyCode::Char('?') {
                self.show_help = false;
            }
            return Ok(false);
        }

        if self.modal.is_some() {
            return self.on_modal_key(key);
        }

        if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('q') {
            return Ok(true);
        }

        if key.code == KeyCode::F(1) || key.code == KeyCode::Char('?') {
            self.show_help = true;
            return Ok(false);
        }

        if key.code == KeyCode::Tab {
            self.next_focus();
            return Ok(false);
        }

        if key.modifiers.contains(KeyModifiers::SHIFT) && key.code == KeyCode::BackTab {
            self.prev_focus();
            return Ok(false);
        }

        if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('s') {
            self.on_save()?;
            return Ok(false);
        }

        if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('c') {
            self.on_copy()?;
            return Ok(false);
        }

        if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('v') {
            self.on_paste()?;
            return Ok(false);
        }

        match key.code {
            KeyCode::Left => {
                self.prev_tab();
                Ok(false)
            }
            KeyCode::Right => {
                self.next_tab();
                Ok(false)
            }
            KeyCode::Enter => {
                self.on_enter()?;
                Ok(false)
            }
            KeyCode::Char('l') if key.modifiers.contains(KeyModifiers::CONTROL) => {
                self.on_load()?;
                Ok(false)
            }
            KeyCode::Up => {
                self.on_up();
                Ok(false)
            }
            KeyCode::Down => {
                self.on_down();
                Ok(false)
            }
            _ => {
                self.forward_to_widget(key);
                Ok(false)
            }
        }
    }

    fn forward_to_widget(&mut self, key: KeyEvent) {
        match self.focus {
            Focus::SplitSecret => {
                let input: Input = key.into();
                self.split_secret_text.input(input);
                self.split_secret_file = None;
                self.split_secret_file_len = None;
            }
            Focus::CombineShares => {
                let input: Input = key.into();
                self.combine_shares_text.input(input);
            }
            Focus::SplitPassphrase => {
                Self::passphrase_input(key, &mut self.split_passphrase);
            }
            Focus::CombinePassphrase => {
                Self::passphrase_input(key, &mut self.combine_passphrase);
            }
            _ => {}
        }
    }

    fn passphrase_input(key: KeyEvent, buf: &mut Zeroizing<String>) {
        if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('u') {
            buf.clear();
            return;
        }

        match key.code {
            KeyCode::Backspace => {
                buf.pop();
            }
            KeyCode::Char(c) => {
                if !key.modifiers.contains(KeyModifiers::CONTROL)
                    && !key.modifiers.contains(KeyModifiers::ALT)
                {
                    buf.push(c);
                }
            }
            _ => {}
        }
    }

    fn on_up(&mut self) {
        match self.focus {
            Focus::SplitShares => {
                self.split_selected_share = self.split_selected_share.saturating_sub(1);
            }
            Focus::SplitK => {
                self.split_k = self.split_k.saturating_add(1).min(self.split_n).max(1);
            }
            Focus::SplitN => {
                self.split_n = self.split_n.saturating_add(1);
                self.split_k = self.split_k.min(self.split_n);
            }
            Focus::SplitEncoding => {
                self.split_encoding = cycle_encoding(self.split_encoding, -1, Encoding::SPLIT);
            }
            Focus::CombineEncoding => {
                self.combine_encoding = cycle_encoding(self.combine_encoding, -1, Encoding::ALL);
            }
            _ => {}
        }
    }

    fn on_down(&mut self) {
        match self.focus {
            Focus::SplitShares => {
                if !self.split_shares.is_empty() {
                    self.split_selected_share =
                        (self.split_selected_share + 1).min(self.split_shares.len() - 1);
                }
            }
            Focus::SplitK => {
                self.split_k = self.split_k.saturating_sub(1).max(1);
            }
            Focus::SplitN => {
                self.split_n = self.split_n.saturating_sub(1).max(1);
                self.split_k = self.split_k.min(self.split_n);
            }
            Focus::SplitEncoding => {
                self.split_encoding = cycle_encoding(self.split_encoding, 1, Encoding::SPLIT);
            }
            Focus::CombineEncoding => {
                self.combine_encoding = cycle_encoding(self.combine_encoding, 1, Encoding::ALL);
            }
            _ => {}
        }
    }

    fn on_enter(&mut self) -> Result<()> {
        match self.tab {
            Tab::Split => self.do_split(),
            Tab::Combine => self.do_combine(),
        }
    }

    fn on_load(&mut self) -> Result<()> {
        match self.tab {
            Tab::Split => {
                self.modal = Some(Modal::new(
                    ModalKind::LoadSecretFile,
                    "Enter secret file path (bytes).",
                ));
            }
            Tab::Combine => {
                self.modal = Some(Modal::new(
                    ModalKind::LoadShareFiles,
                    "Enter share file paths (one per line).",
                ));
            }
        }
        Ok(())
    }

    fn on_save(&mut self) -> Result<()> {
        match self.tab {
            Tab::Split => {
                if self.split_shares.is_empty() {
                    self.set_status("no shares to save");
                    return Ok(());
                }
                self.modal = Some(Modal::new(
                    ModalKind::SaveSharesDir,
                    "Enter output directory for share files.",
                ));
            }
            Tab::Combine => {
                if self.combine_recovered.is_none() {
                    self.set_status("nothing to save");
                    return Ok(());
                }
                self.modal = Some(Modal::new(
                    ModalKind::SaveSecretFile,
                    "Enter output file path for recovered secret.",
                ));
            }
        }
        Ok(())
    }

    fn on_copy(&mut self) -> Result<()> {
        let text = match self.tab {
            Tab::Split => {
                if self.split_shares.is_empty() {
                    self.set_status("no shares to copy");
                    return Ok(());
                }

                if self.focus == Focus::SplitShares {
                    self.split_shares
                        .get(self.split_selected_share)
                        .cloned()
                        .unwrap_or_default()
                } else {
                    self.split_shares.join("\n") + "\n"
                }
            }
            Tab::Combine => {
                if let Some(text) = self.combine_recovered_text.as_ref() {
                    text.clone()
                } else if let Some(bytes) = self.combine_recovered.as_ref() {
                    base64::engine::general_purpose::STANDARD.encode(bytes)
                } else {
                    self.set_status("nothing to copy");
                    return Ok(());
                }
            }
        };

        match self.clipboard.set_text(&text) {
            Ok(()) => self.set_status("copied"),
            Err(e) => self.set_status(format!("copy failed: {e}")),
        }
        Ok(())
    }

    fn on_paste(&mut self) -> Result<()> {
        let Ok(text) = self.clipboard.get_text() else {
            self.set_status("paste unavailable");
            return Ok(());
        };

        match self.focus {
            Focus::SplitSecret => {
                self.split_secret_text.insert_str(text);
                self.split_secret_file = None;
                self.split_secret_file_len = None;
            }
            Focus::CombineShares => {
                self.combine_shares_text.insert_str(text);
            }
            Focus::SplitPassphrase => {
                self.split_passphrase.push_str(&text);
            }
            Focus::CombinePassphrase => {
                self.combine_passphrase.push_str(&text);
            }
            _ => self.set_status("paste into a text field"),
        }

        Ok(())
    }

    fn on_modal_key(&mut self, key: KeyEvent) -> Result<bool> {
        if key.code == KeyCode::Esc {
            self.modal = None;
            return Ok(false);
        }

        let Some(modal) = self.modal.as_mut() else {
            return Ok(false);
        };

        if key.code == KeyCode::Enter {
            let text = modal.input.lines().join("\n").trim().to_string();

            let kind = modal.kind;
            self.modal = None;
            self.apply_modal(kind, text)?;
            return Ok(false);
        }

        modal.input.input(key);
        Ok(false)
    }

    fn apply_modal(&mut self, kind: ModalKind, text: String) -> Result<()> {
        match kind {
            ModalKind::LoadSecretFile => {
                let p = PathBuf::from(text);
                let bytes = fs::read(&p).with_context(|| format!("read {}", p.display()))?;
                self.split_secret_file_len = Some(bytes.len());
                self.split_secret_file = Some(p);

                // Keep the text editor empty; the file is the source of truth.
                self.split_secret_text = TextArea::default();
                self.split_secret_text.set_placeholder_text(
                    "Using secret file input. Type here to switch back to text input.",
                );

                self.set_status("loaded secret file");
            }
            ModalKind::LoadShareFiles => {
                let mut combined = String::new();
                for line in text.lines().map(str::trim).filter(|l| !l.is_empty()) {
                    let p = PathBuf::from(line);
                    let s =
                        fs::read_to_string(&p).with_context(|| format!("read {}", p.display()))?;
                    combined.push_str(s.trim());
                    combined.push_str("\n\n");
                }
                self.combine_shares_text.insert_str(combined);
                self.set_status("loaded share files");
            }
            ModalKind::SaveSharesDir => {
                let dir = if text.is_empty() {
                    PathBuf::from(".")
                } else {
                    PathBuf::from(text)
                };
                fs::create_dir_all(&dir)
                    .with_context(|| format!("create dir {}", dir.display()))?;

                let set_id = set_id_hex(&self.split_packets).unwrap_or_else(|| "unknown".into());
                let n = self.split_shares.len();

                for (idx, share) in self.split_shares.iter().enumerate() {
                    let i = idx + 1;
                    let filename = format!("safeparts-{set_id}-share-{i}-of-{n}.txt");
                    let path = dir.join(filename);
                    fs::write(&path, format!("{share}\n"))
                        .with_context(|| format!("write {}", path.display()))?;
                }

                self.set_status(format!("saved {n} share files"));
            }
            ModalKind::SaveSecretFile => {
                let Some(bytes) = self.combine_recovered.as_ref() else {
                    self.set_status("nothing to save");
                    return Ok(());
                };

                let path = PathBuf::from(text);
                fs::write(&path, bytes).with_context(|| format!("write {}", path.display()))?;
                self.set_status("saved recovered secret");
            }
        }

        Ok(())
    }

    fn do_split(&mut self) -> Result<()> {
        let secret_bytes = if let Some(path) = self.split_secret_file.clone() {
            fs::read(&path).with_context(|| format!("read {}", path.display()))?
        } else {
            self.split_secret_text.lines().join("\n").into_bytes()
        };

        if secret_bytes.is_empty() {
            self.set_status("secret is empty");
            return Ok(());
        }

        let passphrase = if self.split_passphrase.is_empty() {
            None
        } else {
            Some(self.split_passphrase.as_bytes())
        };

        match split_secret(
            &secret_bytes,
            self.split_k,
            self.split_n,
            self.split_encoding,
            passphrase,
        ) {
            Ok((packets, shares)) => {
                self.split_packets = packets;
                self.split_shares = shares;
                self.split_selected_share = 0;
                self.focus = Focus::SplitShares;
                self.set_status("split ok");
            }
            Err(e) => self.set_status(format!("split error: {e}")),
        }

        Ok(())
    }

    fn do_combine(&mut self) -> Result<()> {
        let input = self.combine_shares_text.lines().join("\n");

        let passphrase = if self.combine_passphrase.is_empty() {
            None
        } else {
            Some(self.combine_passphrase.as_bytes())
        };

        match combine_shares(&input, self.combine_encoding, passphrase) {
            Ok((_packets, bytes, used_enc)) => {
                self.combine_used_encoding = Some(used_enc);
                self.combine_recovered_text = String::from_utf8(bytes.clone()).ok();
                self.combine_recovered = Some(bytes);
                let detected = self
                    .combine_used_encoding
                    .map(|e| e.label().to_string())
                    .unwrap_or_else(|| "unknown".into());
                self.set_status(format!("combined ok ({detected})"));
            }
            Err(e) => {
                self.combine_recovered = None;
                self.combine_recovered_text = None;
                self.set_status(format!("combine error: {e}"));
            }
        }

        Ok(())
    }

    fn next_tab(&mut self) {
        self.tab = match self.tab {
            Tab::Split => Tab::Combine,
            Tab::Combine => Tab::Split,
        };
        self.focus = match self.tab {
            Tab::Split => Focus::SplitSecret,
            Tab::Combine => Focus::CombineShares,
        };
    }

    fn prev_tab(&mut self) {
        self.next_tab();
    }

    fn next_focus(&mut self) {
        self.focus = match (self.tab, self.focus) {
            (Tab::Split, Focus::SplitSecret) => Focus::SplitK,
            (Tab::Split, Focus::SplitK) => Focus::SplitN,
            (Tab::Split, Focus::SplitN) => Focus::SplitEncoding,
            (Tab::Split, Focus::SplitEncoding) => Focus::SplitPassphrase,
            (Tab::Split, Focus::SplitPassphrase) => Focus::SplitShares,
            (Tab::Split, Focus::SplitShares) => Focus::SplitSecret,

            (Tab::Combine, Focus::CombineShares) => Focus::CombineEncoding,
            (Tab::Combine, Focus::CombineEncoding) => Focus::CombinePassphrase,
            (Tab::Combine, Focus::CombinePassphrase) => Focus::CombineShares,

            (Tab::Split, _) => Focus::SplitSecret,
            (Tab::Combine, _) => Focus::CombineShares,
        };
    }

    fn prev_focus(&mut self) {
        self.focus = match (self.tab, self.focus) {
            (Tab::Split, Focus::SplitSecret) => Focus::SplitShares,
            (Tab::Split, Focus::SplitK) => Focus::SplitSecret,
            (Tab::Split, Focus::SplitN) => Focus::SplitK,
            (Tab::Split, Focus::SplitEncoding) => Focus::SplitN,
            (Tab::Split, Focus::SplitPassphrase) => Focus::SplitEncoding,
            (Tab::Split, Focus::SplitShares) => Focus::SplitPassphrase,

            (Tab::Combine, Focus::CombineShares) => Focus::CombinePassphrase,
            (Tab::Combine, Focus::CombineEncoding) => Focus::CombineShares,
            (Tab::Combine, Focus::CombinePassphrase) => Focus::CombineEncoding,

            (Tab::Split, _) => Focus::SplitSecret,
            (Tab::Combine, _) => Focus::CombineShares,
        };
    }

    fn render(&mut self, f: &mut Frame) {
        let size = f.size();

        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),
                Constraint::Min(0),
                Constraint::Length(2),
            ])
            .split(size);

        self.render_tabs(f, chunks[0]);

        match self.tab {
            Tab::Split => self.render_split(f, chunks[1]),
            Tab::Combine => self.render_combine(f, chunks[1]),
        }

        self.render_status(f, chunks[2]);

        if self.show_help {
            self.render_help(f, centered_rect(80, 80, size));
        }

        if let Some(modal) = self.modal.as_mut() {
            Self::render_modal(f, centered_rect(80, 40, size), modal);
        }
    }

    fn render_tabs(&self, f: &mut Frame, area: Rect) {
        let titles = ["Split", "Combine"]
            .iter()
            .map(|t| Line::from(Span::styled(*t, Style::default().fg(Color::White))))
            .collect::<Vec<_>>();

        let idx = match self.tab {
            Tab::Split => 0,
            Tab::Combine => 1,
        };

        let tabs = Tabs::new(titles)
            .select(idx)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title("safeparts-tui"),
            )
            .highlight_style(
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            );
        f.render_widget(tabs, area);
    }

    fn render_status(&self, f: &mut Frame, area: Rect) {
        let help = "Tab focus • ←/→ tabs • Enter run • Ctrl+L load • Ctrl+S save • Ctrl+C copy • Ctrl+Q quit • ? help";
        let text = if self.status.is_empty() {
            help.to_string()
        } else {
            format!("{}  —  {}", self.status, help)
        };

        let p = Paragraph::new(text)
            .style(Style::default().fg(Color::Gray))
            .wrap(Wrap { trim: true });
        f.render_widget(p, area);
    }

    fn render_split(&mut self, f: &mut Frame, area: Rect) {
        let chunks = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(55), Constraint::Percentage(45)])
            .split(area);

        // left: inputs
        let left = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Min(8),
                Constraint::Length(6),
                Constraint::Length(3),
                Constraint::Length(4),
            ])
            .split(chunks[0]);

        let secret_title = if let Some(p) = self.split_secret_file.as_ref() {
            let suffix = self
                .split_secret_file_len
                .map(|len| format!(" ({len} bytes)"))
                .unwrap_or_default();
            format!("Secret (file: {}{suffix})", p.display())
        } else {
            "Secret (text)".to_string()
        };

        let secret_block = block_for(self.focus == Focus::SplitSecret, secret_title);
        self.split_secret_text.set_block(secret_block);
        f.render_widget(&self.split_secret_text, left[0]);

        let params =
            split_params_lines(self.split_k, self.split_n, self.split_encoding, self.focus);
        let params_block = block_for(
            matches!(
                self.focus,
                Focus::SplitK | Focus::SplitN | Focus::SplitEncoding
            ),
            "Params",
        );
        let p = Paragraph::new(params).block(params_block);
        f.render_widget(p, left[1]);

        let passphrase_block = block_for(
            self.focus == Focus::SplitPassphrase,
            "Passphrase (optional)",
        );
        let passphrase_text = masked_passphrase(&self.split_passphrase);
        let passphrase = Paragraph::new(vec![
            Line::from(passphrase_text),
            Line::from("Ctrl+U clears").style(Style::default().fg(Color::Gray)),
        ])
        .block(passphrase_block);
        f.render_widget(passphrase, left[2]);

        let actions = Paragraph::new(vec![
            Line::from("Enter: split"),
            Line::from("Ctrl+L: load secret file"),
            Line::from("Ctrl+S: save shares (per file)"),
        ])
        .block(Block::default().borders(Borders::ALL).title("Actions"));
        f.render_widget(actions, left[3]);

        // right: shares
        let right = Layout::default()
            .direction(Direction::Vertical)
            .constraints([Constraint::Length(8), Constraint::Min(0)])
            .split(chunks[1]);

        let shares_header = Paragraph::new(vec![
            Line::from(format!("Shares: {}", self.split_shares.len())),
            Line::from("Up/Down select share"),
            Line::from("Ctrl+C copy selected (or all)").style(Style::default().fg(Color::Gray)),
        ])
        .block(Block::default().borders(Borders::ALL).title("Shares"));
        f.render_widget(shares_header, right[0]);

        let items = self
            .split_shares
            .iter()
            .enumerate()
            .map(|(i, s)| {
                let label = format!("#{:02} {}", i + 1, preview(s));
                ListItem::new(label)
            })
            .collect::<Vec<_>>();

        let list = List::new(items)
            .block(block_for(self.focus == Focus::SplitShares, "Share list"))
            .highlight_style(
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            )
            .highlight_symbol("▶ ");
        f.render_stateful_widget(list, right[1], &mut list_state(self.split_selected_share));
    }

    fn render_combine(&mut self, f: &mut Frame, area: Rect) {
        let chunks = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(55), Constraint::Percentage(45)])
            .split(area);

        // left: input
        let left = Layout::default()
            .direction(Direction::Vertical)
            .constraints([Constraint::Min(10), Constraint::Length(7)])
            .split(chunks[0]);

        let shares_block = block_for(self.focus == Focus::CombineShares, "Shares input");
        self.combine_shares_text.set_block(shares_block);
        f.render_widget(&self.combine_shares_text, left[0]);

        let settings_block = block_for(
            matches!(
                self.focus,
                Focus::CombineEncoding | Focus::CombinePassphrase
            ),
            "Combine",
        );

        let enc_style = if self.focus == Focus::CombineEncoding {
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD)
        } else {
            Style::default().fg(Color::Cyan)
        };

        let pass_style = if self.focus == Focus::CombinePassphrase {
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD)
        } else {
            Style::default().fg(Color::Cyan)
        };

        let params = vec![
            Line::from(vec![
                Span::raw("Encoding: "),
                Span::styled(self.combine_encoding.label(), enc_style),
            ]),
            Line::from(vec![
                Span::raw("Passphrase: "),
                Span::styled(masked_passphrase(&self.combine_passphrase), pass_style),
            ]),
            Line::from("Enter: combine"),
            Line::from("Ctrl+L: load share files (paths)"),
            Line::from("Ctrl+S: save recovered secret"),
        ];
        let params = Paragraph::new(params).block(settings_block);
        f.render_widget(params, left[1]);

        // right: output
        let right = Layout::default()
            .direction(Direction::Vertical)
            .constraints([Constraint::Length(6), Constraint::Min(0)])
            .split(chunks[1]);

        let meta_lines = vec![
            Line::from(format!(
                "Detected: {}",
                self.combine_used_encoding.map(|e| e.label()).unwrap_or("-")
            )),
            Line::from(format!(
                "Bytes: {}",
                self.combine_recovered.as_ref().map(Vec::len).unwrap_or(0)
            )),
            Line::from("Ctrl+C copies UTF-8 text else base64")
                .style(Style::default().fg(Color::Gray)),
        ];
        let meta = Paragraph::new(meta_lines)
            .block(Block::default().borders(Borders::ALL).title("Recovered"));
        f.render_widget(meta, right[0]);

        let body = if let Some(text) = self.combine_recovered_text.as_ref() {
            text.clone()
        } else if let Some(bytes) = self.combine_recovered.as_ref() {
            base64::engine::general_purpose::STANDARD.encode(bytes)
        } else {
            String::new()
        };

        let out = Paragraph::new(body)
            .block(Block::default().borders(Borders::ALL).title("Output"))
            .wrap(Wrap { trim: false });
        f.render_widget(out, right[1]);
    }

    fn render_help(&self, f: &mut Frame, area: Rect) {
        f.render_widget(Clear, area);
        let lines = vec![
            Line::from("safeparts-tui"),
            Line::from(""),
            Line::from("Navigation"),
            Line::from("  Left/Right: switch Split/Combine"),
            Line::from("  Tab: cycle focus"),
            Line::from(""),
            Line::from("Actions"),
            Line::from("  Enter: run split/combine"),
            Line::from("  Ctrl+L: load file(s)"),
            Line::from("  Ctrl+S: save (shares or secret)"),
            Line::from("  Ctrl+C: copy (UTF-8 else base64)"),
            Line::from("  Ctrl+Q: quit"),
            Line::from(""),
            Line::from("Input formats"),
            Line::from("  base64/base58: whitespace-separated shares"),
            Line::from("  mnemonics: one share per paragraph"),
        ];

        let p = Paragraph::new(lines)
            .block(Block::default().borders(Borders::ALL).title("Help"))
            .wrap(Wrap { trim: false });
        f.render_widget(p, area);
    }

    fn render_modal(f: &mut Frame, area: Rect, modal: &mut Modal) {
        f.render_widget(Clear, area);
        let title = match modal.kind {
            ModalKind::LoadSecretFile => "Load secret file",
            ModalKind::LoadShareFiles => "Load share files",
            ModalKind::SaveSharesDir => "Save shares",
            ModalKind::SaveSecretFile => "Save secret",
        };

        modal
            .input
            .set_block(Block::default().borders(Borders::ALL).title(title));
        f.render_widget(&modal.input, area);
    }
}

fn preview(s: &str) -> String {
    let max = 36;
    if s.len() <= max {
        s.to_string()
    } else {
        format!("{}…", &s[..max])
    }
}

fn masked_passphrase(p: &str) -> String {
    if p.is_empty() {
        "(none)".to_string()
    } else {
        format!(
            "{} (len={})",
            "•".repeat(p.chars().count().min(24)),
            p.chars().count()
        )
    }
}

fn split_params_lines(k: u8, n: u8, encoding: Encoding, focus: Focus) -> Vec<Line<'static>> {
    let k_style = if focus == Focus::SplitK {
        Style::default()
            .fg(Color::Cyan)
            .add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(Color::Cyan)
    };

    let n_style = if focus == Focus::SplitN {
        Style::default()
            .fg(Color::Cyan)
            .add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(Color::Cyan)
    };

    let e_style = if focus == Focus::SplitEncoding {
        Style::default()
            .fg(Color::Cyan)
            .add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(Color::Cyan)
    };

    vec![
        Line::from(vec![
            Span::raw("k: "),
            Span::styled(k.to_string(), k_style),
            Span::raw("   n: "),
            Span::styled(n.to_string(), n_style),
        ]),
        Line::from(vec![
            Span::raw("encoding: "),
            Span::styled(encoding.label(), e_style),
        ]),
        Line::from("Focus fields with Tab; use ↑/↓ to change"),
    ]
}

fn block_for(active: bool, title: impl Into<String>) -> Block<'static> {
    let style = if active {
        Style::default().fg(Color::Cyan)
    } else {
        Style::default()
    };
    Block::default()
        .borders(Borders::ALL)
        .title(title.into())
        .border_style(style)
}

fn cycle_encoding(current: Encoding, delta: i32, allowed: &[Encoding]) -> Encoding {
    let idx = allowed.iter().position(|e| *e == current).unwrap_or(0) as i32;
    let len = allowed.len() as i32;
    let next = (idx + delta).rem_euclid(len) as usize;
    allowed[next]
}

fn centered_rect(percent_x: u16, percent_y: u16, r: Rect) -> Rect {
    let popup_layout = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Percentage((100 - percent_y) / 2),
            Constraint::Percentage(percent_y),
            Constraint::Percentage((100 - percent_y) / 2),
        ])
        .split(r);

    Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage((100 - percent_x) / 2),
            Constraint::Percentage(percent_x),
            Constraint::Percentage((100 - percent_x) / 2),
        ])
        .split(popup_layout[1])[1]
}

fn list_state(selected: usize) -> ratatui::widgets::ListState {
    let mut state = ratatui::widgets::ListState::default();
    state.select(Some(selected));
    state
}
