import { logger } from "../lib/logger";
import { runDoctor } from "../core/detect";

export async function doctorCommand(): Promise<void> {
  logger.info("Detecting System Environment");

  console.log(await runDoctor())

  const env = Object.entries(await runDoctor())
    .filter(([_, value]) => value !== null && value !== false)
    .map(([key, _]) => key);

  console.table(env);
  // console.table(formattedEnv);

  const doctorResult: string[] = [];
  for (const value of env) {
    switch (value) {
      case "pacman":
        doctorResult.push("Pacman detected");
        break;
      case "aurHelper":
        doctorResult.push(`Aur Helper: ${value}`);
        break;
      case "sudo":
        doctorResult.push(`Sudo: ${value}`);
        break;
    }
  }

  logger.boxen(doctorResult.join("\n"), "System Environment");
}
