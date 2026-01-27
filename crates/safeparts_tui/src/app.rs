use std::fs;
use std::path::PathBuf;
use std::time::{Duration, Instant};

use anyhow::{Context, Result};
use base64::Engine;
use crossterm::event::{Event, KeyCode, KeyEvent, KeyModifiers};
use ratatui::layout::{Alignment, Constraint, Direction, Layout, Margin, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span, Text};
use ratatui::widgets::{
    Block, Borders, Cell, Clear, List, ListItem, Paragraph, Row, Table, Tabs, Wrap,
};
use ratatui::{Frame, Terminal};
use tui_textarea::{Input, TextArea};
use zeroize::Zeroizing;

use crate::clipboard::Clipboard;
use crate::domain::{Encoding, combine_shares, set_id_hex, split_secret};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum TabId {
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

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum StatusKind {
    Info,
    Ok,
    Error,
}

#[derive(Clone, Debug)]
struct Status {
    kind: StatusKind,
    msg: String,
    at: Instant,
}

#[derive(Clone, Copy, Debug)]
struct Theme {
    accent: Color,
    dim: Color,
    ok: Color,
    err: Color,
    border: Color,
}

impl Theme {
    fn default_dark() -> Self {
        Self {
            accent: Color::Cyan,
            dim: Color::Gray,
            ok: Color::Green,
            err: Color::Red,
            border: Color::DarkGray,
        }
    }
}

pub struct App {
    tab: TabId,
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
    status: Option<Status>,
    show_help: bool,
    modal: Option<Modal>,
    theme: Theme,
}

impl App {
    pub fn new() -> Self {
        let theme = Theme::default_dark();

        let mut split_secret_text = TextArea::default();
        split_secret_text
            .set_placeholder_text("Paste secret text here (UTF-8) or Ctrl+L to load a file...");

        let mut combine_shares_text = TextArea::default();
        combine_shares_text.set_placeholder_text(
            "Paste shares here.\n\n- base64/base58: whitespace-separated\n- mnemonics: one share per paragraph (blank-line separated)",
        );

        Self {
            tab: TabId::Split,
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
            status: None,
            show_help: false,
            modal: None,
            theme,
        }
    }

    pub fn run<B: ratatui::backend::Backend>(mut self, terminal: &mut Terminal<B>) -> Result<()> {
        loop {
            terminal.draw(|f| self.render(f))?;

            if crossterm::event::poll(Duration::from_millis(50))? {
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
        if let Some(status) = self.status.as_ref() {
            if status.at.elapsed() > Duration::from_secs(3) {
                self.status = None;
            }
        }
    }

    fn set_status(&mut self, kind: StatusKind, msg: impl Into<String>) {
        self.status = Some(Status {
            kind,
            msg: msg.into(),
            at: Instant::now(),
        });
    }

    fn set_ok(&mut self, msg: impl Into<String>) {
        self.set_status(StatusKind::Ok, msg);
    }

    fn set_err(&mut self, msg: impl Into<String>) {
        self.set_status(StatusKind::Error, msg);
    }

    fn set_info(&mut self, msg: impl Into<String>) {
        self.set_status(StatusKind::Info, msg);
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

        if key.code == KeyCode::BackTab {
            self.prev_focus();
            return Ok(false);
        }

        if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('l') {
            self.on_load()?;
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
            TabId::Split => self.do_split(),
            TabId::Combine => self.do_combine(),
        }
    }

    fn on_load(&mut self) -> Result<()> {
        match self.tab {
            TabId::Split => {
                self.modal = Some(Modal::new(
                    ModalKind::LoadSecretFile,
                    "Enter secret file path (bytes)",
                ));
            }
            TabId::Combine => {
                self.modal = Some(Modal::new(
                    ModalKind::LoadShareFiles,
                    "Enter share file paths (one per line)",
                ));
            }
        }
        Ok(())
    }

    fn on_save(&mut self) -> Result<()> {
        match self.tab {
            TabId::Split => {
                if self.split_shares.is_empty() {
                    self.set_info("no shares to save");
                    return Ok(());
                }
                self.modal = Some(Modal::new(
                    ModalKind::SaveSharesDir,
                    "Enter output directory for share files",
                ));
            }
            TabId::Combine => {
                if self.combine_recovered.is_none() {
                    self.set_info("nothing to save");
                    return Ok(());
                }
                self.modal = Some(Modal::new(
                    ModalKind::SaveSecretFile,
                    "Enter output file path for recovered secret",
                ));
            }
        }
        Ok(())
    }

    fn on_copy(&mut self) -> Result<()> {
        let text = match self.tab {
            TabId::Split => {
                if self.split_shares.is_empty() {
                    self.set_info("no shares to copy");
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
            TabId::Combine => {
                if let Some(text) = self.combine_recovered_text.as_ref() {
                    text.clone()
                } else if let Some(bytes) = self.combine_recovered.as_ref() {
                    base64::engine::general_purpose::STANDARD.encode(bytes)
                } else {
                    self.set_info("nothing to copy");
                    return Ok(());
                }
            }
        };

        match self.clipboard.set_text(&text) {
            Ok(()) => self.set_ok("copied"),
            Err(e) => self.set_err(format!("copy failed: {e}")),
        }
        Ok(())
    }

    fn on_paste(&mut self) -> Result<()> {
        let Ok(text) = self.clipboard.get_text() else {
            self.set_info("paste unavailable");
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
            _ => self.set_info("paste into a text field"),
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

                self.split_secret_text = TextArea::default();
                self.split_secret_text.set_placeholder_text(
                    "Using secret file input. Type here to switch back to text input.",
                );

                self.set_ok("loaded secret file");
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
                self.set_ok("loaded share files");
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

                self.set_ok(format!("saved {n} share files"));
            }
            ModalKind::SaveSecretFile => {
                let Some(bytes) = self.combine_recovered.as_ref() else {
                    self.set_info("nothing to save");
                    return Ok(());
                };

                let path = PathBuf::from(text);
                fs::write(&path, bytes).with_context(|| format!("write {}", path.display()))?;
                self.set_ok("saved recovered secret");
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
            self.set_info("secret is empty");
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
                self.set_ok("split ok");
            }
            Err(e) => self.set_err(format!("split error: {e}")),
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
                self.set_ok(format!("combined ok ({detected})"));
            }
            Err(e) => {
                self.combine_recovered = None;
                self.combine_recovered_text = None;
                self.combine_used_encoding = None;
                self.set_err(format!("combine error: {e}"));
            }
        }

        Ok(())
    }

    fn next_tab(&mut self) {
        self.tab = match self.tab {
            TabId::Split => TabId::Combine,
            TabId::Combine => TabId::Split,
        };
        self.focus = match self.tab {
            TabId::Split => Focus::SplitSecret,
            TabId::Combine => Focus::CombineShares,
        };
    }

    fn prev_tab(&mut self) {
        self.next_tab();
    }

    fn next_focus(&mut self) {
        self.focus = match (self.tab, self.focus) {
            (TabId::Split, Focus::SplitSecret) => Focus::SplitK,
            (TabId::Split, Focus::SplitK) => Focus::SplitN,
            (TabId::Split, Focus::SplitN) => Focus::SplitEncoding,
            (TabId::Split, Focus::SplitEncoding) => Focus::SplitPassphrase,
            (TabId::Split, Focus::SplitPassphrase) => Focus::SplitShares,
            (TabId::Split, Focus::SplitShares) => Focus::SplitSecret,

            (TabId::Combine, Focus::CombineShares) => Focus::CombineEncoding,
            (TabId::Combine, Focus::CombineEncoding) => Focus::CombinePassphrase,
            (TabId::Combine, Focus::CombinePassphrase) => Focus::CombineShares,

            (TabId::Split, _) => Focus::SplitSecret,
            (TabId::Combine, _) => Focus::CombineShares,
        };
    }

    fn prev_focus(&mut self) {
        self.focus = match (self.tab, self.focus) {
            (TabId::Split, Focus::SplitSecret) => Focus::SplitShares,
            (TabId::Split, Focus::SplitK) => Focus::SplitSecret,
            (TabId::Split, Focus::SplitN) => Focus::SplitK,
            (TabId::Split, Focus::SplitEncoding) => Focus::SplitN,
            (TabId::Split, Focus::SplitPassphrase) => Focus::SplitEncoding,
            (TabId::Split, Focus::SplitShares) => Focus::SplitPassphrase,

            (TabId::Combine, Focus::CombineShares) => Focus::CombinePassphrase,
            (TabId::Combine, Focus::CombineEncoding) => Focus::CombineShares,
            (TabId::Combine, Focus::CombinePassphrase) => Focus::CombineEncoding,

            (TabId::Split, _) => Focus::SplitSecret,
            (TabId::Combine, _) => Focus::CombineShares,
        };
    }

    fn render(&mut self, f: &mut Frame) {
        let area = f.size();

        let outer = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),
                Constraint::Min(0),
                Constraint::Length(2),
            ])
            .split(area);

        self.render_header(f, outer[0]);

        match self.tab {
            TabId::Split => self.render_split(f, outer[1]),
            TabId::Combine => self.render_combine(f, outer[1]),
        }

        self.render_footer(f, outer[2]);

        if self.show_help {
            self.render_help(f, centered_rect(86, 86, area));
        }

        if let Some(modal) = self.modal.as_mut() {
            Self::render_modal(f, centered_rect(78, 45, area), modal, self.theme);
        }
    }

    fn render_header(&self, f: &mut Frame, area: Rect) {
        let titles = ["Split", "Combine"]
            .iter()
            .map(|t| Line::from(*t))
            .collect::<Vec<_>>();

        let idx = match self.tab {
            TabId::Split => 0,
            TabId::Combine => 1,
        };

        let tabs = Tabs::new(titles)
            .select(idx)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(" safeparts ")
                    .border_style(Style::default().fg(self.theme.border)),
            )
            .highlight_style(
                Style::default()
                    .fg(self.theme.accent)
                    .add_modifier(Modifier::BOLD),
            );

        f.render_widget(tabs, area);
    }

    fn render_footer(&self, f: &mut Frame, area: Rect) {
        let shortcuts = match self.tab {
            TabId::Split => {
                "Enter split • Ctrl+L load • Ctrl+S export • Ctrl+C copy • Tab focus • ? help • Ctrl+Q quit"
            }
            TabId::Combine => {
                "Enter combine • Ctrl+L load • Ctrl+S save • Ctrl+C copy • Tab focus • ? help • Ctrl+Q quit"
            }
        };

        let status_line = self.status.as_ref().map(|s| {
            let (label, color) = match s.kind {
                StatusKind::Info => ("info", self.theme.dim),
                StatusKind::Ok => ("ok", self.theme.ok),
                StatusKind::Error => ("error", self.theme.err),
            };

            Line::from(vec![
                Span::styled(format!("[{label}] "), Style::default().fg(color)),
                Span::raw(&s.msg),
            ])
        });

        let mut text = Text::default();
        if let Some(line) = status_line {
            text.lines.push(line);
        }
        text.lines.push(Line::from(Span::styled(
            shortcuts,
            Style::default().fg(self.theme.dim),
        )));

        let p = Paragraph::new(text)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .border_style(Style::default().fg(self.theme.border)),
            )
            .wrap(Wrap { trim: true });
        f.render_widget(p, area);
    }

    fn render_split(&mut self, f: &mut Frame, area: Rect) {
        let layout = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(52), Constraint::Percentage(48)])
            .split(area);

        let left = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Min(10),
                Constraint::Length(8),
                Constraint::Length(4),
            ])
            .split(layout[0]);

        let secret_title = if let Some(p) = self.split_secret_file.as_ref() {
            let suffix = self
                .split_secret_file_len
                .map(|len| format!(" ({len} bytes)"))
                .unwrap_or_default();
            format!("Secret (file: {}{suffix})", p.display())
        } else {
            "Secret (text)".to_string()
        };

        {
            let block = self.block_for_focus(self.focus == Focus::SplitSecret, secret_title);
            self.split_secret_text.set_block(block);
        }
        f.render_widget(&self.split_secret_text, left[0]);

        f.render_widget(self.split_settings_table(), left[1]);

        let tips = vec![
            Line::from(vec![
                Span::styled("Tip: ", Style::default().fg(self.theme.dim)),
                Span::raw("Tab to focus; ↑/↓ to change numeric/encoding."),
            ]),
            Line::from(vec![
                Span::styled("Copy: ", Style::default().fg(self.theme.dim)),
                Span::raw("Ctrl+C copies selected share; focus elsewhere copies all."),
            ]),
        ];

        let tips = Paragraph::new(tips)
            .block(self.block("Tips"))
            .wrap(Wrap { trim: true });
        f.render_widget(tips, left[2]);

        let right = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),
                Constraint::Min(6),
                Constraint::Min(6),
            ])
            .split(layout[1]);

        let header = Paragraph::new(Line::from(vec![
            Span::styled(
                format!("{} shares", self.split_shares.len()),
                Style::default()
                    .fg(self.theme.accent)
                    .add_modifier(Modifier::BOLD),
            ),
            Span::styled(
                "  •  Ctrl+S exports one file/share",
                Style::default().fg(self.theme.dim),
            ),
        ]))
        .block(self.block("Output"));
        f.render_widget(header, right[0]);

        let items = self
            .split_shares
            .iter()
            .enumerate()
            .map(|(i, s)| ListItem::new(format!("#{:02}  {}", i + 1, preview(s))))
            .collect::<Vec<_>>();

        let list = List::new(items)
            .block(self.block_for_focus(self.focus == Focus::SplitShares, "Share list"))
            .highlight_style(
                Style::default()
                    .fg(self.theme.accent)
                    .add_modifier(Modifier::BOLD),
            )
            .highlight_symbol("▶ ");

        f.render_stateful_widget(list, right[1], &mut list_state(self.split_selected_share));

        let preview_text = self
            .split_shares
            .get(self.split_selected_share)
            .cloned()
            .unwrap_or_default();

        let preview = Paragraph::new(preview_text)
            .block(self.block("Selected share (copy-friendly)"))
            .wrap(Wrap { trim: false });
        f.render_widget(preview, right[2]);
    }

    fn split_settings_table(&self) -> Table {
        let rows = vec![
            settings_row(
                "k",
                format!("{}  (↑/↓)", self.split_k),
                self.focus == Focus::SplitK,
                self.theme,
            ),
            settings_row(
                "n",
                format!("{}  (↑/↓)", self.split_n),
                self.focus == Focus::SplitN,
                self.theme,
            ),
            settings_row(
                "encoding",
                format!("{}  (↑/↓)", self.split_encoding.label()),
                self.focus == Focus::SplitEncoding,
                self.theme,
            ),
            settings_row(
                "passphrase",
                format!(
                    "{}  (Ctrl+U clear)",
                    masked_passphrase(&self.split_passphrase)
                ),
                self.focus == Focus::SplitPassphrase,
                self.theme,
            ),
            Row::new(vec![
                Cell::from(Span::styled("actions", Style::default().fg(self.theme.dim))),
                Cell::from(Span::styled(
                    "Enter split • Ctrl+L load file",
                    Style::default().fg(self.theme.dim),
                )),
            ]),
        ];

        Table::new(rows, [Constraint::Length(12), Constraint::Min(0)])
            .block(self.block("Settings"))
            .column_spacing(1)
    }

    fn render_combine(&mut self, f: &mut Frame, area: Rect) {
        let layout = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(52), Constraint::Percentage(48)])
            .split(area);

        let left = Layout::default()
            .direction(Direction::Vertical)
            .constraints([Constraint::Min(10), Constraint::Length(8)])
            .split(layout[0]);

        {
            let block = self.block_for_focus(self.focus == Focus::CombineShares, "Shares input");
            self.combine_shares_text.set_block(block);
        }
        f.render_widget(&self.combine_shares_text, left[0]);

        f.render_widget(self.combine_settings_table(), left[1]);

        let right = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(5),
                Constraint::Min(6),
                Constraint::Min(6),
            ])
            .split(layout[1]);

        let detected = self.combine_used_encoding.map(|e| e.label()).unwrap_or("-");

        let recovered_len = self
            .combine_recovered
            .as_ref()
            .map(|b| b.len())
            .unwrap_or(0);

        let meta = Paragraph::new(vec![
            Line::from(vec![
                Span::styled("Detected: ", Style::default().fg(self.theme.dim)),
                Span::styled(detected, Style::default().fg(self.theme.accent)),
            ]),
            Line::from(vec![
                Span::styled("Bytes: ", Style::default().fg(self.theme.dim)),
                Span::styled(
                    recovered_len.to_string(),
                    Style::default().fg(self.theme.accent),
                ),
            ]),
            Line::from(Span::styled(
                "Ctrl+C copies UTF-8 else base64",
                Style::default().fg(self.theme.dim),
            )),
        ])
        .block(self.block("Recovered"));
        f.render_widget(meta, right[0]);

        let utf8_text = self.combine_recovered_text.clone().unwrap_or_default();
        let base64_text = self
            .combine_recovered
            .as_ref()
            .map(|b| base64::engine::general_purpose::STANDARD.encode(b))
            .unwrap_or_default();

        let text_view = Paragraph::new(utf8_text)
            .block(self.block("Text view (UTF-8)"))
            .wrap(Wrap { trim: false });
        f.render_widget(text_view, right[1]);

        let base64_view = Paragraph::new(base64_text)
            .block(self.block("Bytes view (base64)"))
            .wrap(Wrap { trim: false });
        f.render_widget(base64_view, right[2]);
    }

    fn combine_settings_table(&self) -> Table {
        let rows = vec![
            settings_row(
                "encoding",
                format!("{}  (↑/↓)", self.combine_encoding.label()),
                self.focus == Focus::CombineEncoding,
                self.theme,
            ),
            settings_row(
                "passphrase",
                format!(
                    "{}  (Ctrl+U clear)",
                    masked_passphrase(&self.combine_passphrase)
                ),
                self.focus == Focus::CombinePassphrase,
                self.theme,
            ),
            Row::new(vec![
                Cell::from(Span::styled("actions", Style::default().fg(self.theme.dim))),
                Cell::from(Span::styled(
                    "Enter combine • Ctrl+L load files • Ctrl+S save",
                    Style::default().fg(self.theme.dim),
                )),
            ]),
        ];

        Table::new(rows, [Constraint::Length(12), Constraint::Min(0)])
            .block(self.block("Settings"))
            .column_spacing(1)
    }

    fn render_help(&self, f: &mut Frame, area: Rect) {
        f.render_widget(Clear, area);

        let block = Block::default()
            .borders(Borders::ALL)
            .title(" Help ")
            .border_style(Style::default().fg(self.theme.border));

        let content = vec![
            Line::from(Span::styled(
                "safeparts-tui",
                Style::default()
                    .fg(self.theme.accent)
                    .add_modifier(Modifier::BOLD),
            )),
            Line::from(""),
            Line::from(Span::styled(
                "Navigation",
                Style::default().add_modifier(Modifier::BOLD),
            )),
            Line::from("  Left/Right: switch Split/Combine"),
            Line::from("  Tab / Shift+Tab: change focus"),
            Line::from(""),
            Line::from(Span::styled(
                "Actions",
                Style::default().add_modifier(Modifier::BOLD),
            )),
            Line::from("  Enter: run split/combine"),
            Line::from("  Ctrl+L: load secret/share file(s)"),
            Line::from("  Ctrl+S: save/export"),
            Line::from("  Ctrl+C: copy (UTF-8 if possible, else base64)"),
            Line::from("  Ctrl+V: paste into focused editor"),
            Line::from("  Ctrl+U: clear passphrase"),
            Line::from("  Ctrl+Q: quit"),
            Line::from(""),
            Line::from(Span::styled(
                "Input formats",
                Style::default().add_modifier(Modifier::BOLD),
            )),
            Line::from("  base64/base58: whitespace-separated shares"),
            Line::from("  mnemonics: one share per paragraph (blank-line separated)"),
        ];

        let p = Paragraph::new(content)
            .block(block)
            .alignment(Alignment::Left)
            .wrap(Wrap { trim: false });
        f.render_widget(p, area);
    }

    fn render_modal(f: &mut Frame, area: Rect, modal: &mut Modal, theme: Theme) {
        f.render_widget(Clear, area);

        let (title, helper) = match modal.kind {
            ModalKind::LoadSecretFile => (
                "Load secret file",
                "Paste a path and press Enter (Esc cancels)",
            ),
            ModalKind::LoadShareFiles => {
                ("Load share files", "One file path per line (Esc cancels)")
            }
            ModalKind::SaveSharesDir => (
                "Export shares",
                "Enter a directory; exports one file per share",
            ),
            ModalKind::SaveSecretFile => ("Save secret", "Enter file path for recovered bytes"),
        };

        let outer = Block::default()
            .borders(Borders::ALL)
            .title(format!(" {title} "))
            .border_style(Style::default().fg(theme.border));

        f.render_widget(outer, area);

        let inner = area.inner(Margin {
            vertical: 1,
            horizontal: 2,
        });

        let parts = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(2),
                Constraint::Min(1),
                Constraint::Length(1),
            ])
            .split(inner);

        let helper = Paragraph::new(Line::from(vec![
            Span::styled("Hint: ", Style::default().fg(theme.dim)),
            Span::raw(helper),
        ]));
        f.render_widget(helper, parts[0]);

        modal.input.set_block(
            Block::default()
                .borders(Borders::ALL)
                .title(" Path ")
                .border_style(Style::default().fg(theme.accent)),
        );
        f.render_widget(&modal.input, parts[1]);

        let footer = Paragraph::new(Line::from(Span::styled(
            "Enter confirm • Esc cancel",
            Style::default().fg(theme.dim),
        )))
        .alignment(Alignment::Center);
        f.render_widget(footer, parts[2]);
    }

    fn block(&self, title: impl Into<String>) -> Block<'static> {
        Block::default()
            .borders(Borders::ALL)
            .title(format!(" {} ", title.into()))
            .border_style(Style::default().fg(self.theme.border))
    }

    fn block_for_focus(&self, active: bool, title: impl Into<String>) -> Block<'static> {
        let mut block = self.block(title);
        if active {
            block = block.border_style(Style::default().fg(self.theme.accent));
        }
        block
    }
}

fn settings_row(label: &'static str, value: String, active: bool, theme: Theme) -> Row<'static> {
    let value_style = if active {
        Style::default()
            .fg(theme.accent)
            .add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(theme.accent)
    };

    Row::new(vec![
        Cell::from(Span::styled(
            label,
            Style::default().add_modifier(Modifier::BOLD),
        )),
        Cell::from(Span::styled(value, value_style)),
    ])
}

fn masked_passphrase(p: &str) -> String {
    if p.is_empty() {
        "(none)".to_string()
    } else {
        let len = p.chars().count();
        let shown = len.min(12);
        format!("{} (len={len})", "•".repeat(shown))
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
