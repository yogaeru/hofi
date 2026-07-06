import chalk from "chalk";
import type { ConfigDiff, DiffPkgsResult } from "#/utils/diff";

// ── Row types ──
const ADDED = chalk.green("Added");
const REMOVED = chalk.red("Removed");

type PackageRow = {
  Manager: string;
  Package: string;
  Status: string;
};

type MountRow = {
  Mount: string;
  Type: string;
  UUID: string;
  Status: string;
};

type SymlinkRow = {
  Name: string;
  Link: string;
  Target: string;
  Status: string;
};

type DefaultRow = {
  Section: string;
  Key: string;
  Value: string;
};

// ── Helpers ──
function addPkgRows(
  rows: PackageRow[],
  manager: string,
  diff: DiffPkgsResult,
): void {
  for (const pkg of diff.added) {
    rows.push({ Manager: manager, Package: pkg, Status: ADDED });
  }
  for (const pkg of diff.removed) {
    rows.push({ Manager: manager, Package: pkg, Status: REMOVED });
  }
}

function addFlatpakRows(
  rows: PackageRow[],
  diff: NonNullable<ConfigDiff["packages"]>["flatpak"],
): void {
  if (!diff) return;
  for (const [scope, pkgs] of Object.entries(diff.added)) {
    for (const pkg of pkgs) {
      rows.push({ Manager: `flatpak:${scope}`, Package: pkg, Status: ADDED });
    }
  }
  for (const [scope, pkgs] of Object.entries(diff.removed)) {
    for (const pkg of pkgs) {
      rows.push({
        Manager: `flatpak:${scope}`,
        Package: pkg,
        Status: REMOVED,
      });
    }
  }
}

function addRecordRows<T extends Record<string, string>>(
  rows: { Key: string; Value: string; Section: string }[],
  section: string,
  record: Record<string, string> | undefined,
): void {
  for (const [key, value] of Object.entries(record ?? {})) {
    rows.push({ Section: section, Key: key, Value: value });
  }
}

// ── Flatten functions ──

function flattenPackages(
  packages: NonNullable<ConfigDiff["packages"]>,
): PackageRow[] {
  const rows: PackageRow[] = [];
  if (packages.pacman) addPkgRows(rows, "pacman", packages.pacman);
  if (packages.aur) addPkgRows(rows, "aur", packages.aur);
  addFlatpakRows(rows, packages.flatpak);
  return rows;
}

function flattenMounts(mounts: NonNullable<ConfigDiff["mounts"]>): MountRow[] {
  const rows: MountRow[] = [];

  for (const [mount, config] of Object.entries(mounts.added)) {
    rows.push({
      Mount: mount,
      Type: config?.type ?? "-",
      UUID: config?.uuid ?? "-",
      Status: ADDED,
    });
  }
  for (const [mount, config] of Object.entries(mounts.removed)) {
    rows.push({
      Mount: mount,
      Type: config?.type ?? "-",
      UUID: config?.uuid ?? "-",
      Status: REMOVED,
    });
  }

  return rows;
}

function flattenSymlinks(
  symlinks: NonNullable<ConfigDiff["symlinks"]>,
): SymlinkRow[] {
  const rows: SymlinkRow[] = [];

  for (const [name, config] of Object.entries(symlinks.added)) {
    rows.push({
      Name: name,
      Link: config?.link ?? "-",
      Target: config?.target ?? "-",
      Status: ADDED,
    });
  }
  for (const [name, config] of Object.entries(symlinks.removed)) {
    rows.push({
      Name: name,
      Link: config?.link ?? "-",
      Target: config?.target ?? "-",
      Status: REMOVED,
    });
  }

  return rows;
}

function flattenDefaults(
  defaults: NonNullable<ConfigDiff["defaults"]>,
): DefaultRow[] {
  const rows: DefaultRow[] = [];

  addRecordRows(
    rows,
    "apps",
    defaults.apps as Record<string, string> | undefined,
  );

  for (const [group, mappings] of Object.entries(defaults.mime ?? {})) {
    addRecordRows(
      rows,
      `mime.${group}`,
      mappings as Record<string, string> | undefined,
    );
  }

  return rows;
}

// ── Main entry ──

/**
 * Prints a formatted table for each changed section of a `ConfigDiff`.
 * Sections with no changes are skipped entirely.
 */
export function printDiffTable(diff: ConfigDiff): void {
  if (diff.packages) {
    const rows = flattenPackages(diff.packages);
    if (rows.length > 0) {
      console.log("\n📦 Packages");
      console.table(rows);
    }
  }

  if (diff.mounts) {
    const rows = flattenMounts(diff.mounts);
    if (rows.length > 0) {
      console.log("\n💽 Mounts");
      console.table(rows);
    }
  }

  if (diff.symlinks) {
    const rows = flattenSymlinks(diff.symlinks);
    if (rows.length > 0) {
      console.log("\n🔗 Symlinks");
      console.table(rows);
    }
  }

  if (diff.defaults) {
    const rows = flattenDefaults(diff.defaults);
    if (rows.length > 0) {
      console.log("\n⚙️ Defaults");
      console.table(rows);
    }
  }
}
