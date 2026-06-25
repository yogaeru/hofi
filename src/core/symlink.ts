import { $ } from "bun";
import * as fs from "node:fs/promises";
import { logger } from "#/utils/logger";
import { type Config } from "./config/schema";
import { exists, resolvePath, createBackupConfig } from "#/utils/path";

export type ConfigSymlink = Config["symlink"];

export type Symlink = {
  target: string;
  link: string;
};

type SymlinkTasks = {
  backup: string[];
  create: Symlink[];
};

export async function makeSymlink(config: ConfigSymlink) {
  if (!config) return;
  const tasks: SymlinkTasks = {
    backup: [],
    create: [],
  };

  await Promise.all(
    Object.entries(config).map(async ([name, symlink]: [string, Symlink]) => {
      await classifySymlink(symlink, tasks);
    }),
  );

  const { backup, create } = tasks;
  // logger.info(`Backup symlinks: ${backup}`);
  // logger.info(`Create symlinks: ${create}`);

  for (const linkPath of backup) {
    const backupPath = await createBackupConfig(linkPath);
    if (backupPath) logger.info(`Backup path: ${backupPath}`);
  }

  for (const { target, link } of create) {
    await ensureSymlink(target, link);
  }
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

/**
 * Check if a symlink is broken.
 */
async function isBrokenSymlink(symlink: string): Promise<boolean> {
  const resolvedSymlink = resolvePath(symlink);

  try {
    await $`[ -L ${resolvedSymlink} ] && [ ! -e ${resolvedSymlink} ]`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a symlink is a symlink.
 */
async function isSymlink(symlink: string): Promise<boolean> {
  const resolvedSymlink = resolvePath(symlink);

  try {
    await $`[ -L ${resolvedSymlink} ] && [ -e ${resolvedSymlink} ]`;
    return true;
  } catch {
    return false;
  }
}
