import { logger } from "#/utils/logger";

/**
 *
 * Compares two lists of pacman packages and returns the added and removed packages.
 *
 * @param oldPackages
 * @param newPackages
 * @returns
 */
export async function diffPacmanPackages(
  oldPackages: string[],
  newPackages: string[],
) {
  const added = newPackages.filter((p) => !oldPackages.includes(p));
  const removed = oldPackages.filter((p) => !newPackages.includes(p));

  logger.info(
    `Diffing pacman packages: added ${added.length}, removed ${removed.length}`,
  );
  if (added.length > 0) logger.info(`Added packages: ${added.join(", ")}`);

  if (removed.length > 0)
    logger.info(`Removed packages: ${removed.join(", ")}`);

  return {
    added,
    removed,
  };
}
