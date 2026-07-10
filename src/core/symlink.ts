// - Restore and error handling done
// -
// -
import { $ } from "bun";
import * as fs from "node:fs/promises";

import { abort } from "#/utils/abort";
import { logger } from "#/utils/logger";
import { getErrorCode } from "#/utils/error";
import { type Config } from "./config/schema";
import { exists, resolvePath, createBackupConfig } from "#/utils/path";

export type ConfigSymlink = Config["symlinks"];

export type Symlink = {
  target: string;
  link: string;
};

type SymlinkTasks = {
  backup: string[];
  create: Symlink[];
};

export async function removeSymlink(config: ConfigSymlink) {
  if (!config) return;
  for (const symlink of Object.values(config)) {
    const { link } = symlink;
    const isLink = await isSymlink(link);
    if (!isLink) continue;
    await fs.unlink(link);
    logger.info(`Removed symlink: ${link}`);
  }
}

/**
 * Creates symlinks based on the provided configuration.
 * @param config - The added symlink configuration to process.
 */
export async function makeSymlink(config: ConfigSymlink): Promise<void> {
  if (!config) return;
  const tasks: SymlinkTasks = {
    backup: [],
    create: [],
  };

  const createdSymlinks: string[] = [];
  const backupSymlinks: string[] = [];

  await Promise.all(
    Object.values(config).map(async (symlink: Symlink) => {
      await classifySymlink(symlink, tasks);
    }),
  );

  const { backup, create } = tasks;
  // logger.info(`Backup symlinks: ${backup}`);
  // logger.info(`Create symlinks: ${create}`);

  try {
    for (const linkPath of backup) {
      const backupPath = await createBackupConfig(linkPath);
      if (backupPath) logger.info(`Backup path: ${backupPath}`);
      backupSymlinks.push(backupPath);
    }

    for (const { target, link } of create) {
      await ensureSymlink(target, link);
      createdSymlinks.push(link);
    }
  } catch (error) {
    await restoreTasks(createdSymlinks, backupSymlinks);
    abort(
      `Error caused with code ${getErrorCode(error)}, restore applied config`,
    );
  }

  logger.success("Symlinks created successfully");
}

/**
 * Restores the symlinks to their original state by removing the created symlinks and restoring the backup symlinks.
 */
async function restoreTasks(create: string[], backup: string[]) {
  for (const link of [...create].reverse()) {
    await fs.rm(link, { force: true, recursive: true });
    logger.info(`Removed: ${link}`);
  }

  for (const linkPath of [...backup].reverse()) {
    if (!linkPath) continue;
    const backupPath = `${linkPath}.bak`;
    await fs.rename(backupPath, linkPath);
    logger.info(`Restore: ${backupPath} -> ${linkPath}`);
  }
  logger.success("Symlinks restored successfully");
}

async function classifySymlink(symlink: Symlink, tasks: SymlinkTasks) {
  const { target, link } = symlink;

  const targetExists = await exists(target);
  const linkExists = await exists(link);

  if (!targetExists) throw new Error(`Target path does not exist: ${target}`);

  // console.log("Link EXIST: ", linkExists);
  if (linkExists) tasks.backup.push(link);

  tasks.create.push(symlink);
}

async function ensureSymlink(target: string, link: string) {
  let recreate = false;
  const [isLink, isBroken] = await Promise.all([
    isSymlink(link),
    isBrokenSymlink(link),
  ]);
  // if (isLink) {
  //   logger.warn(`Symlink already exist and not broken, skip create - ${link}`);
  //   return;
  // }
  if (isBroken || isLink) {
    await fs.unlink(link);
    logger.warn(`Recreate symlink: ${target} -> ${link}`);
    recreate = true;
  }
  await fs.symlink(target, link);
  if (!recreate) logger.info(`Creating symlink: ${target} -> ${link}`);
}

async function isBrokenSymlink(symlink: string): Promise<boolean> {
  const resolvedSymlink = resolvePath(symlink);

  try {
    await $`[ -L ${resolvedSymlink} ] && [ ! -e ${resolvedSymlink} ]`;
    return true;
  } catch {
    return false;
  }
}

async function isSymlink(symlink: string): Promise<boolean> {
  const resolvedSymlink = resolvePath(symlink);

  try {
    await $`[ -L ${resolvedSymlink} ] && [ -e ${resolvedSymlink} ]`;
    return true;
  } catch {
    return false;
  }
}
