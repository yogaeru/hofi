import { parseConfigTOML } from "#/utils/parser";
import { ConfigSchema, type Config } from "#/lib/schema";

export async function validateCommand(): Promise<Config | undefined> {
  try {
    const configTOML = await parseConfigTOML("hofi/generated/config.toml");
    const result: Config = ConfigSchema.parse(configTOML);

    console.log("[INFO] config: ", configTOML);
    console.log("[INFO] result: ", result);
    //
    for (const [key, value] of Object.entries(result)) {
      console.log(`[INFO] ${key}`);
      if (typeof value === "object") {
        for (const [subKey, subValue] of Object.entries(value)) {
          console.log(`[INFO] -- ${subKey}`);
        }
      }
    }

    console.log("[INFO] validation successful, no errors founds");
    return result;
  } catch (error) {
    console.error("[ERROR] ", error);
  }
}
