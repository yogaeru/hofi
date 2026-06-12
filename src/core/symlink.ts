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
        const [resolvedTarget, resolvedSymlink] = await Promise.all([
          resolvePath(target),
          resolvePath(symlink),
        ]);

        const [isBroken, isSymlinkExist, isTargetExist, isPathExist] =
          await Promise.all([
            isBrokenSymlink(resolvedSymlink),
            isSymlink(resolvedSymlink),
            exists(resolvedTarget),
            exists(resolvedSymlink),
          ]);

        if (isPathExist) {
          if (isSymlinkExist) return;
          const archive = await createBackupConfig(resolvedSymlink);
          if (archive) logger.info(`BACKUP: ${resolvedSymlink} -> ${archive}`);
        }

        if (!isTargetExist) {
          throw new Error(`Target path does not exist: ${resolvedTarget}`);
        }

        if (isSymlinkExist) {
          if (isBroken) await recreateSymlink(resolvedTarget, resolvedSymlink);

          return;
        }

        await createSymlink(resolvedTarget, resolvedSymlink);
      },
    ),
  );
}

/**
 *  Create a symlink from `target` to `symlink`.
 * @param target
 * @param symlink
 * @returns
 */
export async function createSymlink(target: string, symlink: string) {
  try {
    await $`ln -s ${target} ${symlink}`;
    return true;
  } catch {
    return false;
  }
}

export async function recreateSymlink(target: string, symlink: string) {
  try {
    await $`ln -sfn ${target} ${symlink}`;
    return true;
  } catch {
    return false;
  }
}

export async function isBrokenSymlink(symlink: string): Promise<boolean> {
  const resolvedSymlink = await resolvePath(symlink);

  try {
    await $`[ -L ${resolvedSymlink} ] && [ ! -e ${resolvedSymlink} ]`;
    return true;
  } catch {
    return false;
  }
}

export async function isSymlink(symlink: string): Promise<boolean> {
  const resolvedSymlink = await resolvePath(symlink);

  try {
    await $`[ -L ${resolvedSymlink} ] && [ -e ${resolvedSymlink} ]`;
    return true;
  } catch {
    return false;
  }
}
