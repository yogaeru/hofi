
/**
 * Spawn shell process
 * @param cmd - The command to execute.
 * @param errorMessage - The error message to throw if the command fails.
 */
export async function spawnInteractive(
  cmd: string[],
  errorMessage?: string,
): Promise<void> {
  const proc = Bun.spawn(cmd, {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(
      errorMessage ?? `Error caused with exit code ${exitCode}`,
    );
  }
}