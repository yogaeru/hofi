import { $ } from "bun";
import { logger } from "#/utils/logger";
import { spawnInteractive } from "#/utils/spawn";

/**
 * Reads explicitly installed native pacman packages.
 *
 * @returns A sorted list of package names.
 */
export async function getPacmanPackages(): Promise<string[]> {
  const packageList = await $`pacman -Qqen`.quiet().text();

  return packageList.split("\n").filter(Boolean).sort();
}

/**
 * Dry-run install to detect conflicts before committing.
 * Returns true if there are no conflicts.
 */
export async function dryRunPacman(packages: Set<string>): Promise<boolean> {
  if (packages.size === 0) return true;
  
  const packagesToInstall: string[] = [...packages];

  try {
    await $`pacman -S --needed --noconfirm --print ${packagesToInstall}`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Installs missing pacman packages in a single batch.
 *
 * @param packages Package names to install.
 */
export async function installPacmanPackages(
  packages: Set<string>,
): Promise<void> {
  if (packages.size === 0) return;

  const ok = await dryRunPacman(packages);
  if (!ok) {
    logger.warn(
      "Dry-run detected conflicts. Proceeding anyway — check output carefully.",
    );
  }

  await spawnInteractive(
    ["sudo", "pacman", "-S", "--needed", ...packages],
    "Install pacman packages failed",
  );
}

/**
 * Removes pacman packages in a single batch.
 *
 * @param packages Package names to remove.
 */
export async function removePacmanPackages(
  packages: Set<string>,
): Promise<void> {
  if (packages.size === 0) return;

  await spawnInteractive(
    ["sudo", "pacman", "-R", "--noconfirm", ...packages],
    "Remove pacman packages failed",
  );
}
