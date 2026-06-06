import { $ } from "bun";
import { logger } from "#/utils/logger";

export async function getPacmanPackages(): Promise<string[]> {
  const packageList = await $`pacman -Qqen`.quiet().text();

  return packageList.split("\n").filter(Boolean).sort();
}

/**
 * Dry-run install to detect conflicts before committing.
 * Returns true if there are no conflicts.
 */
export async function dryRunPacman(packages: Set<string>): Promise<boolean> {
  if (packages.size === 0) return true;
  try {
    await $`pacman -S --needed --noconfirm --print ${packages}`;
    return true;
  } catch {
    return false;
  }
}

/** Install missing pacman packages in a single batch. */
export async function installPacmanPackages(packages: Set<string>): Promise<void> {
  if (packages.size === 0) return;

  // logger.info(
  //   `Installing ${packages.length} pacman package(s): \n${packages.join("\n")}`,
  // );

  // const ok = await dryRunPacman(packages);
  // if (!ok) {
  //   logger.warn(
  //     "Dry-run detected conflicts. Proceeding anyway — check output carefully.",
  //   );
  // }

  const proc = Bun.spawn(["sudo", "pacman", "-S", "--needed", ...packages], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`pacman failed: ${exitCode}`);
  }
}
