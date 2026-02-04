use std::io;

use anyhow::{Context, Result};
use crossterm::execute;
use crossterm::terminal::{EnterAlternateScreen, LeaveAlternateScreen};
use ratatui::backend::CrosstermBackend;
use ratatui::Terminal;

mod app;
mod clipboard;
mod domain;

fn main() -> Result<()> {
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen).context("enter alternate screen")?;
    crossterm::terminal::enable_raw_mode().context("enable raw mode")?;

    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend).context("init terminal")?;

    let res = app::App::new().run(&mut terminal);

    crossterm::terminal::disable_raw_mode().ok();
    execute!(terminal.backend_mut(), LeaveAlternateScreen).ok();
    terminal.show_cursor().ok();

    res
}
