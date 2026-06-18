import { getPacmanPackages } from "#/backend/pacman";
import { getAurPackages } from "#/backend/aur";
import { logger } from "./logger";

type DiffResult = {
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
export function printDiffResult(result: DiffResult) {
  const { added: addedPackages, removed: removedPackages } = result;
  if (addedPackages.length === 0 && removedPackages.length === 0) {
    logger.info("No changes");
    return;
  }
  if (addedPackages.length > 0) {
    logger.info("Added packages:");
    addedPackages.forEach((pkg) => logger.add(`${pkg}`));
    console.log();
  }
  if (removedPackages.length > 0) {
    logger.info("Removed packages:");
    removedPackages.forEach((pkg) => logger.remove(`${pkg}`));
    console.log();
  }
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
 * Compares the installed Flatpak packages with the new packages and returns the added and removed packages.
 * @returns A promise that resolves added and removed packages.
 */
export function diffFlatpakPackages(
  oldPackages: Set<string>,
  newPackages: Set<string>,
): DiffResult {
  return diffPkgs(oldPackages, newPackages);
}
