use std::io;

use anyhow::{Context, Result};
use ratatui::Terminal;
use ratatui::backend::CrosstermBackend;

mod app;
mod clipboard;
mod domain;
mod private_file;
mod terminal_session;

fn main() -> Result<()> {
    let _session = terminal_session::TerminalSession::enter()?;
    let backend = CrosstermBackend::new(io::stdout());
    let mut terminal = Terminal::new(backend).context("init terminal")?;

    app::App::new().run(&mut terminal)
}
