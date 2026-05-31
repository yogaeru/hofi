import { z } from "zod";

export const ConfigSchema = z.object({
  user: z.object({
    name: z.string(),
    homeDir: z.string(),
  }),

  packages: z.object({
    pacman: z.array(z.string()),
    aur: z.array(z.string()),
    flatpak: z.array(z.string()),
  }),

  default: z.object({
    apps: z.object({
      browser: z.string(),
    }),

    mime: z.object({
      defaultApplication: z.record(z.string(), z.string()),
      addedAssociations: z.record(z.string(), z.string()),
    }),
  }),

  mkSymlink: z.record(
    z.string(), // source path
    z.string(), // target path
  ),

  diskMount: z.record(
    z.string(), // mount point (mis. "/mnt/data")
    z.object({
      description: z.string(),
      uuid: z.string(),
      type: z.string(),
      options: z.array(z.string()),
      wantedBy: z.string(),
    }),
  ),
});

export type Config = z.infer<typeof ConfigSchema>;
