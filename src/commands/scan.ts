import { logger } from "#/utils/logger";
import { runScan } from "#/core/detect";
import { abortIfRunWithSudo } from "#/utils/abort";

export async function scanCommand(): Promise<void> {
  abortIfRunWithSudo();

  logger.info("Detecting System Environment...");

  const scanResult = await runScan();

  const doctorResult: string[] = [];
  
  // OS Details
  doctorResult.push(`OS:               ${scanResult.os}`);
  
  // Init System
  doctorResult.push(`Init System:      ${scanResult.initSystem}`);

  // Package Managers
  const pkgManagers: string[] = [];
  if (scanResult.pacman) pkgManagers.push("pacman");
  if (scanResult.flatpak) pkgManagers.push("flatpak");
  const pkgStr = pkgManagers.length > 0 ? pkgManagers.join(", ") : "None detected";
  doctorResult.push(`Pkg Managers:     ${pkgStr}`);

  // AUR Helper
  doctorResult.push(`AUR Helper:       ${scanResult.aurHelper ?? "None detected"}`);

  // Sudo
  const sudoStatus: string[] = [];
  if (scanResult.sudo.available) {
    sudoStatus.push("Available");
    if (scanResult.sudo.passwordless) {
      sudoStatus.push("Passwordless");
    }
    if (scanResult.sudo.isRoot) {
      sudoStatus.push("Running as Root");
    } else {
      sudoStatus.push("Running as User");
    }
  } else {
    sudoStatus.push("Not available");
  }
  doctorResult.push(`Sudo:             ${sudoStatus.join(" / ")}`);

  // Checked At
  doctorResult.push(`\nChecked At:       ${scanResult.checkedAt}`);

  console.log("\nSystem Environment Report");
  console.log(doctorResult.join("\n"));
}
