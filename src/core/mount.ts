// - Restore mount points from systemd unit files done
// -
// -
import { $ } from "bun";
import { abort } from "#/utils/abort";
import { logger } from "#/utils/logger";
import { spawnInteractive } from "#/utils/spawn";
import { configMountDiskTemplate } from "#/core/config/template";
import { makeDir, removeDir, removeFile, exists } from "#/utils/path";

export type MountDiskOptions = {
  description: string;
  uuid: string;
  type: string;
  options: Array<string>;
  wantedBy: string;
};

export type MountDiskConfig = Record<string, MountDiskOptions>;

/**
 * Creates, enables, and starts systemd mount units for the provided disk config.
 * @param options Mount points mapped to mount unit options.
 */
export async function mountDisk(options: MountDiskConfig): Promise<void> {
  // Test mounting disk before creating systemd unit files
  for (const [name, { type, uuid }] of Object.entries(options)) {
    await testMount(name, type, uuid);
  }

  // Generate systemd state and file name
  const templates = await Promise.all(
    Object.entries(options).map(
      async ([mountPoint, config]: [string, MountDiskOptions]): Promise<
        [string, string]
      > => {
        const template = configMountDiskTemplate(mountPoint, config);
        const fileName = `${parseMountPoint(mountPoint).replaceAll("/", "-")}.mount`;

        const isMountPointExist: boolean = await exists(mountPoint);
        if (isMountPointExist) {
          try {
            logger.warn(`Remount ${mountPoint}`);
            await $`sudo systemctl disable --now ${fileName}`;
            console.log();
            await removeFile(`/etc/systemd/system/${fileName}`, true);
          } catch (e) {
            console.log();
            console.error(e);
            abort(
              [
                `Failed to remount ${mountPoint}.`,
                "The mount may still be in use.",
                `Run: sudo fuser -vm ${mountPoint}`,
                "or",
                `Run: sudo lsof +D ${mountPoint}`,
              ].join("\n"),
            );
          }
        }
        return [fileName, template];
      },
    ),
  ); // end templates

  // Create systemd unit files for each mount point
  const services = await Promise.all(
    templates.map(async ([fileName, template]) => {
      await $`printf ${template} | sudo tee /etc/systemd/system/${fileName}`.quiet();
      return fileName;
    }),
  );

  try {
    await $`sudo systemctl daemon-reload`;
    await $`sudo systemctl enable --now ${services.join(" ")}`;
    console.log();
  } catch (error) {
    for (const service of services) {
      const mountPath = `/etc/systemd/system/${service}`;
      if (await exists(mountPath)) {
        await removeFile(mountPath, true);
      }
    }
    abort(`Error enabling systemd units for mount points`);
  }
}

// unmount drive
export async function unmountDrive(config: MountDiskConfig) {
  for (const name of Object.keys(config)) {
    const service = `${parseMountPoint(name).replaceAll("/", "-")}.mount`;
    const mountPath = `/etc/systemd/system/${service}`;
    await $`sudo systemctl disable --now ${service}`;
    if (await exists(mountPath)) {
      await removeFile(mountPath, true);
    }
  }
}

async function testMount(mountPoint: string, type: string, uuid: string) {
  let mounted = false;
  const exist = await exists(mountPoint);
  if (!exist) await makeDir(mountPoint, true);

  try {
    await spawnInteractive([
      "sudo",
      "mount",
      "-t",
      type,
      `/dev/disk/by-uuid/${uuid}`,
      mountPoint,
    ]);
    console.log();
    mounted = true;
  } catch (error) {
    console.error(error);
    abort(`Failed to mount ${mountPoint} (${type}, ${uuid})`);
  } finally {
    logger.info("Cleanup Tested Drive");
    if (mounted) await $`sudo umount ${mountPoint}`;
    if (!exist) await removeDir(mountPoint, true);
  }
}

function parseMountPoint(mountPoint: string): string {
  return mountPoint.replace(/^\/+|\/+$/g, "");
}
