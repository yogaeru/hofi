
/**
 * Spawn shell process
 * @param cmd 
 * @param errorMessage 
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
      errorMessage ?? `Command "${cmd[0]}" failed with exit code ${exitCode}`,
    );
  }
}