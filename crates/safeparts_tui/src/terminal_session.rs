use std::io;

use anyhow::{Context, Result};
use crossterm::cursor::Show;
use crossterm::execute;
use crossterm::terminal::{EnterAlternateScreen, LeaveAlternateScreen};

pub(crate) trait TerminalOps {
    fn enter_alternate_screen(&mut self) -> Result<()>;
    fn enable_raw_mode(&mut self) -> Result<()>;
    fn disable_raw_mode(&mut self) -> Result<()>;
    fn leave_alternate_screen(&mut self) -> Result<()>;
    fn show_cursor(&mut self) -> Result<()>;
}

pub(crate) struct TerminalSession<Ops: TerminalOps> {
    ops: Ops,
    alternate_screen: bool,
    raw_mode: bool,
}

impl<Ops: TerminalOps> TerminalSession<Ops> {
    fn enter_with(ops: Ops) -> Result<Self> {
        let mut session = Self {
            ops,
            alternate_screen: false,
            raw_mode: false,
        };

        session.ops.enter_alternate_screen()?;
        session.alternate_screen = true;
        session.ops.enable_raw_mode()?;
        session.raw_mode = true;

        Ok(session)
    }
}

impl<Ops: TerminalOps> Drop for TerminalSession<Ops> {
    fn drop(&mut self) {
        if self.raw_mode {
            let _ = self.ops.disable_raw_mode();
            self.raw_mode = false;
        }
        if self.alternate_screen {
            let _ = self.ops.leave_alternate_screen();
            let _ = self.ops.show_cursor();
            self.alternate_screen = false;
        }
    }
}

pub(crate) struct RealTerminalOps;

impl TerminalSession<RealTerminalOps> {
    pub fn enter() -> Result<Self> {
        Self::enter_with(RealTerminalOps)
    }
}

impl TerminalOps for RealTerminalOps {
    fn enter_alternate_screen(&mut self) -> Result<()> {
        execute!(io::stdout(), EnterAlternateScreen).context("enter alternate screen")
    }

    fn enable_raw_mode(&mut self) -> Result<()> {
        crossterm::terminal::enable_raw_mode().context("enable raw mode")
    }

    fn disable_raw_mode(&mut self) -> Result<()> {
        crossterm::terminal::disable_raw_mode().context("disable raw mode")
    }

    fn leave_alternate_screen(&mut self) -> Result<()> {
        execute!(io::stdout(), LeaveAlternateScreen).context("leave alternate screen")
    }

    fn show_cursor(&mut self) -> Result<()> {
        execute!(io::stdout(), Show).context("show cursor")
    }
}

#[cfg(test)]
mod tests {
    use std::cell::RefCell;
    use std::rc::Rc;

    use anyhow::bail;

    use super::*;

    #[derive(Clone)]
    struct MockTerminalOps {
        events: Rc<RefCell<Vec<&'static str>>>,
        fail_on: Option<&'static str>,
    }

    impl MockTerminalOps {
        fn record(&self, event: &'static str) -> Result<()> {
            self.events.borrow_mut().push(event);
            if self.fail_on == Some(event) {
                bail!("synthetic {event} failure");
            }
            Ok(())
        }
    }

    impl TerminalOps for MockTerminalOps {
        fn enter_alternate_screen(&mut self) -> Result<()> {
            self.record("enter")
        }

        fn enable_raw_mode(&mut self) -> Result<()> {
            self.record("enable_raw")
        }

        fn disable_raw_mode(&mut self) -> Result<()> {
            self.record("disable_raw")
        }

        fn leave_alternate_screen(&mut self) -> Result<()> {
            self.record("leave")
        }

        fn show_cursor(&mut self) -> Result<()> {
            self.record("show_cursor")
        }
    }

    fn mock(fail_on: Option<&'static str>) -> (MockTerminalOps, Rc<RefCell<Vec<&'static str>>>) {
        let events = Rc::new(RefCell::new(Vec::new()));
        (
            MockTerminalOps {
                events: Rc::clone(&events),
                fail_on,
            },
            events,
        )
    }

    #[test]
    fn normal_drop_restores_terminal_state() {
        let (ops, events) = mock(None);
        let session = TerminalSession::enter_with(ops).unwrap();
        drop(session);

        assert_eq!(
            *events.borrow(),
            ["enter", "enable_raw", "disable_raw", "leave", "show_cursor"]
        );
    }

    #[test]
    fn partial_setup_failure_restores_completed_steps() {
        let (ops, events) = mock(Some("enable_raw"));
        assert!(TerminalSession::enter_with(ops).is_err());

        assert_eq!(
            *events.borrow(),
            ["enter", "enable_raw", "leave", "show_cursor"]
        );
    }

    #[test]
    fn first_setup_failure_does_not_run_unneeded_cleanup() {
        let (ops, events) = mock(Some("enter"));
        assert!(TerminalSession::enter_with(ops).is_err());

        assert_eq!(*events.borrow(), ["enter"]);
    }

    #[test]
    fn cleanup_continues_after_an_individual_restore_failure() {
        let (ops, events) = mock(Some("disable_raw"));
        let session = TerminalSession::enter_with(ops).unwrap();
        drop(session);

        assert_eq!(
            *events.borrow(),
            ["enter", "enable_raw", "disable_raw", "leave", "show_cursor"]
        );
    }

    #[test]
    fn panic_unwinding_restores_terminal_state() {
        let (ops, events) = mock(None);
        let _ = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            let _session = TerminalSession::enter_with(ops).unwrap();
            panic!("synthetic runtime panic");
        }));

        assert_eq!(
            *events.borrow(),
            ["enter", "enable_raw", "disable_raw", "leave", "show_cursor"]
        );
    }
}
