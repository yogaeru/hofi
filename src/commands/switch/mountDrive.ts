import { unmountDrive, mountDisk } from "#/core/mount";
import type { ConfigDiff } from "#/utils/diff";

export async function switchMountDrive(mounts: ConfigDiff["mounts"]) {
  if (!mounts) return;
  const { added, removed } = mounts;
  if (added) await mountDisk(added);
  if (removed) await unmountDrive(removed);
}
