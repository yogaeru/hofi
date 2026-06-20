import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { logger } from "./logger";
import { exists} from "./path";

/**
 * Writes the given data to a file at the specified path.
 * @param data - The data to write to the file.
 * @param filePath - The path of the file to write to.
 */
export async function writeFile(data: any, filePath: string) {
  (await exists(filePath))
    ? logger.warn(`Overwriting file in ${filePath}`)
    : logger.info(`Creating New File in ${filePath}`);

  try {
    await mkdir(dirname(filePath), { recursive: true });
    await Bun.write(filePath, data);
    logger.success(`File created successfully at ${filePath}`);
  } catch (e) {
    logger.error(String(e));
  }
}
