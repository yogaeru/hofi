import { $ } from 'bun';

/**
 * Gets the list of AUR packages installed on the system.
 * @returns 
 */
export async function getAurPackages() {
  const result = await $`pacman -Qqm`.quiet().text();
  return result
    .split("\n")
    .filter(Boolean)
    .sort();
}

/**
 * Dry Run install aur packages 
 * @param packages - The list of AUR packages to install.
 */
export async function dryRunInstallAurPackages(packages: string[]) {
  
}
