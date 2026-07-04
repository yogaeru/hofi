import { logger } from "#/utils/logger";
import {
  type PackagesDiff,
  type DiffPkgsResult,
  printDiffResult,
} from "#/utils/diff";
import {
  dryRunPacman,
  installPacmanPackages,
  removePacmanPackages,
} from "#/backend/pacman";
import {
  dryRunAurPackages,
  installAurPackages,
  removeAurPackages,
} from "#/backend/aur";
import {
  dryRunFlatpakPakcages,
  removeUserFlatpakPackages,
  installUserFlatpakPackages,
  removeSystemFlatpakPackages,
  installSystemFlatpakPackages,
} from "#/backend/flatpak";

type SwitchPackage = PackagesDiff | undefined;
type FlatpakPackages = PackagesDiff["flatpak"];
type SwitchOptions = {
  dryRun?: boolean;
};

export async function switchPackages(
  config: SwitchPackage,
  options?: SwitchOptions,
) {
  if (!config) return;

  const { dryRun } = options ?? {};

  const { pacman, aur, flatpak } = config;

  try {
    await switchPacman(pacman);
    await switchAur(aur);
    await switchFlatpak(flatpak);
  } catch (e) {
    throw new Error(`Failed to install packages: ${e}`);
  }
}

// Switch pacman packages.
async function switchPacman(pacmanPackages: DiffPkgsResult | undefined) {
  if (!pacmanPackages) return;
  const { added, removed } = pacmanPackages;
  if (added.length === 0 && removed.length === 0) return;

  await installPacmanPackages(added);
  await removePacmanPackages(removed);
}

// Switch AUR packages.
async function switchAur(aurPackages: DiffPkgsResult | undefined) {
  if (!aurPackages) return;
  const { added, removed } = aurPackages;
  if (added.length === 0 && removed.length === 0) return;

  await installAurPackages(added);
  await removeAurPackages(removed);
}

// Switch Flatpak packages.
async function switchFlatpak(config: FlatpakPackages | undefined) {
  if (!config) return;
  const { user, system } = config;

  await installUserFlatpakPackages(user.added);
  await removeUserFlatpakPackages(user.removed);

  await installSystemFlatpakPackages(system.added);
  await removeSystemFlatpakPackages(system.removed);
}
