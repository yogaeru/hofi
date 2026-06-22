import { getPacmanPackages } from "#/backend/pacman";
import { getAurPackages } from "#/backend/aur";
import {
  getUserFlatpakPackages,
  getSystemFlatpakPackages,
} from "#/backend/flatpak";
import { logger } from "./logger";

export type DiffResult = {
  added: string[];
  removed: string[];
};

/**
 * Compares two set of packages
 * @returns Object contain added and removed packages
 */
export function diffPkgs(
  oldPackages: Set<string>,
  newPackages: Set<string>,
): DiffResult {
  const added = [...newPackages].filter((pkg) => !oldPackages.has(pkg));
  const removed = [...oldPackages].filter((pkg) => !newPackages.has(pkg));

  return {
    added,
    removed,
  };
}

/**
 * Prints the diff result to the console.
 */
export function printDiffResult(result: DiffResult, scope: string = "pkg") {
  const { added: addedPackages, removed: removedPackages } = result;
  if (addedPackages.length === 0 && removedPackages.length === 0) {
    logger.info(`No changes ${scope}`);
    return;
  }
  if (addedPackages.length > 0) {
    addedPackages.forEach((pkg) =>
      logger.custom(`${pkg}`, {
        label: "A.",
        color: "green",
        timestamp: false,
        scope,
      }),
    );
  }
  if (removedPackages.length > 0) {
    removedPackages.forEach((pkg) =>
      logger.custom(`${pkg}`, {
        label: "R.",
        color: "red",
        timestamp: false,
        scope,
      }),
    );
  }
  console.log();
}

/**
 * Compares the installed pacman packages with the new packages and returns the added and removed packages.
 * @returns A promise that resolves added and removed packages.
 */
export async function diffInstalledPacmanPackages(
  newPackages: Set<string>,
): Promise<DiffResult> {
  const oldPacmanPackages: Set<string> = new Set(await getPacmanPackages());
  return diffPkgs(oldPacmanPackages, newPackages);
}

/**
 * Compares the installed AUR packages with the new packages and returns the added and removed packages.
 * @returns A promise that resolves added and removed packages.
 */
export async function diffInstalledAurPackages(
  newPackages: Set<string>,
): Promise<DiffResult> {
  const oldAurPackages: Set<string> = new Set(await getAurPackages());
  return diffPkgs(oldAurPackages, newPackages);
}

/**
 * Compares the installed user Flatpak packages with the new packages and returns the added and removed packages.
 * @returns A promise that resolves added and removed packages.
 */
export async function diffInstalledFlatpakUserPackages(
  newPackages: Set<string>,
): Promise<DiffResult> {
  const oldFlatpakPackages: Set<string> = new Set(
    await getUserFlatpakPackages(),
  );
  return diffPkgs(oldFlatpakPackages, newPackages);
}

/**
 * Compares the installed system Flatpak packages with the new packages and returns the added and removed packages.
 * @returns A promise that resolves added and removed packages.
 */
export async function diffInstalledFlatpakSystemPackages(
  newPackages: Set<string>,
): Promise<DiffResult> {
  const oldFlatpakPackages: Set<string> = new Set(
    await getSystemFlatpakPackages(),
  );
  return diffPkgs(oldFlatpakPackages, newPackages);
}
