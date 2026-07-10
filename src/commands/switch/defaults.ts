import { logger } from "#/utils/logger";
import { exists, createBackupConfig } from "#/utils/path";
import {
  resolveDefaultMimeApp,
  serializeMimeApps,
  type MimeApps,
} from "#/core/mimeapps";
import { writeFile } from "#/utils/write";
import type { Apps, Mime } from "#/core/config/schema";

type DefaultAppsConfig =
  | {
      apps?: Apps;
      mime?: Mime;
    }
  | undefined;

export async function switchDefaultApp(
  config: DefaultAppsConfig,
  homePath: string,
) {
  if (!config) return;

  const { apps, mime } = config;

  const configPath = `${homePath}/.config/mimeapps.list`;
  const isConfigExists: boolean = await exists(configPath);

  if (isConfigExists) {
    const backupPath: string = await createBackupConfig(configPath);
    if (backupPath) logger.info(`Backup created: ${backupPath}`);
  }

  const defaultApps = apps
    ? ((await resolveDefaultMimeApp(apps, "object")) as Record<string, string>)
    : {};

  const resultMimeApps: MimeApps = {
    defaultApplications: {
      ...(mime?.defaultApplications ?? {}),
      ...defaultApps,
    },
    addedAssociations: {
      ...(mime?.addedAssociations ?? {}),
    },
  };

  const serializedResultMimeApps: string = serializeMimeApps(resultMimeApps);
  await writeFile(
    serializedResultMimeApps,
    `${homePath}/.config/mimeapps.list`,
  );
}
