import { $ } from "bun";
import { logger } from "../lib/logger";

export async function getPacmanPackages(): Promise<string[]> {
  const packageList = await $`pacman -Qqen`.quiet().text();

  return packageList.split("\n").filter(Boolean).sort();
}

/**
 * Dry-run install to detect conflicts before committing.
 * Returns true if there are no conflicts.
 */
export async function dryRunPacman(packages: string[]): Promise<boolean> {
  if (packages.length === 0) return true;
  try {
    await $`pacman -S --needed --noconfirm --print-only ${packages}`.quiet();
    return true;
  } catch {
    return false;
  }
}

/** Install missing pacman packages in a single batch. */
export async function installPacmanPackages(packages: string[]): Promise<void> {
  if (packages.length === 0) return;

  logger.info(
    `Installing ${packages.length} pacman package(s): ${packages.join(", ")}`,
  );

  const ok = await dryRunPacman(packages);
  if (!ok) {
    logger.warn(
      "Dry-run detected conflicts. Proceeding anyway — check output carefully.",
    );
  }

  await $`sudo pacman -S --needed ${packages}`;
}
