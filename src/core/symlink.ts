import { $ } from "bun";
import { exists, resolvePath, createBackupConfig } from "#/utils/path";
import { logger } from "#/utils/logger";

/**
 * Creates symlinks based on the provided configuration.
 * @param config The configuration object where keys are target paths and values are symlink paths.
 * @returns A promise that resolves when all symlinks have been created or updated.
 */
export async function mkSymlinkConfig(config: Record<string, string>) {
  await Promise.all(
    Object.entries(config).map(
      async ([target, symlink]: [string, string]): Promise<void> => {
        await syncSymlink(target, symlink);
      },
    ),
  );
}

/**
 * Synchronizes a symlink from `target` to `symlink`, creating or updating it as necessary.
 * @param target The target path to link to.
 * @param symlink The symlink path to create or update.
 * @returns A promise that resolves when the symlink has been synchronized.
 */
async function syncSymlink(target: string, symlink: string) {
  const [resolvedTarget, resolvedSymlink] = await Promise.all([
    resolvePath(target),
    resolvePath(symlink),
  ]);

  const [brokenSymlink, symlinkExist, isTargetPathExist, isSymlinkPathExist] =
    await Promise.all([
      isBrokenSymlink(resolvedSymlink),
      isSymlink(resolvedSymlink),
      exists(resolvedTarget),
      exists(resolvedSymlink),
    ]);

  if (!isTargetPathExist) {
    throw new Error(`Target path does not exist: ${resolvedTarget}`);
  }

  if (symlinkExist) return;

  if (brokenSymlink) {
    await recreateSymlink(target, symlink);
    logger.info(`RECREATE SYMLINK: ${resolvedTarget} -> ${resolvedSymlink}`);
    return;
  }

  if (isSymlinkPathExist) {
    const archive: string = await createBackupConfig(resolvedSymlink);
    if (archive) logger.info(`BACKUP: ${resolvedSymlink} -> ${archive}`);
  }

  await createSymlink(resolvedTarget, resolvedSymlink);
  logger.info(`SYMLINK: ${resolvedTarget} -> ${resolvedSymlink}`);
}

/**
 *  Create a symlink from `target` to `symlink`.
 * @param target
 * @param symlink
 * @returns Boolean indicating whether the symlink was created successfully.
 */
export async function createSymlink(target: string, symlink: string) {
  try {
    await $`ln -s ${target} ${symlink}`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Recreate a symlink from `target` to `symlink`.
 * @param target
 * @param symlink
 * @returns Boolean indicating whether the symlink was recreated successfully.
 */
export async function recreateSymlink(target: string, symlink: string) {
  try {
    await $`ln -sfn ${target} ${symlink}`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a symlink is broken.
 * @param symlink
 * @returns Boolean indicating whether the symlink is broken.
 */
async function isBrokenSymlink(symlink: string): Promise<boolean> {
  const resolvedSymlink = await resolvePath(symlink);

  try {
    await $`[ -L ${resolvedSymlink} ] && [ ! -e ${resolvedSymlink} ]`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a symlink is a symlink.
 * @param symlink
 * @returns Boolean indicating whether the symlink is a symlink.
 */
async function isSymlink(symlink: string): Promise<boolean> {
  const resolvedSymlink = await resolvePath(symlink);

  try {
    await $`[ -L ${resolvedSymlink} ] && [ -e ${resolvedSymlink} ]`;
    return true;
  } catch {
    return false;
  }
}
