# hofi

A declarative system configuration tool for Arch Linux. Define your packages, symlinks, mount drives, and default apps in TOML files — then apply them all with a single `switch` command.

## Features

- **Package management** — install/update pacman, AUR (paru), and Flatpak packages declaratively
- **Symlinks** — create and manage symlinks between dotfiles, scripts, and config directories
- **MIME defaults** — set default applications and file-type associations system-wide
- **Mount drives** — configure systemd mount units with UUID, filesystem type, and options
- **Config includes** — chain multiple TOML config files together
- **Dry-run mode** — preview changes before applying anything
- **Validation** — Zod schema validation + runtime checks (symlink targets, mount UUIDs, package existence)

## Prerequisites

- [Bun](https://bun.sh) runtime
- Arch Linux (pacman-based)
- [paru](https://github.com/Morganamilo/paru) (optional, for AUR packages)
- [Flatpak](https://flatpak.org) (optional, for Flatpak packages)

## Install & Build

```sh
bun install                       # install dependencies
bun run build                     # bundle → dist/hofi.js
bun run compile                   # compile → ./bin/hofi (standalone binary)
```

## Quick Start

```sh
# Scaffold a new config from your current system state
bun run index.ts init

# Validate the generated config
bun run index.ts validate

# Preview what would change
bun run index.ts switch --dry-run

# Apply the configuration
bun run index.ts switch
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `scan` | Detect and print system environment (OS, init, pkg managers, AUR helper, sudo status) |
| `init` | Scaffold `hofi/config.toml` + `hofi/mimeapps.toml` by scanning current system packages and MIME associations |
| `validate [dir]` | Parse and validate the TOML config at the given directory (defaults to cwd) |
| `switch [dir]` | Diff config against current state, prompt to apply changes (packages, symlinks, mounts, defaults) |
| `switch [dir] --dry-run` | Same as switch, but only shows the diff table without applying |

Run with `--help` for usage details:

```sh
bun run index.ts --help
```

## Configuration Format

Config is TOML (`config.toml`). All sections are optional.

```toml
# ── User ──
[user]
name = "user"
homeDir = "/home/user"

# ── Packages ──
[packages]
pacman = ["base", "base-devel", "neovim", "git"]
aur = ["yay"]

[packages.flatpak]
user = ["com.discordapp.Discord"]
system = ["org.gimp.GIMP"]

# ── Default Applications ──
[defaults.apps]
browser = "firefox.desktop"
editor = "nvim.desktop"
video = "vlc.desktop"
image = "gimp.desktop"
audio = "spotify.desktop"

# ── MIME Associations ──
[defaults.mime.defaultApplications]
"text/html" = "firefox.desktop"

[defaults.mime.addedAssociations]
"image/png" = "gimp.desktop"

# ── Mount Drives (systemd units) ──
[mounts./mnt/data]
description = "Data drive"
uuid = "1234-5678-ABCD"
type = "ext4"
options = ["defaults", "noatime"]
wantedBy = "local-fs.target"

# ── Includes (chain other TOML files) ──
includes = ["./mimeapps.toml"]

# ── Symlinks ──
[symlink.dotfiles]
target = "/home/user/dotfiles/nvim"
link = "/home/user/.config/nvim"

[symlink.scripts]
target = "/home/user/scripts"
link = "/home/user/.local/bin"
```

### Config Sections

| Section | Description |
|---------|-------------|
| `[user]` | User name and home directory |
| `[packages]` | Lists of pacman, AUR, and Flatpak packages to install |
| `[defaults.apps]` | Default application desktop entries for common categories |
| `[defaults.mime]` | MIME type associations (`defaultApplications` and `addedAssociations`) |
| `[mounts.<point>]` | Systemd mount unit definitions (UUID, filesystem type, options) |
| `includes` | Array of paths to additional TOML config files (deep-merged, arrays overwritten) |
| `[symlink.<name>]` | Symlink entries — each has a `target` (source) and `link` (destination) |

## How `switch` Works

1. **Parse** — reads and Zod-validates the TOML config
2. **Diff** — compares config against a `hofi-lock.json` metadata file (previous state)
3. **Preview** — prints a diff table of what changed
4. **Confirm** — prompts for confirmation (`y`/`n`)
5. **Apply** — installs/removes packages, creates symlinks, writes systemd mount units, and updates MIME defaults
6. **Save** — writes new metadata to `hofi-lock.json`

## Project Structure

```
├── index.ts                    # CLI entrypoint (cac)
├── src/
│   ├── commands/
│   │   ├── scan.ts             # System environment detection
│   │   ├── init.ts             # Project scaffolding
│   │   ├── validate.ts         # Config validation
│   │   └── switch/
│   │       ├── index.ts        # Switch orchestrator
│   │       ├── packages.ts     # Package install/remove
│   │       ├── links.ts        # Symlink management
│   │       ├── mountDrive.ts   # systemd mount units
│   │       └── defaults.ts     # MIME / default apps
│   ├── backend/
│   │   ├── pacman.ts           # Pacman backend
│   │   ├── aur.ts              # AUR (paru) backend
│   │   └── flatpak.ts          # Flatpak backend
│   ├── core/
│   │   └── config/
│   │       ├── schema.ts       # Zod config schema
│   │       ├── parser.ts       # TOML parsing
│   │       └── template.ts     # Config templates
│   └── utils/
│       ├── logger.ts           # chalk + ora + boxen logger
│       ├── spawn.ts            # Bun.spawn wrapper
│       ├── diff.ts             # Config diff logic
│       ├── validation.ts       # Runtime validation helpers
│       └── write.ts            # File writing utilities
└── tests/                      # Unit tests (bun test)
```

## Development

```sh
bun install                     # install deps
bun run index.ts --help         # show CLI help
bun run index.ts scan           # detect system environment
bun run index.ts init           # scaffold hofi/config.toml + hofi/mimeapps.toml
bun run index.ts validate       # validate TOML config in cwd
bun run index.ts switch <dir> --dry-run   # preview changes
bun run index.ts switch <dir>   # apply config to system
bun test                        # run unit tests (65+ tests)
```

## License

MIT
