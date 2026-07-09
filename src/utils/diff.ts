import { isDeepStrictEqual } from "node:util";
import { getAurPackages } from "#/backend/aur";
import { getPacmanPackages } from "#/backend/pacman";
import {
  getUserFlatpakPackages,
  getSystemFlatpakPackages,
} from "#/backend/flatpak";
import type {
  Config,
  Symlink,
  MountDrive,
  Defaults,
} from "#/core/config/schema";

// ── Types ──

export type DiffPkgsResult = {
  added: string[];
  removed: string[];
};

type RecordDiff<T> = {
  added: Record<string, T>;
  removed: Record<string, T>;
};

export type PackagesDiff = {
  pacman?: DiffPkgsResult;
  aur?: DiffPkgsResult;
  flatpak?: {
    added: Record<string, string[]>;
    removed: Record<string, string[]>;
  };
};

export type ConfigDiff = {
  packages?: PackagesDiff;
  mounts?: RecordDiff<MountDrive[string]>;
  symlinks?: RecordDiff<Symlink[string]>;
  defaults?: Defaults;
};

// ── Core diff functions ──

/**
 * Compares two sets of package names and returns which were added and which were removed.
 *
 * @param oldPackages - Previously installed or configured packages.
 * @param newPackages - Desired packages to compare against.
 * @returns An object with `added` and `removed` string arrays.
 */
export function diffPkgs(
  oldPackages: Set<string>,
  newPackages: Set<string>,
): DiffPkgsResult {
  const added = [...newPackages].filter((pkg) => !oldPackages.has(pkg));
  const removed = [...oldPackages].filter((pkg) => !newPackages.has(pkg));

  return {
    added,
    removed,
  };
}
/**
 * Compares two string-keyed records and returns which keys were added, removed, or changed.
 *
 * @example
 * ```ts
 * diffRecord({ a: 1 }, { a: 2, b: 3 })
 * // → { added: { b: 3 }, removed: { a: 1 } }
 * ```
 *
 * @param oldRecord - The previous record (defaults to `{}`).
 * @param newRecord - The new record (defaults to `{}`).
 * @returns A `RecordDiff` with `added` and `removed` sub-records.
 */
export function diffRecord<T>(
  oldRecord: Record<string, T> = {},
  newRecord: Record<string, T> = {},
): RecordDiff<T> {
  const added: Record<string, T> = {};
  const removed: Record<string, T> = {};

  const keys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]);

  for (const key of keys) {
    const oldValue = oldRecord[key];
    const newValue = newRecord[key];

    if (!(key in oldRecord)) {
      added[key] = newValue!;
      continue;
    }

    if (!(key in newRecord)) {
      removed[key] = oldValue!;
      continue;
    }

    if (!isDeepStrictEqual(oldValue, newValue)) {
      removed[key] = oldValue!;
      added[key] = newValue!;
    }
  }

  return { added, removed };
}

// ── Config-level diff ──

/**
 * Diffs two optional package lists.
 * Returns `undefined` when both are `undefined` (absent from both configs),
 * otherwise computes and returns the set diff.
 */
function diffPkgListIfChanged(
  oldList: any[] | undefined,
  newList: any[] | undefined,
): DiffPkgsResult | undefined {
  if (oldList === undefined && newList === undefined) return undefined;
  const diff = diffPkgs(new Set(oldList ?? []), new Set(newList ?? []));
  if (diff.added.length === 0 && diff.removed.length === 0) return undefined;
  return diff;
}

/**
 * Diffs a `Record<string, T>` section and returns `undefined` when there are
 * no actual additions or removals (or when both sides are absent).
 */
function diffRecordIfChanged<T>(
  oldRecord: Record<string, T> | undefined,
  newRecord: Record<string, T> | undefined,
): RecordDiff<T> | undefined {
  if (!oldRecord && !newRecord) return undefined;
  const diff = diffRecord(oldRecord, newRecord);
  if (
    Object.keys(diff.added).length === 0 &&
    Object.keys(diff.removed).length === 0
  ) {
    return undefined;
  }
  return diff;
}

