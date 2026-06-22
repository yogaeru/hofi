import { $ } from "bun"; import { logger } from "#/utils/logger"; import { spawnInteractive } from "#/utils/spawn"; /**
 * Gets the list of user-installed Flatpak applications.
 *
 * @returns A sorted list of application IDs.
 */
export async function getUserFlatpakPackages(): Promise<string[]> {
  const result = await $`flatpak list --user --app --columns=application`
    .quiet()
    .text();
  return result.split("\n").filter(Boolean).sort();
}

/**
 * Gets the list of system-installed Flatpak applications.
 *
 * @returns A sorted list of application IDs.
 */
export async function getSystemFlatpakPackages(): Promise<string[]> {
  const result = await $`flatpak list --system --app --columns=application`
    .quiet()
    .text();
  return result.split("\n").filter(Boolean).sort();
}

/**
 * Print packages would be installed.
 *
 * @param packages Application IDs to install.
 */
export async function dryRunFlatpakPakcages(packages: string[]): Promise<void> {
  if (packages.length === 0) return;

  logger.info(
    `Dry run: Would install flatpak packages:\n${packages.join("\n -- ")}`,
  );
}

/**
 * Installs Flatpak packages for the current user.
 *
 * @param packages Application IDs to install.
 */
export async function installUserFlatpakPackages(
  packages: string[],
): Promise<void> {
  if (packages.length === 0) return;
  await spawnInteractive(
    ["flatpak", "install", "--user", "-y", "flathub", ...packages],
    "Install user Flatpak packages failed",
  );
}

/**
 * Installs Flatpak packages system-wide.
 *
 * @param packages Application IDs to install.
 */
export async function installSystemFlatpakPackages(
  packages: string[],
): Promise<void> {
  if (packages.length === 0) return;
  await spawnInteractive(
    ["sudo", "flatpak", "install", "--system", "-y", "flathub", ...packages],
    "Install system Flatpak packages failed",
  );
}

/**
 * Removes user-installed Flatpak packages.
 *
 * @param packages Application IDs to remove.
 */
export async function removeUserFlatpakPackages(
  packages: string[],
): Promise<void> {
  if (packages.length === 0) return;
  await spawnInteractive(
    ["flatpak", "uninstall", "--user", "-y", ...packages],
    "Remove user Flatpak packages failed",
  );
}

/**
 * Removes system-installed Flatpak packages.
 *
 * @param packages Application IDs to remove.
 */
export async function removeSystemFlatpakPackages(
  packages: string[],
): Promise<void> {
  if (packages.length === 0) return;
  await spawnInteractive(
    ["sudo", "flatpak", "uninstall", "--system", "-y", ...packages],
    "Remove system Flatpak packages failed",
  );
}
