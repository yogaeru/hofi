import { $ } from "bun";
import { logger } from "#/utils/logger";
import { spawnInteractive } from "#/utils/spawn";

/**
 * Gets the list of AUR packages installed on the system.
 * @returns
 */
export async function getAurPackages() {
  const result = await $`pacman -Qqm`.quiet().text();
  return result.split("\n").filter(Boolean).sort();
}

export async function dryRunAurPackages(packages: Set<string>) {
  logger.info(
    `Dry run: would install AUR packages:\n${[...packages].join("\n   - ")}`,
  );
}

/**
 * Install AUR packages on the system.
 * @param packages
 * @param options
 * @returns
 */
export async function installAurPackages(packages: Set<string>) {
  if (packages.size === 0) return;

  await spawnInteractive(
    ["paru", "-S", "--noconfirm", "--needed", ...packages],
    "Install AUR packages failed",
  );
}

/**
 * Remove AUR packages from the system.
 * @param packages
 * @returns
 */
export async function removeAurPackages(packages: string[]) {
  if (packages.length === 0) return;

  await spawnInteractive(
    ["paru", "-R", "--noconfirm", ...packages],
    "Remove AUR packages failed",
  );
}
