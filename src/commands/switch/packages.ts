import { type PackagesDiff, type DiffPkgsResult } from "#/utils/diff";
import {
  installPacmanPackages,
  removePacmanPackages,
} from "#/backend/pacman";
import {
  installAurPackages,
  removeAurPackages,
} from "#/backend/aur";
import {
  removeUserFlatpakPackages,
  installUserFlatpakPackages,
  removeSystemFlatpakPackages,
  installSystemFlatpakPackages,
} from "#/backend/flatpak";
import { getErrorCode } from "#/utils/error";
import { abort } from "#/utils/abort";

type SwitchPackage = PackagesDiff | undefined;
type FlatpakPackages = PackagesDiff["flatpak"];

export async function switchPackages(
  config: SwitchPackage,
) {
  if (!config) return;

  const { pacman, aur, flatpak } = config;

  try {
    await switchPacman(pacman);
    await switchAur(aur);
    await switchFlatpak(flatpak);
  } catch (error) {
    const code = getErrorCode(error);
    abort(`Failed to install packages, error code: ${code}`);
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
  const { added, removed } = config;

  await installUserFlatpakPackages(added.user ?? []);
  await removeUserFlatpakPackages(removed.user ?? []);

  await installSystemFlatpakPackages(added.system ?? []);
  await removeSystemFlatpakPackages(removed.system ?? []);
}
