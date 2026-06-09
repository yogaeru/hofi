import { $ } from "bun";
import { configMountDiskTemplate } from "#/lib/template";

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
 * @returns Promise
 */
export async function mountDisk(options: MountDiskConfig): Promise<void> {
  const templates: string[][] = await Promise.all(
    Object.entries(options).map(
      async ([name, config]: [string, MountDiskOptions]): Promise<[string, string]> => {
        const fileName = `${parseMountPoint(name).replaceAll("/", "-")}.mount`;
        const template = await configMountDiskTemplate(name, config);
        return [fileName, template];
      },
    ),
  );

  await Promise.all(
    templates.map(async ([fileName, template]: string[]): Promise<void> => {
      await $`printf ${template} | sudo tee /etc/systemd/system/${fileName}`;
      await $`sudo systemctl daemon-reload`;
      await $`sudo systemctl enable --now ${fileName}`;
    }),
  );
}

/**
 * Normalizes a mount point into a unit-friendly name fragment
 * @param mountPoint The filesystem mount point.
 * @returns The trimmed mount point without leading or trailing slashes.
 */
function parseMountPoint(mountPoint: string): string {
  return mountPoint.replace(/^\/+|\/+$/g, "");
}