/**
 * Compares a previously applied config (from metadata) against a new target
 * config and returns only the sections and keys that changed.
 *
 * Sections with no differences are omitted from the result.
 *
 * @param newConfig - The target config to compare against.
 * @param oldConfig - The previously applied config (from metadata).
 * @returns A `ConfigDiff` with only the changed sections.
 */
export async function diffConfigWithMetadata(
  newConfig: Config,
  oldConfig: Config,
): Promise<ConfigDiff> {
  const res: ConfigDiff = {};

  // ── Packages ──
  if (oldConfig.packages || newConfig.packages) {
    const packages: PackagesDiff = {};

    const pacman = diffPkgListIfChanged(
      oldConfig.packages?.pacman,
      newConfig.packages?.pacman,
    );
    if (pacman) packages.pacman = pacman;

    const aur = diffPkgListIfChanged(
      oldConfig.packages?.aur,
      newConfig.packages?.aur,
    );
    if (aur) packages.aur = aur;

    const flatpakUser = diffPkgListIfChanged(
      oldConfig.packages?.flatpak?.user,
      newConfig.packages?.flatpak?.user,
    );
    const flatpakSystem = diffPkgListIfChanged(
      oldConfig.packages?.flatpak?.system,
      newConfig.packages?.flatpak?.system,
    );

    if (flatpakUser || flatpakSystem) {
      const added: Record<string, string[]> = {};
      const removed: Record<string, string[]> = {};
      if (flatpakUser?.added.length) added.user = flatpakUser.added;
      if (flatpakUser?.removed.length) removed.user = flatpakUser.removed;
      if (flatpakSystem?.added.length) added.system = flatpakSystem.added;
      if (flatpakSystem?.removed.length) removed.system = flatpakSystem.removed;

      if (Object.keys(added).length > 0 || Object.keys(removed).length > 0) {
        packages.flatpak = { added, removed };
      }
    }

    if (Object.keys(packages).length > 0) {
      res.packages = packages;
    }
  }

  // ── Mounts ──
  const mounts: ConfigDiff["mounts"] = diffRecordIfChanged(
    oldConfig.mounts,
    newConfig.mounts,
  );
  if (mounts) res.mounts = mounts;

  // ── Symlinks ──
  const symlinks: ConfigDiff["symlinks"] = diffRecordIfChanged(
    oldConfig.symlinks,
    newConfig.symlinks,
  );
  if (symlinks) res.symlinks = symlinks;

  // ── Defaults ──
  if (
    newConfig.defaults &&
    !isDeepStrictEqual(oldConfig.defaults, newConfig.defaults)
  ) {
    res.defaults = newConfig.defaults;
  }

  return res;
}

// ── System-installed diffs ──

/**
 * Compares the configuration's pacman packages against what is currently
 * installed on the system.
 *
 */
export async function diffInstalledPacmanPackages(
  newPackages: Set<string>,
): Promise<DiffPkgsResult> {
  const oldPacmanPackages: Set<string> = new Set(await getPacmanPackages());
  return diffPkgs(oldPacmanPackages, newPackages);
}

/**
 * Compares the configuration's AUR packages against what is currently
 * installed via `paru`.
 *
 */
export async function diffInstalledAurPackages(
  newPackages: Set<string>,
): Promise<DiffPkgsResult> {
  const oldAurPackages: Set<string> = new Set(await getAurPackages());
  return diffPkgs(oldAurPackages, newPackages);
}

/**
 * Compares the configuration's user-scope Flatpak packages against what is
 * currently installed.
 *
 */
export async function diffInstalledFlatpakUserPackages(
  newPackages: Set<string>,
): Promise<DiffPkgsResult> {
  const oldFlatpakPackages: Set<string> = new Set(
    await getUserFlatpakPackages(),
  );
  return diffPkgs(oldFlatpakPackages, newPackages);
}

/**
 * Compares the configuration's system-scope Flatpak packages against what is
 * currently installed.
 */
export async function diffInstalledFlatpakSystemPackages(
  newPackages: Set<string>,
): Promise<DiffPkgsResult> {
  const oldFlatpakPackages: Set<string> = new Set(
    await getSystemFlatpakPackages(),
  );
  return diffPkgs(oldFlatpakPackages, newPackages);
}