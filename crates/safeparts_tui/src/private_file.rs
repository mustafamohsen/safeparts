use std::fs;
use std::io::Write;
use std::path::Path;

use anyhow::{Context, Result};
use tempfile::NamedTempFile;

pub fn write(path: &Path, bytes: &[u8]) -> Result<()> {
    let parent = path
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));
    let mut temporary = NamedTempFile::new_in(parent)
        .with_context(|| format!("create temporary output in {}", parent.display()))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(temporary.path(), fs::Permissions::from_mode(0o600))
            .context("set private output permissions")?;
    }

    temporary
        .write_all(bytes)
        .with_context(|| format!("write temporary output for {}", path.display()))?;
    temporary
        .as_file_mut()
        .sync_all()
        .with_context(|| format!("sync temporary output for {}", path.display()))?;
    temporary
        .persist(path)
        .map_err(|error| error.error)
        .with_context(|| format!("replace output {}", path.display()))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn failed_replace_removes_temporary_output() {
        let parent = tempfile::tempdir().unwrap();
        let destination = parent.path().join("existing-directory");
        fs::create_dir(&destination).unwrap();

        assert!(write(&destination, b"synthetic sensitive output").is_err());
        assert_eq!(fs::read_dir(parent.path()).unwrap().count(), 1);
    }
}
