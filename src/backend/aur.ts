import { $ } from "bun";

/**
 * Gets the list of AUR packages installed on the system.
 * @returns
 */
export async function getAurPackages() {
  const result = await $`pacman -Qqm`.quiet().text();
  return result.split("\n").filter(Boolean).sort();
}

export async function installAurPackages(packages: string[]) {
  if (packages.length === 0) return;

  const installAur = Bun.spawn(
    ["paru", "-S", "--noconfirm", "--needed", ...packages],
    {
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
    },
  );
  const exitCode = await installAur.exited;
  if (exitCode !== 0) {
    throw new Error(
      `AUR package installation failed with exit code ${exitCode}`,
    );
  }
}
