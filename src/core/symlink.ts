import { $ } from "bun";
import { resolveHomePath } from "#/utils/path";

type PairSymlink = [string, string]

export async function createSymlink(target: string, symlink: string) {
  try {
    await $`ln -s ${target} ${symlink}`;
    return true;
  } catch {
    return false;
  }
}

export async function isSymlinkBroken(symlink: string): Promise<boolean> {
  const resolvedSymlink = resolveHomePath(symlink);

  try {
    await $`[ -L ${resolvedSymlink} ] && [ ! -e ${resolvedSymlink} ]`;
    return true;
  } catch {
    return false;
  }
}

export async function isSymlinkExists(symlink: string) {
  const resolvedSymlink = resolveHomePath(symlink);

  try {
    await $`[ -L ${resolvedSymlink}] && [ -e ${resolvedSymlink}`;
    return true;
  } catch {
    return false;
  }
}
