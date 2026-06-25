import { $ } from "bun";
import { abort } from "#/utils/abort";
import { logger } from "#/utils/logger";
import { spawnInteractive } from "#/utils/spawn";
import { makeDir, removeDir, removeFile } from "#/utils/path";
import { configMountDiskTemplate } from "#/core/config/template";

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

  const templates = Object.entries(options).map(
    ([name, config]: [string, MountDiskOptions]): [string, string] => {
      const fileName = `${parseMountPoint(name).replaceAll("/", "-")}.mount`;
      const template = configMountDiskTemplate(name, config);
      return [fileName, template];
    },
  );

  const services = await Promise.all(
    templates.map(async ([fileName, template]) => {
      await $`printf ${template} | sudo tee /etc/systemd/system/${fileName}`.quiet();
      return fileName;
    }),
  );

  try {
    await $`sudo systemctl daemon-reload`;
    await $`sudo systemctl enable --now ${services.join(" ")}`;
  } catch (error) {
    for (const service of services) {
      await removeFile(`/etc/systemd/system/${service}`, true);
    }
    abort(`Error enabling systemd units for mount points`);
  }
}

async function testMount(mountPoint: string, type: string, uuid: string) {
  await makeDir(mountPoint, true);
  try {
    await spawnInteractive(["sudo", "mount", "-t", type, `/dev/disk/by-uuid/${uuid}`, mountPoint]);
    await $`sudo umount ${mountPoint}`;
    await removeDir(mountPoint, true);
  } catch (error) {
    await removeDir(mountPoint, true);
    logger.error(error)
    abort(`Failed to mount ${mountPoint} (${type}, ${uuid})`);
  }
}

function parseMountPoint(mountPoint: string): string {
  return mountPoint.replace(/^\/+|\/+$/g, "");
}
